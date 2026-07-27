import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma, AccountType, LedgerEntryType } from '@kryndex/database';
import { Decimal } from '@prisma/client/runtime/library';
import Redis from 'ioredis';

@Injectable()
export class WalletService {
  private readonly SYSTEM_RESERVE_ID = '00000000-0000-0000-0000-000000000000';
  private readonly SYSTEM_FEE_ID = '00000000-0000-0000-0000-000000000002';
  private redisClient!: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || 'kryndex_secure_redis_pass',
    });
  }

  private async publishEvent(channel: string, payload: any) {
    try {
      await this.redisClient.publish(channel, JSON.stringify(payload));
    } catch (err) {
      console.warn(`[WalletService] Redis publish error on channel ${channel}:`, err);
    }
  }

  // 1. GET OR GENERATE DEPOSIT ADDRESS
  async getOrCreateAddress(userId: string, asset: string) {
    let wallet = await prisma.walletAddress.findFirst({
      where: { userId, asset },
    });

    if (!wallet) {
      const prefix = asset === 'BTC' ? 'tb1q' : '0x';
      const randStr = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const address = `${prefix}${randStr.substring(0, 36)}`;

      wallet = await prisma.walletAddress.create({
        data: { userId, asset, address },
      });
    }

    return wallet;
  }

  // 2. SIMULATE BLOCKCHAIN DEPOSIT (Scan and Credit Ledger)
  async simulateDeposit(userId: string, asset: string, amountStr: string, txHash: string) {
    const amount = new Decimal(amountStr);
    if (amount.isNegative() || amount.isZero()) {
      throw new BadRequestException('INVALID_AMOUNT', 'Deposit amount must be greater than zero');
    }

    const wallet = await this.getOrCreateAddress(userId, asset);

    const deposit = await prisma.deposit.create({
      data: {
        userId,
        asset,
        address: wallet.address,
        txHash,
        amount,
        status: 'PENDING',
        confirmations: 0,
      },
    });

    let currentConf = 0;
    const requiredConf = 6;
    let finalDeposit = deposit;

    while (currentConf < requiredConf) {
      currentConf++;
      finalDeposit = await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          confirmations: currentConf,
          status: currentConf >= requiredConf ? 'CONFIRMED' : 'PENDING',
        },
      });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const account = await this.getOrCreateAccount(tx, userId, asset);
      const reserveAcc = await this.getOrCreateAccount(tx, this.SYSTEM_RESERVE_ID, asset, AccountType.ASSET);

      // Debit reserve (increase asset), Credit user (increase liability)
      await tx.account.update({
        where: { id: reserveAcc.id },
        data: { balance: reserveAcc.balance.plus(amount) },
      });

      await tx.account.update({
        where: { id: account.id },
        data: { balance: account.balance.plus(amount) },
      });

      const ledgerTx = await tx.ledgerTransaction.create({
        data: { description: `Blockchain deposit credit: ${amount.toString()} ${asset}. Tx: ${txHash}` },
      });

      await tx.ledgerEntry.createMany({
        data: [
          { transactionId: ledgerTx.id, accountId: reserveAcc.id, type: LedgerEntryType.DEBIT, amount },
          { transactionId: ledgerTx.id, accountId: account.id, type: LedgerEntryType.CREDIT, amount },
        ],
      });

      return finalDeposit;
    });

    try {
      await this.publishEvent(`user:${userId}`, {
        type: 'DEPOSIT_CONFIRMED',
        deposit: {
          id: result.id,
          asset: result.asset,
          amount: result.amount.toString(),
          confirmations: result.confirmations,
          status: result.status,
        },
      });
    } catch (err) {
      console.warn(`[WalletService] Deposit event publish failed:`, err);
    }

    return result;
  }

  // 3. WITHDRAWAL REQUEST
  async requestWithdrawal(userId: string, asset: string, address: string, amountStr: string) {
    const amount = new Decimal(amountStr);
    
    const kyc = await prisma.kycApplication.findFirst({
      where: { userId, status: 'APPROVED' },
    });
    if (!kyc) {
      throw new BadRequestException('KYC_NOT_VERIFIED', 'Withdrawals require KYC compliance approval');
    }

    const withdrawalFee = asset === 'BTC' ? new Decimal('0.0005') : new Decimal('10.0');
    const totalCost = amount.plus(withdrawalFee);

    const result = await prisma.$transaction(async (tx: any) => {
      const account = await this.getOrCreateAccount(tx, userId, asset);

      if (account.balance.lessThan(totalCost)) {
        throw new BadRequestException('INSUFFICIENT_FUNDS', `Insufficient available balance to cover amount and fee (${totalCost.toString()} ${asset})`);
      }

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: account.balance.minus(totalCost),
          lockedBalance: account.lockedBalance.plus(totalCost),
        },
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          asset,
          address,
          amount,
          fee: withdrawalFee,
          status: 'PENDING_APPROVAL',
        },
      });

      return withdrawal;
    });

    try {
      await this.publishEvent(`user:${userId}`, {
        type: 'WITHDRAWAL_REQUESTED',
        withdrawal: {
          id: result.id,
          asset: result.asset,
          amount: result.amount.toString(),
          fee: result.fee.toString(),
          status: result.status,
        },
      });
    } catch (err) {
      console.warn(`[WalletService] Withdrawal request event publish failed:`, err);
    }

    return result;
  }

  // 4. ADMIN APPROVAL / REJECTION
  async handleWithdrawalApproval(withdrawalId: string, status: 'APPROVED' | 'REJECTED', reviewerId: string) {
    const result = await prisma.$transaction(async (tx: any) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
      });

      if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
      if (withdrawal.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException('ALREADY_RESOLVED', `Withdrawal request status is already ${withdrawal.status}`);
      }

      const totalLockedRefund = new Decimal(withdrawal.amount).plus(new Decimal(withdrawal.fee));
      const account = await this.getOrCreateAccount(tx, withdrawal.userId, withdrawal.asset);

      if (status === 'REJECTED') {
        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: account.balance.plus(totalLockedRefund),
            lockedBalance: account.lockedBalance.minus(totalLockedRefund),
          },
        });

        return tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'REJECTED', reviewComments: `Rejected by admin ${reviewerId}` },
        });
      }

      // Settle withdrawal transfers
      // Deduct from User's locked balances
      await tx.account.update({
        where: { id: account.id },
        data: { lockedBalance: account.lockedBalance.minus(totalLockedRefund) },
      });

      // Credit system reserve and system fee account
      const reserveAcc = await this.getOrCreateAccount(tx, this.SYSTEM_RESERVE_ID, withdrawal.asset, AccountType.ASSET);
      const systemFeeAcc = await this.getOrCreateAccount(tx, this.SYSTEM_FEE_ID, withdrawal.asset, AccountType.EQUITY);

      // Decrement reserve balance (assets leave hot wallet)
      await tx.account.update({
        where: { id: reserveAcc.id },
        data: { balance: reserveAcc.balance.minus(new Decimal(withdrawal.amount)) },
      });

      // Increment system fees collection (equity increases)
      await tx.account.update({
        where: { id: systemFeeAcc.id },
        data: { balance: systemFeeAcc.balance.plus(new Decimal(withdrawal.fee)) },
      });

      const ledgerTx = await tx.ledgerTransaction.create({
        data: {
          description: `Withdrawal execution: ${withdrawal.amount.toString()} ${withdrawal.asset} to ${withdrawal.address}`,
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          // Debit User account (decreases liability)
          { transactionId: ledgerTx.id, accountId: account.id, type: LedgerEntryType.DEBIT, amount: totalLockedRefund },
          // Credit Reserve account (decreases asset)
          { transactionId: ledgerTx.id, accountId: reserveAcc.id, type: LedgerEntryType.CREDIT, amount: new Decimal(withdrawal.amount) },
          // Credit Fee account (increases equity)
          { transactionId: ledgerTx.id, accountId: systemFeeAcc.id, type: LedgerEntryType.CREDIT, amount: new Decimal(withdrawal.fee) },
        ],
      });

      const mockTxHash = '0x' + Math.random().toString(16).substring(2) + Date.now().toString(16);

      return tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'COMPLETED',
          txHash: mockTxHash,
          reviewComments: `Approved and processed by admin ${reviewerId}`,
        },
      });
    });

    try {
      await this.publishEvent(`user:${result.userId}`, {
        type: 'WITHDRAWAL_STATUS_UPDATE',
        withdrawal: {
          id: result.id,
          asset: result.asset,
          amount: result.amount.toString(),
          status: result.status,
          txHash: result.txHash,
          reviewComments: result.reviewComments,
        },
      });
    } catch (err) {
      console.warn(`[WalletService] Withdrawal update event publish failed:`, err);
    }

    return result;
  }

  private async getOrCreateAccount(tx: any, userId: string, asset: string, type: AccountType = AccountType.LIABILITY) {
    let account = await tx.account.findUnique({
      where: { userId_asset: { userId, asset } },
    });

    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          asset,
          type,
          balance: new Decimal(0),
          lockedBalance: new Decimal(0),
        },
      });
    }

    return account;
  }
}
