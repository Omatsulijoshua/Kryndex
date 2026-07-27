'use client';

import React, { useState, useEffect, useRef } from 'react';

// Hardcoded L2 Order Book seed
const INITIAL_ASKS = [
  { price: 67250.00, qty: 0.4501, total: 30269.22 },
  { price: 67249.50, qty: 1.2500, total: 27244.38 },
  { price: 67248.00, qty: 0.0850, total: 5716.08 },
  { price: 67246.50, qty: 2.1030, total: 141419.39 },
  { price: 67245.50, qty: 0.6120, total: 41154.25 },
];

const INITIAL_BIDS = [
  { price: 67244.00, qty: 0.8804, total: 59201.62 },
  { price: 67243.50, qty: 1.5000, total: 100865.25 },
  { price: 67241.00, qty: 0.1240, total: 8337.88 },
  { price: 67240.00, qty: 3.4500, total: 231978.00 },
  { price: 67238.50, qty: 0.7510, total: 50496.11 },
];

const INITIAL_TRADES = [
  { time: '14:24:05', price: 67245.00, qty: 0.1205, side: 'BUY' },
  { time: '14:24:01', price: 67244.50, qty: 1.0500, side: 'SELL' },
  { time: '14:23:55', price: 67244.00, qty: 0.0500, side: 'BUY' },
  { time: '14:23:50', price: 67245.50, qty: 0.4120, side: 'BUY' },
  { time: '14:23:42', price: 67242.00, qty: 1.8400, side: 'SELL' },
];

