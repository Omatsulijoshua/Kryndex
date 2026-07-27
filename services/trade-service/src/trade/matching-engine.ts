import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

export interface BookOrder {
  id: string;
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price: Decimal;
  quantity: Decimal;
  filledQuantity: Decimal;
  timestamp: number;
}

export interface MatchResult {
  trades: {
    buyerOrderId: string;
    sellerOrderId: string;
    buyerId: string;
    sellerId: string;
    price: Decimal;
    quantity: Decimal;
  }[];
  filledQuantity: Decimal;
  orderStatus: 'FILLED' | 'PARTIALLY_FILLED' | 'PENDING';
}

@Injectable()
export class MatchingEngine {
  // Symbol -> Book mapping
  private bids: Map<string, BookOrder[]> = new Map();
  private asks: Map<string, BookOrder[]> = new Map();

  // 1. PLACE ORDER AND MATCH
  matchOrder(order: BookOrder): MatchResult {
    const symbol = order.symbol;
    const trades: MatchResult['trades'] = [];
    let remainingQty = order.quantity.minus(order.filledQuantity);
    let orderFilled = new Decimal(0);

    if (order.side === 'BUY') {
      const askList = this.asks.get(symbol) || [];

      // Loop through resting asks (sorted ascending by price, then time)
      while (askList.length > 0 && remainingQty.greaterThan(0)) {
        const bestAsk = askList[0];

        // For LIMIT buy, price must be greater than or equal to ask price. For MARKET, matching continues.
        if (order.type === 'LIMIT' && order.price.lessThan(bestAsk.price)) {
          break;
        }

        const matchQty = Decimal.min(remainingQty, bestAsk.quantity.minus(bestAsk.filledQuantity));
        const matchPrice = bestAsk.price; // Taker matches at Maker's price

        // Record execution details
        bestAsk.filledQuantity = bestAsk.filledQuantity.plus(matchQty);
        orderFilled = orderFilled.plus(matchQty);
        remainingQty = remainingQty.minus(matchQty);

        trades.push({
          buyerOrderId: order.id,
          sellerOrderId: bestAsk.id,
          buyerId: order.userId,
          sellerId: bestAsk.userId,
          price: matchPrice,
          quantity: matchQty,
        });

        // Remove ask if fully filled
        if (bestAsk.quantity.minus(bestAsk.filledQuantity).isZero()) {
          askList.shift();
        }
      }

      this.asks.set(symbol, askList);

      // If limit order is not fully filled, insert it into resting bids book
      if (order.type === 'LIMIT' && remainingQty.greaterThan(0)) {
        order.filledQuantity = orderFilled;
        this.insertBid(symbol, order);
      }
    } else {
      // Side is SELL
      const bidList = this.bids.get(symbol) || [];

      // Loop through resting bids (sorted descending by price, then time)
      while (bidList.length > 0 && remainingQty.greaterThan(0)) {
        const bestBid = bidList[0];

        // For LIMIT sell, price must be less than or equal to bid price. For MARKET, matching continues.
        if (order.type === 'LIMIT' && order.price.greaterThan(bestBid.price)) {
          break;
        }

        const matchQty = Decimal.min(remainingQty, bestBid.quantity.minus(bestBid.filledQuantity));
        const matchPrice = bestBid.price; // Taker matches at Maker's price

        // Record execution details
        bestBid.filledQuantity = bestBid.filledQuantity.plus(matchQty);
        orderFilled = orderFilled.plus(matchQty);
        remainingQty = remainingQty.minus(matchQty);

        trades.push({
          buyerOrderId: bestBid.id,
          sellerOrderId: order.id,
          buyerId: bestBid.userId,
          sellerId: order.userId,
          price: matchPrice,
          quantity: matchQty,
        });

        // Remove bid if fully filled
        if (bestBid.quantity.minus(bestBid.filledQuantity).isZero()) {
          bidList.shift();
        }
      }

      this.bids.set(symbol, bidList);

      // If limit order is not fully filled, insert it into resting asks book
      if (order.type === 'LIMIT' && remainingQty.greaterThan(0)) {
        order.filledQuantity = orderFilled;
        this.insertAsk(symbol, order);
      }
    }

    const finalStatus = remainingQty.isZero()
      ? 'FILLED'
      : orderFilled.greaterThan(0)
      ? 'PARTIALLY_FILLED'
      : 'PENDING';

    return {
      trades,
      filledQuantity: orderFilled,
      orderStatus: finalStatus,
    };
  }

  // 2. CANCEL RESTING ORDER
  cancelOrder(symbol: string, orderId: string, side: 'BUY' | 'SELL'): BookOrder | null {
    if (side === 'BUY') {
      const bidList = this.bids.get(symbol) || [];
      const idx = bidList.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        const [cancelled] = bidList.splice(idx, 1);
        this.bids.set(symbol, bidList);
        return cancelled;
      }
    } else {
      const askList = this.asks.get(symbol) || [];
      const idx = askList.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        const [cancelled] = askList.splice(idx, 1);
        this.asks.set(symbol, askList);
        return cancelled;
      }
    }
    return null;
  }

  // 3. GET DEPTH ORDER BOOK
  getOrderBook(symbol: string) {
    const askList = this.asks.get(symbol) || [];
    const bidList = this.bids.get(symbol) || [];

    // Group and aggregate ask levels (ascending price)
    const aggregatedAsks = this.aggregateLevels(askList);
    // Group and aggregate bid levels (descending price)
    const aggregatedBids = this.aggregateLevels(bidList).reverse(); // aggregateLevels naturally sorts ascending, so reverse it for bids

    return {
      asks: aggregatedAsks,
      bids: aggregatedBids,
    };
  }

  // Helpers to sort books
  private insertBid(symbol: string, order: BookOrder) {
    const list = this.bids.get(symbol) || [];
    list.push(order);
    // Price descending, then timestamp ascending
    list.sort((a, b) => {
      if (b.price.equals(a.price)) {
        return a.timestamp - b.timestamp;
      }
      return b.price.minus(a.price).toNumber();
    });
    this.bids.set(symbol, list);
  }

  private insertAsk(symbol: string, order: BookOrder) {
    const list = this.asks.get(symbol) || [];
    list.push(order);
    // Price ascending, then timestamp ascending
    list.sort((a, b) => {
      if (a.price.equals(b.price)) {
        return a.timestamp - b.timestamp;
      }
      return a.price.minus(b.price).toNumber();
    });
    this.asks.set(symbol, list);
  }

  private aggregateLevels(orders: BookOrder[]): { price: string; quantity: string }[] {
    const levelsMap: Map<string, Decimal> = new Map();

    for (const order of orders) {
      const priceStr = order.price.toString();
      const qtyStr = order.quantity.minus(order.filledQuantity);
      const current = levelsMap.get(priceStr) || new Decimal(0);
      levelsMap.set(priceStr, current.plus(qtyStr));
    }

    // Sort ascending by price
    const sortedPrices = Array.from(levelsMap.keys()).sort((a, b) => new Decimal(a).minus(new Decimal(b)).toNumber());
    
    return sortedPrices.map((price) => ({
      price,
      quantity: levelsMap.get(price)!.toString(),
    }));
  }

  // Clear memory (used for test resets)
  clearBook(symbol: string) {
    this.bids.delete(symbol);
    this.asks.delete(symbol);
  }
}
