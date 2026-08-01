import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@kryndex/database';
import { Decimal } from '@prisma/client/runtime/library';
import { LedgerService } from './ledger.service';

@Injectable()
export class MarginService {
  constructor(private readonly ledgerService: LedgerService) {}

  // 1. ASSET PRICE RESOLVER (Mock oracle based on standard index prices)
  getAssetPrice(asset: string): number {
    const defaultPrices: Record<string, number> = {
      BTC: 60000.0,
      ETH: 3000.0,
      USDT: 1.0,
      USDC: 1.0,
    };
    return defaultPrices[asset.toUpperCase()] || 1.0;
  }

  // 2. RETRIEVE USER MARGIN ACCOUNT DETAILS
  async getMarginAccount(userId: string) {
    const balances = await prisma.marginBalance.findMany({
      where: { userId },
    });

    let totalAssetValueUSD = new Decimal(0);
    let totalDebtValueUSD = new Decimal(0);

    const assetDetails = balances.map((bal) => {
      const price = new Decimal(this.getAssetPrice(bal.asset));
      const assetQty = new Decimal(bal.balance).plus(new Decimal(bal.lockedBalance));
      const debtQty = new Decimal(bal.borrowed).plus(new Decimal(bal.interest));

      const assetValue = assetQty.times(price);
      const debtValue = debtQty.times(price);

      totalAssetValueUSD = totalAssetValueUSD.plus(assetValue);
      totalDebtValueUSD = totalDebtValueUSD.plus(debtValue);

      return {
        asset: bal.asset,
        balance: bal.balance.toString(),
        lockedBalance: bal.lockedBalance.toString(),
        borrowed: bal.borrowed.toString(),
        interest: bal.interest.toString(),
        assetValueUSD: assetValue.toString(),
        debtValueUSD: debtValue.toString(),
        netBalance: assetQty.minus(debtQty).toString(),
      };
    });

    const netEquityUSD = totalAssetValueUSD.minus(totalDebtValueUSD);
    const marginLevel = totalDebtValueUSD.greaterThan(0)
      ? totalAssetValueUSD.div(totalDebtValueUSD)
      : new Decimal(999.0);

    // Calculate maximum borrow capacities (5x leverage)
    const maxLeveragedAssets = netEquityUSD.times(5);
    const maxBorrowableUSD = Decimal.max(0, maxLeveragedAssets.minus(totalAssetValueUSD));

    const maxBorrowable: Record<string, string> = {};
    const assets = ['BTC', 'ETH', 'USDT', 'USDC'];
    for (const ast of assets) {
      const price = new Decimal(this.getAssetPrice(ast));
      maxBorrowable[ast] = maxBorrowableUSD.div(price).toFixed(8);
    }

    return {
      userId,
      totalAssetValueUSD: totalAssetValueUSD.toString(),
      totalDebtValueUSD: totalDebtValueUSD.toString(),
      netEquityUSD: netEquityUSD.toString(),
      marginLevel: marginLevel.toString(),
      assets: assetDetails,
      maxBorrowable,
    };
  }

