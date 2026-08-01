import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma, AccountType, LedgerEntryType } from '@kryndex/database';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LedgerService {

  // 1. INVARIANT INTEGRITY CHECKS
  async verifyLedgerInvariants() {
    const sumEntries = await prisma.ledgerEntry.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    let debitsSum = new Decimal(0);
    let creditsSum = new Decimal(0);

    for (const group of sumEntries) {
      const sum = group._sum.amount ? new Decimal(group._sum.amount) : new Decimal(0);
      if (group.type === LedgerEntryType.DEBIT) debitsSum = sum;
      if (group.type === LedgerEntryType.CREDIT) creditsSum = sum;
    }

    const variance = debitsSum.minus(creditsSum).abs();
    return {
      debits: debitsSum.toString(),
      credits: creditsSum.toString(),
      variance: variance.toString(),
      passed: variance.isZero(),
    };
  }

  // 2. LOCK TRADING ASSETS (Pre-Trade execution check to avoid double spending)
  async lockFunds(tx: any, userId: string, asset: string, amount: Decimal, tradeMode: 'SPOT' | 'MARGIN' = 'SPOT') {
    if (tradeMode === 'MARGIN') {
      const marginBal = await this.getOrCreateMarginBalance(tx, userId, asset);
      if (marginBal.balance.lessThan(amount)) {
        throw new BadRequestException('INSUFFICIENT_AVAILABLE_MARGIN_BALANCE', `Insufficient available margin balance of ${asset}`);
      }
      await tx.marginBalance.update({
        where: { id: marginBal.id },
        data: {
          balance: marginBal.balance.minus(amount),
          lockedBalance: marginBal.lockedBalance.plus(amount),
        },
      });
    } else {
      const account = await this.getOrCreateAccount(tx, userId, asset);
      if (account.balance.lessThan(amount)) {
        throw new BadRequestException('INSUFFICIENT_AVAILABLE_BALANCE', `Insufficient available balance of ${asset}`);
      }
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: account.balance.minus(amount),
          lockedBalance: account.lockedBalance.plus(amount),
        },
      });
    }
  }

  // 3. RELEASE LOCKED ASSETS (On order cancellation)
  async unlockFunds(tx: any, userId: string, asset: string, amount: Decimal, tradeMode: 'SPOT' | 'MARGIN' = 'SPOT') {
    if (tradeMode === 'MARGIN') {
      const marginBal = await this.getOrCreateMarginBalance(tx, userId, asset);
      if (marginBal.lockedBalance.lessThan(amount)) {
        throw new BadRequestException('LOCK_UNDERFLOW', `Cannot unlock more than active locked margin balance of ${asset}`);
      }
      await tx.marginBalance.update({
        where: { id: marginBal.id },
        data: {
          balance: marginBal.balance.plus(amount),
          lockedBalance: marginBal.lockedBalance.minus(amount),
        },
      });
    } else {
      const account = await this.getOrCreateAccount(tx, userId, asset);
      if (account.lockedBalance.lessThan(amount)) {
        throw new BadRequestException('LOCK_UNDERFLOW', `Cannot unlock more than active locked balance of ${asset}`);
      }
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: account.balance.plus(amount),
          lockedBalance: account.lockedBalance.minus(amount),
        },
      });
    }
  }

  // 4. ATOMIC TRADE SETTLEMENT (Settle matched buyer and seller ledger postings)
  async settleTrade(
    tx: any,
    symbol: string,
    buyerId: string,
    sellerId: string,
    price: Decimal,
    quantity: Decimal,
    makerFee: Decimal,
    takerFee: Decimal,
    buyerTradeMode: 'SPOT' | 'MARGIN' = 'SPOT',
    sellerTradeMode: 'SPOT' | 'MARGIN' = 'SPOT',
  ) {
    const [baseAsset, quoteAsset] = symbol.split('_'); // e.g. BTC_USDT -> BTC, USDT
    const totalQuoteCost = quantity.times(price);

    // Fetch accounts
    const buyerBaseAcc = buyerTradeMode === 'MARGIN' ? await this.getOrCreateMarginBalance(tx, buyerId, baseAsset) : await this.getOrCreateAccount(tx, buyerId, baseAsset);
    const buyerQuoteAcc = buyerTradeMode === 'MARGIN' ? await this.getOrCreateMarginBalance(tx, buyerId, quoteAsset) : await this.getOrCreateAccount(tx, buyerId, quoteAsset);
    const sellerBaseAcc = sellerTradeMode === 'MARGIN' ? await this.getOrCreateMarginBalance(tx, sellerId, baseAsset) : await this.getOrCreateAccount(tx, sellerId, baseAsset);
    const sellerQuoteAcc = sellerTradeMode === 'MARGIN' ? await this.getOrCreateMarginBalance(tx, sellerId, quoteAsset) : await this.getOrCreateAccount(tx, sellerId, quoteAsset);

    // Create system fee collectors (representing exchange equity)
    const systemId = '00000000-0000-0000-0000-000000000000'; // Default system uuid
    const systemBaseAcc = await this.getOrCreateAccount(tx, systemId, baseAsset, AccountType.EQUITY);
    const systemQuoteAcc = await this.getOrCreateAccount(tx, systemId, quoteAsset, AccountType.EQUITY);

    // Create ledger transaction entry
    const ledgerTx = await tx.ledgerTransaction.create({
      data: {
        description: `Trade settlement: ${quantity.toString()} ${baseAsset} @ ${price.toString()} ${quoteAsset}`,
      },
    });

    // 1. Settling Base Asset (BTC) - Seller locks base, Buyer receives base
    // Subtract from Seller's locked base
    if (sellerTradeMode === 'MARGIN') {
      await tx.marginBalance.update({
        where: { id: (sellerBaseAcc as any).id },
        data: { lockedBalance: sellerBaseAcc.lockedBalance.minus(quantity) },
      });
    } else {
      await tx.account.update({
        where: { id: (sellerBaseAcc as any).id },
        data: { lockedBalance: sellerBaseAcc.lockedBalance.minus(quantity) },
      });
    }

    // Add to Buyer's available base (minus taker fee in base asset, if applicable)
    const buyerBaseReceived = quantity.minus(takerFee);
    if (buyerTradeMode === 'MARGIN') {
      await tx.marginBalance.update({
        where: { id: (buyerBaseAcc as any).id },
        data: { balance: buyerBaseAcc.balance.plus(buyerBaseReceived) },
      });
    } else {
      await tx.account.update({
        where: { id: (buyerBaseAcc as any).id },
        data: { balance: buyerBaseAcc.balance.plus(buyerBaseReceived) },
      });
    }

    // Add taker fee to System base asset account
    if (takerFee.greaterThan(0)) {
      await tx.account.update({
        where: { id: systemBaseAcc.id },
        data: { balance: systemBaseAcc.balance.plus(takerFee) },
      });
    }

    // Write Ledger entries for Base Asset Transfer
    await tx.ledgerEntry.createMany({
      data: [
        { transactionId: ledgerTx.id, accountId: sellerBaseAcc.id, type: LedgerEntryType.DEBIT, amount: quantity },
        { transactionId: ledgerTx.id, accountId: buyerBaseAcc.id, type: LedgerEntryType.CREDIT, amount: buyerBaseReceived },
        ...(takerFee.greaterThan(0)
          ? [{ transactionId: ledgerTx.id, accountId: systemBaseAcc.id, type: LedgerEntryType.CREDIT, amount: takerFee }]
          : []),
      ],
    });

    // 2. Settling Quote Asset (USDT) - Buyer locks quote, Seller receives quote
    // Subtract from Buyer's locked quote
    if (buyerTradeMode === 'MARGIN') {
      await tx.marginBalance.update({
        where: { id: (buyerQuoteAcc as any).id },
        data: { lockedBalance: buyerQuoteAcc.lockedBalance.minus(totalQuoteCost) },
      });
    } else {
      await tx.account.update({
        where: { id: (buyerQuoteAcc as any).id },
        data: { lockedBalance: buyerQuoteAcc.lockedBalance.minus(totalQuoteCost) },
      });
    }

    // Add to Seller's available quote (minus maker fee in quote asset, if applicable)
    const sellerQuoteReceived = totalQuoteCost.minus(makerFee);
    if (sellerTradeMode === 'MARGIN') {
      await tx.marginBalance.update({
        where: { id: (sellerQuoteAcc as any).id },
        data: { balance: sellerQuoteAcc.balance.plus(sellerQuoteReceived) },
      });
    } else {
      await tx.account.update({
        where: { id: (sellerQuoteAcc as any).id },
        data: { balance: sellerQuoteAcc.balance.plus(sellerQuoteReceived) },
      });
    }

    // Add maker fee to System quote asset account
    if (makerFee.greaterThan(0)) {
      await tx.account.update({
        where: { id: systemQuoteAcc.id },
        data: { balance: systemQuoteAcc.balance.plus(makerFee) },
      });
    }

    // Write Ledger entries for Quote Asset Transfer
    await tx.ledgerEntry.createMany({
      data: [
        { transactionId: ledgerTx.id, accountId: buyerQuoteAcc.id, type: LedgerEntryType.DEBIT, amount: totalQuoteCost },
        { transactionId: ledgerTx.id, accountId: sellerQuoteAcc.id, type: LedgerEntryType.CREDIT, amount: sellerQuoteReceived },
        ...(makerFee.greaterThan(0)
          ? [{ transactionId: ledgerTx.id, accountId: systemQuoteAcc.id, type: LedgerEntryType.CREDIT, amount: makerFee }]
          : []),
      ],
    });
  }

  // Get or initialize account helper
  async getOrCreateAccount(tx: any, userId: string, asset: string, type: AccountType = AccountType.LIABILITY) {
    let account = await tx.account.findUnique({
      where: { userId_asset: { userId, asset } },
    });

    if (!account) {
      // Ensure system owner exists in database if creating system accounts
      const userExists = await tx.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        await tx.user.create({
          data: {
            id: userId,
            email: userId === '00000000-0000-0000-0000-000000000000' ? 'exchange.reserve@kryndex.local' : `${userId}@kryndex.local`,
            passwordHash: '$argon2id$mock_system_reserve_account_non_interactive_key',
          },
        });
      }

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

  async getOrCreateMarginBalance(tx: any, userId: string, asset: string) {
    let balance = await tx.marginBalance.findUnique({
      where: { userId_asset: { userId, asset } },
    });

    if (!balance) {
      const userExists = await tx.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        await tx.user.create({
          data: {
            id: userId,
            email: userId === '00000000-0000-0000-0000-000000000000' ? 'exchange.reserve@kryndex.local' : `${userId}@kryndex.local`,
            passwordHash: '$argon2id$mock_system_reserve_account_non_interactive_key',
          },
        });
      }

      balance = await tx.marginBalance.create({
        data: {
          userId,
          asset,
          balance: new Decimal(0),
          lockedBalance: new Decimal(0),
          borrowed: new Decimal(0),
          interest: new Decimal(0),
        },
      });
    }

    return balance;
  }
}