export default function TradingTerminal() {
  const [activeTab, setActiveTab] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('67245.00');
  const [quantity, setQuantity] = useState('0.1');
  const [bids, setBids] = useState(INITIAL_BIDS);
  const [asks, setAsks] = useState(INITIAL_ASKS);
  const [trades, setTrades] = useState(INITIAL_TRADES);
  const [currentPrice, setCurrentPrice] = useState(67244.50);
  const [priceChange, setPriceChange] = useState(2.45);
  
  // User orders mock state
  const [userOrders, setUserOrders] = useState<any[]>([
    { id: '1', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', price: 67100.00, qty: 0.15, filled: 0.0, status: 'OPEN', date: '2026-07-27 14:10' }
  ]);

  // Handle mock order placement
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder = {
      id: Math.random().toString(),
      pair: 'BTC/USDT',
      side,
      type: activeTab,
      price: activeTab === 'LIMIT' ? Number(price) : currentPrice,
      qty: Number(quantity),
      filled: 0.0,
      status: 'OPEN',
      date: new Date().toLocaleTimeString(),
    };
    setUserOrders([newOrder, ...userOrders]);
    alert(`Mock Order Placed: ${side} ${quantity} BTC @ ${activeTab === 'LIMIT' ? price : 'Market'}`);
  };

  // Simulate tick updates
  useEffect(() => {
    const interval = setInterval(() => {
      const isUp = Math.random() > 0.48;
      const tick = Number((Math.random() * 2).toFixed(2));
      const nextPrice = Number((isUp ? currentPrice + tick : currentPrice - tick).toFixed(2));
      
      setCurrentPrice(nextPrice);
      setPriceChange((prev) => Number((prev + (isUp ? 0.02 : -0.02)).toFixed(2)));

      // Add a trade
      const newTrade = {
        time: new Date().toTimeString().split(' ')[0],
        price: nextPrice,
        qty: Number((Math.random() * 1.5).toFixed(4)),
        side: isUp ? 'BUY' : 'SELL',
      };
      setTrades((prev) => [newTrade, ...prev.slice(0, 9)]);

      // Mutate order book slightly to simulate live feed
      const delta = (Math.random() - 0.5) * 0.5;
      setAsks((prev) =>
        prev.map((a, i) =>
          i === prev.length - 1 ? { ...a, price: Number((nextPrice + 1 + delta).toFixed(2)), qty: Number((a.qty + (Math.random() - 0.5) * 0.05).toFixed(4)) } : a
        )
      );
      setBids((prev) =>
        prev.map((b, i) =>
          i === 0 ? { ...b, price: Number((nextPrice - 1 + delta).toFixed(2)), qty: Number((b.qty + (Math.random() - 0.5) * 0.05).toFixed(4)) } : b
        )
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#F4F4F5] flex flex-col font-sans">
      {/* 1. Header Navigation */}
      <header className="border-b border-[#2B3139] bg-[#151A21] px-4 py-3 flex items-center justify-between h-14 shrink-0">
        <div className="flex items-center space-x-6">
          <span className="font-bold text-lg tracking-wider text-[#F5B731] cursor-pointer">KRYNDEX</span>
          <div className="flex items-center space-x-2 border-l border-[#2B3139] pl-6">
            <span className="font-bold text-sm">BTC/USDT</span>
            <span className={`text-xs font-semibold ${priceChange >= 0 ? 'text-[#16C784]' : 'text-[#EA3943]'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange}%
            </span>
          </div>
        </div>
        <div className="hidden lg:flex items-center space-x-8 text-xs text-[#A1A1AA]">
          <div>
            <span className="block text-[#A1A1AA]/60">24h High</span>
            <span className="font-mono text-white font-medium">68,100.00</span>
          </div>
          <div>
            <span className="block text-[#A1A1AA]/60">24h Low</span>
            <span className="font-mono text-white font-medium">65,400.00</span>
          </div>
          <div>
            <span className="block text-[#A1A1AA]/60">24h Volume(BTC)</span>
            <span className="font-mono text-white font-medium">18,520.44</span>
          </div>
          <div>
            <span className="block text-[#A1A1AA]/60">24h Volume(USDT)</span>
            <span className="font-mono text-white font-medium">1.24B</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs font-medium bg-[#1E2329] border border-[#2B3139] px-2.5 py-1 rounded text-[#F5B731]">
            Standard Verified (KYC 2)
          </span>
        </div>
      </header>

      {/* 2. Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* Left Side: Orderbook & Recent Trades */}
        <div className="w-full lg:w-[320px] border-b lg:border-b-0 lg:border-r border-[#2B3139] flex flex-col shrink-0">
          {/* Orderbook Header */}
          <div className="p-3 border-b border-[#2B3139] bg-[#151A21]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Order Book</h3>
          </div>
          
          {/* Orderbook Table */}
          <div className="flex-1 flex flex-col justify-between p-3 font-mono text-xs overflow-y-auto">
            {/* Asks (Sells) - Red */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 text-[#A1A1AA]/50 font-sans pb-1">
                <span>Price(USDT)</span>
                <span className="text-right">Qty(BTC)</span>
                <span className="text-right">Total</span>
              </div>
              {asks.map((ask, idx) => (
                <div key={idx} className="grid grid-cols-3 hover:bg-[#1E2329]/50 py-0.5 relative cursor-pointer">
                  <span className="text-[#EA3943]">{ask.price.toFixed(2)}</span>
                  <span className="text-right text-[#F4F4F5]">{ask.qty.toFixed(4)}</span>
                  <span className="text-right text-[#A1A1AA]">{ask.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>

            {/* Current Price Ticker */}
            <div className="py-3 border-y border-[#2B3139] my-2 text-center">
              <span className={`text-xl font-bold font-mono ${priceChange >= 0 ? 'text-[#16C784]' : 'text-[#EA3943]'}`}>
                {currentPrice.toFixed(2)}
              </span>
              <span className="text-xs text-[#A1A1AA] block font-sans">≈ ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Bids (Buys) - Green */}
            <div className="space-y-1.5">
              {bids.map((bid, idx) => (
                <div key={idx} className="grid grid-cols-3 hover:bg-[#1E2329]/50 py-0.5 cursor-pointer">
                  <span className="text-[#16C784]">{bid.price.toFixed(2)}</span>
                  <span className="text-right text-[#F4F4F5]">{bid.qty.toFixed(4)}</span>
                  <span className="text-right text-[#A1A1AA]">{bid.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Candlestick Chart & Open Orders */}
        <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-[#2B3139]">
          
          {/* Chart Workspace (Canvas Mock) */}
          <div className="flex-1 p-4 flex flex-col relative bg-[#0B0E11]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#A1A1AA]">PRICE CHART (BTC/USDT)</span>
              <div className="flex space-x-1.5 bg-[#151A21] p-0.5 rounded border border-[#2B3139]">
                {['1m', '5m', '15m', '1h', '4h', '1d'].map((time) => (
                  <button key={time} className={`px-2 py-0.5 text-[10px] rounded font-bold ${time === '15m' ? 'bg-[#F5B731] text-[#0B0E11]' : 'text-[#A1A1AA]'}`}>{time}</button>
                ))}
              </div>
            </div>
            
            {/* Visual Canvas Mock representation of candles */}
            <div className="flex-1 border border-[#2B3139]/40 bg-[#151A21]/20 rounded-xl relative flex flex-col justify-end p-8 overflow-hidden select-none">
              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
                {[68000, 67500, 67000, 66500].map((gridPrice) => (
                  <div key={gridPrice} className="w-full border-b border-dashed border-[#A1A1AA] text-[10px] text-right font-mono pr-2 pb-1">{gridPrice}</div>
                ))}
              </div>
              
              <div className="h-64 flex items-end justify-around space-x-1 font-mono">
                {/* 10 generated candles */}
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-16 bg-[#16C784]" /><div className="w-4 h-12 bg-[#16C784] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-12 bg-[#16C784]" /><div className="w-4 h-8 bg-[#16C784] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-20 bg-[#EA3943]" /><div className="w-4 h-14 bg-[#EA3943] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-8 bg-[#16C784]" /><div className="w-4 h-4 bg-[#16C784] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-14 bg-[#EA3943]" /><div className="w-4 h-10 bg-[#EA3943] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-16 bg-[#16C784]" /><div className="w-4 h-12 bg-[#16C784] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-24 bg-[#16C784]" /><div className="w-4 h-16 bg-[#16C784] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-10 bg-[#EA3943]" /><div className="w-4 h-6 bg-[#EA3943] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-8 bg-[#EA3943]" /><div className="w-4 h-4 bg-[#EA3943] rounded-sm" /></div>
                <div className="w-6 flex flex-col items-center"><div className="w-0.5 h-16 bg-[#16C784]" /><div className="w-4 h-12 bg-[#16C784] rounded-sm" /></div>
              </div>
            </div>
          </div>

          {/* Lower Center: Tabs for Orders */}
          <div className="h-[220px] flex flex-col border-t border-[#2B3139] min-h-0 bg-[#151A21]/30">
            <div className="flex border-b border-[#2B3139] bg-[#151A21] px-4 py-2 text-xs font-bold text-[#A1A1AA] gap-6">
              <span className="text-[#F5B731] cursor-pointer">Open Orders ({userOrders.length})</span>
              <span className="hover:text-white cursor-pointer transition-colors">Order History</span>
              <span className="hover:text-white cursor-pointer transition-colors">Trade History</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs text-[#A1A1AA] border-collapse">
                <thead>
                  <tr className="border-b border-[#2B3139]/80 pb-2">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Pair</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Filled</th>
                    <th className="pb-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]/40 font-mono text-white">
                  {userOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#1E2329]/40">
                      <td className="py-2.5 text-[#A1A1AA] font-sans">{ord.date}</td>
                      <td className="py-2.5 font-sans">{ord.pair}</td>
                      <td className={`py-2.5 font-bold ${ord.side === 'BUY' ? 'text-[#16C784]' : 'text-[#EA3943]'}`}>{ord.side}</td>
                      <td className="py-2.5 text-right">${ord.price.toFixed(2)}</td>
                      <td className="py-2.5 text-right">{ord.qty.toFixed(4)}</td>
                      <td className="py-2.5 text-right">{ord.filled.toFixed(2)}%</td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => setUserOrders(userOrders.filter((o) => o.id !== ord.id))}
                          className="bg-transparent hover:text-[#EA3943] text-xs font-semibold px-2 py-0.5 border border-[#2B3139] hover:border-[#EA3943] rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                  {userOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#A1A1AA] font-sans">
                        No resting orders at the moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Buy/Sell Order Panel */}
        <div className="w-full lg:w-[280px] bg-[#151A21] flex flex-col p-4 shrink-0">
          {/* Order Side Selector */}
          <div className="flex bg-[#1E2329] p-1 rounded-lg border border-[#2B3139] mb-4">
            <button
              onClick={() => setSide('BUY')}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${
                side === 'BUY' ? 'bg-[#16C784] text-[#0B0E11]' : 'text-[#A1A1AA]'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('SELL')}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${
                side === 'SELL' ? 'bg-[#EA3943] text-[#F4F4F5]' : 'text-[#A1A1AA]'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order Type Tabs */}
          <div className="flex space-x-4 border-b border-[#2B3139] pb-2 mb-4 text-xs font-bold text-[#A1A1AA]">
            <span
              onClick={() => setActiveTab('LIMIT')}
              className={`cursor-pointer pb-1 transition-colors ${activeTab === 'LIMIT' ? 'text-[#F5B731] border-b-2 border-[#F5B731]' : ''}`}
            >
              Limit
            </span>
            <span
              onClick={() => setActiveTab('MARKET')}
              className={`cursor-pointer pb-1 transition-colors ${activeTab === 'MARKET' ? 'text-[#F5B731] border-b-2 border-[#F5B731]' : ''}`}
            >
              Market
            </span>
          </div>

          <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-baseline text-xs text-[#A1A1AA]">
                <span>Avbl Balance</span>
                <span className="font-mono text-white font-medium">10,250.00 USDT</span>
              </div>

              {/* Price Input */}
              {activeTab === 'LIMIT' ? (
                <div>
                  <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1 font-bold">Price (USDT)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#0B0E11] border border-[#2B3139] hover:border-[#A1A1AA]/50 px-3 py-2 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-[#F5B731]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1 font-bold">Price</label>
                  <div className="w-full bg-[#0B0E11] border border-[#2B3139]/40 px-3 py-2.5 rounded-lg text-sm text-[#A1A1AA] select-none font-mono">
                    Market Price
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              <div>
                <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1 font-bold">Amount (BTC)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-[#0B0E11] border border-[#2B3139] hover:border-[#A1A1AA]/50 px-3 py-2 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-[#F5B731]"
                />
              </div>

              {/* Amount Shortcuts */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-bold text-center">
                {['25%', '50%', '75%', '100%'].map((pct) => (
                  <button
                    type="button"
                    key={pct}
                    onClick={() => {
                      const multiplier = parseFloat(pct) / 100;
                      setQuantity((0.1524 * multiplier).toFixed(4));
                    }}
                    className="bg-[#1E2329] border border-[#2B3139] text-[#A1A1AA] hover:text-white hover:bg-[#2B3139] py-1 rounded transition-all"
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-black/25 mt-8 transition-transform active:scale-[0.98] ${
                side === 'BUY'
                  ? 'bg-[#16C784] hover:bg-emerald-500 text-[#0B0E11]'
                  : 'bg-[#EA3943] hover:bg-red-500 text-white'
              }`}
            >
              {side === 'BUY' ? 'Buy BTC' : 'Sell BTC'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
