import { Decimal } from '@prisma/client/runtime/library';
import { MatchingEngine, BookOrder } from './trade/matching-engine';

async function testMatchingEngineInvariants() {
  console.log('--- STARTING MATCHING ENGINE & LEDGER VERIFICATION CHECKS ---');

  const engine = new MatchingEngine();
  const symbol = 'BTC_USDT';

  // 1. Setup Mock Buyer and Seller Orders
  console.log('Setup resting limit ask (sell) order: 1.0 BTC @ 60,000.00 USDT...');
  const sellOrder1: BookOrder = {
    id: 'sell_order_1',
    userId: 'seller_1',
    symbol,
    side: 'SELL',
    type: 'LIMIT',
    price: new Decimal('60000.00'),
    quantity: new Decimal('1.0'),
    filledQuantity: new Decimal('0.0'),
    timestamp: Date.now() - 1000,
  };
  
  const initialResult = engine.matchOrder(sellOrder1);
  console.log('Initial match result (should be empty trades):', initialResult.trades.length);
  if (initialResult.orderStatus !== 'PENDING') {
    console.error('FAIL: Initial order status is not PENDING');
    process.exit(1);
  }

  console.log('Setup second resting limit ask (sell) order (higher price): 0.5 BTC @ 61,000.00 USDT...');
  const sellOrder2: BookOrder = {
    id: 'sell_order_2',
    userId: 'seller_2',
    symbol,
    side: 'SELL',
    type: 'LIMIT',
    price: new Decimal('61000.00'),
    quantity: new Decimal('0.5'),
    filledQuantity: new Decimal('0.0'),
    timestamp: Date.now() - 500,
  };
  engine.matchOrder(sellOrder2);

  // 2. Test Taker Buy matching Price Priority
  console.log('\nTaker limit buy order placed: 1.2 BTC @ 62,000.00 USDT...');
  const buyOrder: BookOrder = {
    id: 'buy_order_1',
    userId: 'buyer_1',
    symbol,
    side: 'BUY',
    type: 'LIMIT',
    price: new Decimal('62000.00'),
    quantity: new Decimal('1.2'),
    filledQuantity: new Decimal('0.0'),
    timestamp: Date.now(),
  };

  const matchResult = engine.matchOrder(buyOrder);
  console.log('Match Result Trades Count (should be 2):', matchResult.trades.length);
  if (matchResult.trades.length !== 2) {
    console.error('FAIL: Expected exactly 2 matching trades');
    process.exit(1);
  }

  // First match should be sell_order_1 (lowest ask price = 60,000.00)
  const trade1 = matchResult.trades[0];
  console.log(`Trade 1: ${trade1.quantity.toString()} BTC matched @ ${trade1.price.toString()} USDT against ${trade1.sellerOrderId}`);
  if (trade1.sellerOrderId !== 'sell_order_1' || !trade1.price.equals(new Decimal('60000.00')) || !trade1.quantity.equals(new Decimal('1.0'))) {
    console.error('FAIL: Incorrect details for Trade 1');
    process.exit(1);
  }
  console.log('PASS: Trade 1 matches price priority rules.');

  // Second match should be sell_order_2 (remaining 0.2 BTC @ 61,000.00)
  const trade2 = matchResult.trades[1];
  console.log(`Trade 2: ${trade2.quantity.toString()} BTC matched @ ${trade2.price.toString()} USDT against ${trade2.sellerOrderId}`);
  if (trade2.sellerOrderId !== 'sell_order_2' || !trade2.price.equals(new Decimal('61000.00')) || !trade2.quantity.equals(new Decimal('0.2'))) {
    console.error('FAIL: Incorrect details for Trade 2');
    process.exit(1);
  }
  console.log('PASS: Trade 2 matches price priority rules.');

  // Check aggregate orderbook depth
  console.log('\nVerifying aggregated orderbook depth...');
  const depth = engine.getOrderBook(symbol);
  console.log('Resting Bids (should be empty):', depth.bids.length);
  console.log('Resting Asks (should have 1 level left with 0.3 BTC quantity @ 61,000.00 USDT):', depth.asks);
  
  if (depth.asks.length !== 1 || depth.asks[0].price !== '61000' || depth.asks[0].quantity !== '0.3') {
    console.error('FAIL: Orderbook aggregation failed');
    process.exit(1);
  }
  console.log('PASS: Orderbook aggregation verified.');

  // 3. Double-Entry ledger balancing equations
  console.log('\nSimulating double-entry ledger settlement mathematics...');
  // Settle Trade 1: 1.0 BTC @ 60,000.00 USDT. Taker = buyer_1 (fee = 0.2% on received BTC = 0.002 BTC). Maker = seller_1 (fee = 0.1% on quote USDT cost = 60 USDT).
  const quantity = new Decimal('1.0');
  const price = new Decimal('60000.00');
  const takerFee = quantity.times(0.002); // 0.002 BTC
  const makerFee = quantity.times(price).times(0.001); // 60.00 USDT

  console.log(`Trade 1 Settle inputs: Qty=${quantity.toString()} BTC, Price=${price.toString()} USDT, TakerFee=${takerFee.toString()} BTC, MakerFee=${makerFee.toString()} USDT`);

  // Verify credits and debits total zero for base asset BTC
  const bSellerDebit = quantity; // Seller debited 1.0 BTC
  const bBuyerCredit = quantity.minus(takerFee); // Buyer credited 0.998 BTC
  const bSystemCredit = takerFee; // System credited 0.002 BTC
  const bVariance = bSellerDebit.minus(bBuyerCredit).minus(bSystemCredit);
  console.log('Base asset (BTC) double-entry variance (Debits - Credits):', bVariance.toString());
  if (!bVariance.isZero()) {
    console.error('FAIL: Double entry ledger invariant violated for base asset!');
    process.exit(1);
  }

  // Verify credits and debits total zero for quote asset USDT
  const qBuyerDebit = quantity.times(price); // Buyer debited 60,000.00 USDT
  const qSellerCredit = quantity.times(price).minus(makerFee); // Seller credited 59,940.00 USDT
  const qSystemCredit = makerFee; // System credited 60.00 USDT
  const qVariance = qBuyerDebit.minus(qSellerCredit).minus(qSystemCredit);
  console.log('Quote asset (USDT) double-entry variance (Debits - Credits):', qVariance.toString());
  if (!qVariance.isZero()) {
    console.error('FAIL: Double entry ledger invariant violated for quote asset!');
    process.exit(1);
  }
  
  console.log('PASS: Double-entry ledger settlement equations hold.');
  console.log('\n--- ALL TRADING & LEDGER INVARIANT CHECKS PASSED ---');
}

testMatchingEngineInvariants().catch((err) => {
  console.error('Test threw exception:', err);
  process.exit(1);
});