  // 3. TRANSFER FUNDS BETWEEN SPOT AND MARGIN
  async transfer(userId: string, asset: string, amountStr: string, direction: 'SPOT_TO_MARGIN' | 'MARGIN_TO_SPOT') {
    const amount = new Decimal(amountStr);
    if (amount.isNegative() || amount.isZero()) {
      throw new BadRequestException('Amount must be positive');
    }

    await prisma.$transaction(async (tx) => {
      if (direction === 'SPOT_TO_MARGIN') {
        // Lock and debit spot account
        const spotAccount = await this.ledgerService.getOrCreateAccount(tx, userId, asset);
        if (spotAccount.balance.lessThan(amount)) {
          throw new BadRequestException('Insufficient available spot balance');
        }

        await tx.account.update({
          where: { id: spotAccount.id },
          data: { balance: spotAccount.balance.minus(amount) },
        });

        // Credit margin account
        const marginBal = await this.getOrCreateMarginBalance(tx, userId, asset);
        await tx.marginBalance.update({
          where: { id: marginBal.id },
          data: { balance: marginBal.balance.plus(amount) },
        });
      } else {
        // Verify margin accounts and deduct balance
        const marginBal = await this.getOrCreateMarginBalance(tx, userId, asset);
        if (marginBal.balance.lessThan(amount)) {
          throw new BadRequestException('Insufficient available margin balance');
        }

        // Subtract and perform risk check
        await tx.marginBalance.update({
          where: { id: marginBal.id },
          data: { balance: marginBal.balance.minus(amount) },
        });

        // Calculate risk levels on updated balance sheet
        const tempAccount = await this.calculateTxMarginLevel(tx, userId);
        if (tempAccount.totalDebt.greaterThan(0) && tempAccount.marginLevel.lessThan(2.0)) {
          throw new BadRequestException(
            'TRANSFER_BLOCKED_BY_RISK',
            `Transfer would reduce margin level to ${tempAccount.marginLevel.toFixed(2)} (Min safety ratio is 2.00)`,
          );
        }

        // Credit spot account
        const spotAccount = await this.ledgerService.getOrCreateAccount(tx, userId, asset);
        await tx.account.update({
          where: { id: spotAccount.id },
          data: { balance: spotAccount.balance.plus(amount) },
        });
      }
    });

    return { status: 'success', direction, asset, amount: amount.toString() };
  }

  // 4. BORROW ASSETS
  async borrow(userId: string, asset: string, amountStr: string) {
    const amount = new Decimal(amountStr);
    if (amount.isNegative() || amount.isZero()) {
      throw new BadRequestException('Amount must be positive');
    }

    await prisma.$transaction(async (tx) => {
      // Calculate current collateral values
      const acc = await this.calculateTxMarginLevel(tx, userId);
      const maxLeveraged = acc.netEquity.times(5);
      const maxBorrowUSD = Decimal.max(0, maxLeveraged.minus(acc.totalAssets));

      const price = new Decimal(this.getAssetPrice(asset));
      const maxBorrowAsset = maxBorrowUSD.div(price);

      if (amount.greaterThan(maxBorrowAsset)) {
        throw new BadRequestException(
          'BORROW_LIMIT_EXCEEDED',
          `Cannot borrow more than max capacity of ${maxBorrowAsset.toFixed(8)} ${asset} (based on current collateral value)`,
        );
      }

      // Add to balance and debt
      const marginBal = await this.getOrCreateMarginBalance(tx, userId, asset);
      await tx.marginBalance.update({
        where: { id: marginBal.id },
        data: {
          balance: marginBal.balance.plus(amount),
          borrowed: marginBal.borrowed.plus(amount),
        },
      });
    });

    return { status: 'success', asset, borrowedAmount: amount.toString() };
  }

  // 5. REPAY DEBT
  async repay(userId: string, asset: string, amountStr: string) {
    const amount = new Decimal(amountStr);
    if (amount.isNegative() || amount.isZero()) {
      throw new BadRequestException('Amount must be positive');
    }

    await prisma.$transaction(async (tx) => {
      const marginBal = await this.getOrCreateMarginBalance(tx, userId, asset);
      const totalDebt = marginBal.borrowed.plus(marginBal.interest);

      if (totalDebt.isZero()) {
        throw new BadRequestException('No active debt exists for this asset');
      }

      if (marginBal.balance.lessThan(amount)) {
        throw new BadRequestException('Insufficient available margin balance to execute repayment');
      }

      const payAmount = Decimal.min(amount, totalDebt);

      // Repay interest first, then principal
      let remainRepay = payAmount;
      let newInterest = marginBal.interest;
      let newBorrowed = marginBal.borrowed;

      if (remainRepay.greaterThan(newInterest)) {
        remainRepay = remainRepay.minus(newInterest);
        newInterest = new Decimal(0);
        newBorrowed = Decimal.max(0, newBorrowed.minus(remainRepay));
      } else {
        newInterest = newInterest.minus(remainRepay);
      }

      await tx.marginBalance.update({
        where: { id: marginBal.id },
        data: {
          balance: marginBal.balance.minus(payAmount),
          borrowed: newBorrowed,
          interest: newInterest,
        },
      });
    });

    return { status: 'success', asset, repaidAmount: amount.toString() };
  }

