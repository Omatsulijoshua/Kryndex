import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { prisma, OrderStatus, TradeMode } from '@kryndex/database';
import { Decimal } from '@prisma/client/runtime/library';
import { MatchingEngine, BookOrder } from './matching-engine';
import { LedgerService } from './ledger.service';
import { MarginService } from './margin.service';
import { PlaceOrderDto, OrderSide } from './dto/order.dto';

import Redis from 'ioredis';

@Injectable()
export class TradeService implements OnModuleInit {
  private redisClient!: Redis;

  constructor(
    private readonly matchingEngine: MatchingEngine,
    private readonly ledgerService: LedgerService,
    private readonly marginService: MarginService,
  ) {
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
      console.warn(`[TradeService] Redis publish error on channel ${channel}:`, err);
    }
  }

  // 1. REHYDRATE MATCHING ENGINE FROM DATABASE RESTING ORDERS (On startup)
  async onModuleInit() {
    console.info('Rehydrating Matching Engine order books from SQL database...');
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED] },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const ord of pendingOrders) {
      const bookOrd: BookOrder = {
        id: ord.id,
        userId: ord.userId,
        symbol: ord.symbol,
        side: ord.side,
        type: ord.type,
        price: new Decimal(ord.price),
        quantity: new Decimal(ord.quantity),
        filledQuantity: new Decimal(ord.filledQuantity),
        timestamp: ord.createdAt.getTime(),
      };
      
      // Load resting orders directly into memory lists without triggering matching cycles
      if (ord.side === OrderSide.BUY) {
        this.matchingEngine['insertBid'](ord.symbol, bookOrd);
      } else {
        this.matchingEngine['insertAsk'](ord.symbol, bookOrd);
      }
    }
    console.info(`Matching Engine fully hydrated with ${pendingOrders.length} active orders.`);
  }

  // 2. PLACE ORDER
  async placeOrder(dto: PlaceOrderDto) {
    const priceDec = new Decimal(dto.price);
    const qtyDec = new Decimal(dto.quantity);
    const [baseAsset, quoteAsset] = dto.symbol.split('_');
    const tradeMode = dto.tradeMode || TradeMode.SPOT;

    if (priceDec.isNegative() || priceDec.isZero()) throw new BadRequestException('Invalid price parameters');
    if (qtyDec.isNegative() || qtyDec.isZero()) throw new BadRequestException('Invalid quantity parameters');

    // Run core matching cycle in a secure DB transaction context
    const result = await prisma.$transaction(async (tx: any) => {
      // Pre-trade risk audit for Margin mode
      if (tradeMode === TradeMode.MARGIN) {
        const risk = await this.marginService.calculateTxMarginLevel(tx, dto.userId);
        if (risk.totalDebt.greaterThan(0) && risk.marginLevel.lessThan(1.5)) {
          throw new BadRequestException(
            'MARGIN_CALL_BLOCKED_ORDER',
            `Cannot place margin order while under margin call warning. Level: ${risk.marginLevel.toFixed(2)}`,
          );
        }
      }

      // 1. Check & Lock Funds
      if (dto.side === OrderSide.BUY) {
        // Buyer needs quoteAsset (e.g. USDT) to purchase BTC
        const cost = qtyDec.times(priceDec);
        await this.ledgerService.lockFunds(tx, dto.userId, quoteAsset, cost, tradeMode);
      } else {
        // Seller needs baseAsset (e.g. BTC) to sell for USDT
        await this.ledgerService.lockFunds(tx, dto.userId, baseAsset, qtyDec, tradeMode);
      }

      // 2. Write Order Record to SQL
      const dbOrder = await tx.order.create({
        data: {
          userId: dto.userId,
          symbol: dto.symbol,
          side: dto.side,
          type: dto.type,
          price: priceDec,
          quantity: qtyDec,
          filledQuantity: new Decimal(0),
          status: OrderStatus.PENDING,
          tradeMode: tradeMode,
        },
      });

      // 3. Process matching against resting order list
      const bookOrd: BookOrder = {
        id: dbOrder.id,
        userId: dbOrder.userId,
        symbol: dbOrder.symbol,
        side: dbOrder.side,
        type: dbOrder.type,
        price: priceDec,
        quantity: qtyDec,
        filledQuantity: new Decimal(0),
        timestamp: dbOrder.createdAt.getTime(),
      };

      const matchResult = this.matchingEngine.matchOrder(bookOrd);

      // 4. Settle Match Trades (Double-Entry settlements)
      for (const trade of matchResult.trades) {
        // Calculate maker and taker fee cuts (e.g. Maker = 10 Bps (0.1%), Taker = 20 Bps (0.2%))
        // Fee charged on the received asset:
        // - Buyer receives BTC (Taker): Taker fee charged in BTC
        // - Seller receives USDT (Maker): Maker fee charged in USDT
        const takerFee = trade.quantity.times(0.002);
        const makerFee = trade.quantity.times(trade.price).times(0.001);

        // Record the spot Trade in SQL database
        await tx.trade.create({
          data: {
            symbol: dto.symbol,
            price: trade.price,
            quantity: trade.quantity,
            buyerId: trade.buyerId,
            sellerId: trade.sellerId,
            buyerOrderId: trade.buyerOrderId,
            sellerOrderId: trade.sellerOrderId,
            makerFee: makerFee,
            takerFee: takerFee,
          },
        });

        // Update resting order fill details in database
        const restingOrderId = dto.side === OrderSide.BUY ? trade.sellerOrderId : trade.buyerOrderId;
        const restingOrder = await tx.order.findUnique({ where: { id: restingOrderId } });
        const restingTradeMode = restingOrder?.tradeMode || TradeMode.SPOT;

        const buyerTradeMode = dto.side === OrderSide.BUY ? tradeMode : restingTradeMode;
        const sellerTradeMode = dto.side === OrderSide.SELL ? tradeMode : restingTradeMode;

        // Mutate credit/debit balances in ledger
        await this.ledgerService.settleTrade(
          tx,
          dto.symbol,
          trade.buyerId,
          trade.sellerId,
          trade.price,
          trade.quantity,
          makerFee,
          takerFee,
          buyerTradeMode,
          sellerTradeMode,
        );

        if (restingOrder) {
          const nextFilled = new Decimal(restingOrder.filledQuantity).plus(trade.quantity);
          const nextStatus = nextFilled.equals(restingOrder.quantity)
            ? OrderStatus.FILLED
            : OrderStatus.PARTIALLY_FILLED;

          await tx.order.update({
            where: { id: restingOrderId },
            data: {
              filledQuantity: nextFilled,
              status: nextStatus,
            },
          });
        }

        // Post-trade auto-liquidation safety checks
        await this.marginService.checkAndLiquidate(tx, trade.buyerId);
        await this.marginService.checkAndLiquidate(tx, trade.sellerId);
      }

      // 5. Update Placed Order record
      const finalFilled = matchResult.filledQuantity;
      const finalStatus = finalFilled.equals(qtyDec)
        ? OrderStatus.FILLED
        : finalFilled.greaterThan(0)
        ? OrderStatus.PARTIALLY_FILLED
        : OrderStatus.PENDING;

      const updatedOrder = await tx.order.update({
        where: { id: dbOrder.id },
        data: {
          filledQuantity: finalFilled,
          status: finalStatus,
        },
      });

      // Post-trade auto-liquidation check for the current placing user
      await this.marginService.checkAndLiquidate(tx, dto.userId);

      return {
        order: updatedOrder,
        matches: matchResult.trades,
      };
    });

    try {
      const { order, matches } = result;

      if (matches.length > 0) {
        await this.publishEvent(`trades:${dto.symbol}`, {
          symbol: dto.symbol,
          trades: matches.map((t: any) => ({
            price: t.price.toString(),
            quantity: t.quantity.toString(),
            buyerId: t.buyerId,
            sellerId: t.sellerId,
            timestamp: Date.now(),
          })),
        });

        for (const t of matches) {
          await this.publishEvent(`user:${t.buyerId}`, {
            type: 'TRADE_EXECUTION',
            trade: {
              symbol: dto.symbol,
              side: 'BUY',
              price: t.price.toString(),
              quantity: t.quantity.toString(),
            },
          });
          await this.publishEvent(`user:${t.sellerId}`, {
            type: 'TRADE_EXECUTION',
            trade: {
              symbol: dto.symbol,
              side: 'SELL',
              price: t.price.toString(),
              quantity: t.quantity.toString(),
            },
          });
        }
      }

      await this.publishEvent(`user:${dto.userId}`, {
        type: 'ORDER_UPDATE',
        order: {
          id: order.id,
          symbol: order.symbol,
          side: order.side,
          status: order.status,
          price: order.price.toString(),
          quantity: order.quantity.toString(),
          filledQuantity: order.filledQuantity.toString(),
        },
      });

      const depth = this.matchingEngine.getOrderBook(dto.symbol);
      await this.publishEvent(`orderbook:${dto.symbol}`, depth);
    } catch (err) {
      console.warn(`[TradeService] Match event publish failed:`, err);
    }

    return result;
  }

  // 3. CANCEL ORDER
  async cancelOrder(orderId: string) {
    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status === OrderStatus.FILLED || order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException(`Cannot cancel order in ${order.status} state`);
      }

      // Remove order from in-memory engine book
      this.matchingEngine.cancelOrder(order.symbol, orderId, order.side);
      
      const unfilledQty = new Decimal(order.quantity).minus(order.filledQuantity);

      // Unlock resting assets back to user account
      const [baseAsset, quoteAsset] = order.symbol.split('_');
      if (order.side === OrderSide.BUY) {
        const lockedQuoteRefund = unfilledQty.times(order.price);
        await this.ledgerService.unlockFunds(tx, order.userId, quoteAsset, lockedQuoteRefund, order.tradeMode);
      } else {
        await this.ledgerService.unlockFunds(tx, order.userId, baseAsset, unfilledQty, order.tradeMode);
      }

      // Update DB record status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      return updatedOrder;
    });

    try {
      await this.publishEvent(`user:${result.userId}`, {
        type: 'ORDER_CANCELLED',
        order: {
          id: result.id,
          symbol: result.symbol,
          status: result.status,
        },
      });

      const depth = this.matchingEngine.getOrderBook(result.symbol);
      await this.publishEvent(`orderbook:${result.symbol}`, depth);
    } catch (err) {
      console.warn(`[TradeService] Cancel event publish failed:`, err);
    }

    return result;
  }

  // 4. GET ACTIVE USER ORDERS
  async getUserOrders(userId: string): Promise<any[]> {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