  // 6. DETECT AND SIMULATE AUTO-LIQUIDATIONS (FOR DANGEROUS POSITIONS)
  async checkAndLiquidate(tx: any, userId: string) {
    const details = await this.calculateTxMarginLevel(tx, userId);
    if (details.totalDebt.greaterThan(0) && details.marginLevel.lessThan(1.1)) {
      console.warn(`[MarginService] Triggering liquidation for user ${userId}. Margin Level: ${details.marginLevel.toString()}`);
      
      // 1. Cancel all resting margin orders
      await tx.order.updateMany({
        where: {
          userId,
          tradeMode: 'MARGIN',
          status: { in: ['PENDING', 'PARTIALLY_FILLED'] },
        },
        data: { status: 'CANCELLED' },
      });

      // 2. Unlocks all locked balances for margin orders
      const userBalances = await tx.marginBalance.findMany({ where: { userId } });
      for (const bal of userBalances) {
        if (bal.lockedBalance.greaterThan(0)) {
          await tx.marginBalance.update({
            where: { id: bal.id },
            data: {
              balance: bal.balance.plus(bal.lockedBalance),
              lockedBalance: new Decimal(0),
            },
          });
        }
      }

      // Re-fetch clean balances
      const balances = await tx.marginBalance.findMany({ where: { userId } });

      // 3. Clear debts using collateral value
      for (const bal of balances) {
        const totalDebt = bal.borrowed.plus(bal.interest);
        if (totalDebt.greaterThan(0)) {
          // Find collateral to liquidate (prefer base/other assets or USDC/USDT)
          const debtUSD = totalDebt.times(new Decimal(this.getAssetPrice(bal.asset)));
          
          // Deduct equivalent value from other non-debt collateral balances
          let remainingDebtUSD = debtUSD;
          for (const collateralBal of balances) {
            if (collateralBal.asset !== bal.asset && collateralBal.balance.greaterThan(0)) {
              const colPrice = new Decimal(this.getAssetPrice(collateralBal.asset));
              const colValueUSD = collateralBal.balance.times(colPrice);

              if (colValueUSD.greaterThan(remainingDebtUSD)) {
                const deductQty = remainingDebtUSD.div(colPrice);
                await tx.marginBalance.update({
                  where: { id: collateralBal.id },
                  data: { balance: collateralBal.balance.minus(deductQty) },
                });
                remainingDebtUSD = new Decimal(0);
                break;
              } else {
                remainingDebtUSD = remainingDebtUSD.minus(colValueUSD);
                await tx.marginBalance.update({
                  where: { id: collateralBal.id },
                  data: { balance: new Decimal(0) },
                });
              }
            }
          }

          // Clear debt values in database
          await tx.marginBalance.update({
            where: { id: bal.id },
            data: {
              borrowed: new Decimal(0),
              interest: new Decimal(0),
              // If debt was partially unpaid due to complete bankrupcy, adjust balance to zero
              balance: remainingDebtUSD.isZero() ? bal.balance : new Decimal(0),
            },
          });
        }
      }

      console.info(`[MarginService] Liquidation complete for user ${userId}. All debts settled.`);
      return true;
    }
    return false;
  }

  // --- HELPER TRANSACTIONS ---
  async getOrCreateMarginBalance(tx: any, userId: string, asset: string) {
    let balance = await tx.marginBalance.findUnique({
      where: { userId_asset: { userId, asset } },
    });

    if (!balance) {
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

  async calculateTxMarginLevel(tx: any, userId: string) {
    const balances = await tx.marginBalance.findMany({ where: { userId } });

    let totalAssets = new Decimal(0);
    let totalDebt = new Decimal(0);

    for (const bal of balances) {
      const price = new Decimal(this.getAssetPrice(bal.asset));
      const assetQty = bal.balance.plus(bal.lockedBalance);
      const debtQty = bal.borrowed.plus(bal.interest);

      totalAssets = totalAssets.plus(assetQty.times(price));
      totalDebt = totalDebt.plus(debtQty.times(price));
    }

    const netEquity = totalAssets.minus(totalDebt);
    const marginLevel = totalDebt.greaterThan(0)
      ? totalAssets.div(totalDebt)
      : new Decimal(999.0);

    return { totalAssets, totalDebt, netEquity, marginLevel };
  }
}
