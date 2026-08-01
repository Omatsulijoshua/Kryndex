'use client';

import React, { useState, useEffect } from 'react';

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

interface UserOrder {
  id: string;
  pair: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price: number;
  qty: number;
  filled: number;
  status: string;
  date: string;
  tradeMode: 'SPOT' | 'MARGIN';
}

export default function TradingTerminal() {
  const [activeTab, setActiveTab] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [tradeMode, setTradeMode] = useState<'SPOT' | 'MARGIN'>('SPOT');
  const [marginOrderType, setMarginOrderType] = useState<'NORMAL' | 'BORROW' | 'REPAY'>('NORMAL');
  
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('67245.00');
  const [quantity, setQuantity] = useState('0.1');
  const [bids, setBids] = useState(INITIAL_BIDS);
  const [asks, setAsks] = useState(INITIAL_ASKS);
  const [trades, setTrades] = useState(INITIAL_TRADES);
  const [currentPrice, setCurrentPrice] = useState(67244.50);
  const [priceChange, setPriceChange] = useState(2.45);

  // Balances States
  const [spotBalances, setSpotBalances] = useState<Record<string, number>>({
    USDT: 10250.00,
    BTC: 0.1524,
  });

  const [marginBalances, setMarginBalances] = useState<Record<string, { balance: number; locked: number; borrowed: number; interest: number }>>({
    USDT: { balance: 5000.0, locked: 0.0, borrowed: 1000.0, interest: 2.50 },
    BTC: { balance: 0.12, locked: 0.0, borrowed: 0.0, interest: 0.0 },
  });

  // User orders state
  const [userOrders, setUserOrders] = useState<UserOrder[]>([
    { id: '1', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', price: 67100.00, qty: 0.15, filled: 0.0, status: 'OPEN', date: '14:10', tradeMode: 'SPOT' }
  ]);

  // Modal Dialogs state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  
  // Modal forms
  const [transferAsset, setTransferAsset] = useState('USDT');
  const [transferDirection, setTransferDirection] = useState<'SPOT_TO_MARGIN' | 'MARGIN_TO_SPOT'>('SPOT_TO_MARGIN');
  const [transferAmount, setTransferAmount] = useState('');

  const [borrowAsset, setBorrowAsset] = useState('USDT');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowActionType, setBorrowActionType] = useState<'BORROW' | 'REPAY'>('BORROW');

  // Math metrics for Margin Account
  const assetPrices: Record<string, number> = {
    BTC: currentPrice,
    USDT: 1.0,
  };

  const getMarginMetrics = () => {
    let totalAssets = 0;
    let totalDebt = 0;

    Object.keys(marginBalances).forEach((asset) => {
      const price = assetPrices[asset] || 1.0;
      const bal = marginBalances[asset];
      totalAssets += (bal.balance + bal.locked) * price;
      totalDebt += (bal.borrowed + bal.interest) * price;
    });

    const netEquity = totalAssets - totalDebt;
    const marginLevel = totalDebt > 0 ? totalAssets / totalDebt : 999.0;

    return {
      totalAssets,
      totalDebt,
      netEquity,
      marginLevel,
    };
  };

  const metrics = getMarginMetrics();

  // Handle Order Placement
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(quantity);
    const priceNum = activeTab === 'LIMIT' ? Number(price) : currentPrice;
    const cost = qtyNum * priceNum;

    if (qtyNum <= 0 || priceNum <= 0) {
      alert('Invalid quantity or price.');
      return;
    }

    if (tradeMode === 'SPOT') {
      if (side === 'BUY') {
        if (spotBalances.USDT < cost) {
          alert('Insufficient USDT balance in Spot wallet.');
          return;
        }
        setSpotBalances({
          ...spotBalances,
          USDT: spotBalances.USDT - cost,
        });
      } else {
        if (spotBalances.BTC < qtyNum) {
          alert('Insufficient BTC balance in Spot wallet.');
          return;
        }
        setSpotBalances({
          ...spotBalances,
          BTC: spotBalances.BTC - qtyNum,
        });
      }
    } else {
      // Margin mode order logic
      const currentUSDT = marginBalances.USDT;
      const currentBTC = marginBalances.BTC;

      if (side === 'BUY') {
        let availableUSDT = currentUSDT.balance;
        if (marginOrderType === 'BORROW') {
          // Auto borrow simulation (increase debt capacity)
          const needed = cost - availableUSDT;
          if (needed > 0) {
            currentUSDT.balance += needed;
            currentUSDT.borrowed += needed;
            availableUSDT = currentUSDT.balance;
          }
        }

        if (availableUSDT < cost) {
          alert('Insufficient available USDT balance in Margin wallet.');
          return;
        }

        currentUSDT.balance -= cost;
        currentUSDT.locked += cost;
      } else {
        let availableBTC = currentBTC.balance;
        if (marginOrderType === 'BORROW') {
          const needed = qtyNum - availableBTC;
          if (needed > 0) {
            currentBTC.balance += needed;
            currentBTC.borrowed += needed;
            availableBTC = currentBTC.balance;
          }
        }

        if (availableBTC < qtyNum) {
          alert('Insufficient available BTC balance in Margin wallet.');
          return;
        }

        currentBTC.balance -= qtyNum;
        currentBTC.locked += qtyNum;
      }

      setMarginBalances({
        USDT: currentUSDT,
        BTC: currentBTC,
      });
    }

    const newOrder: UserOrder = {
      id: Math.random().toString(),
      pair: 'BTC/USDT',
      side,
      type: activeTab,
      price: priceNum,
      qty: qtyNum,
      filled: 0.0,
      status: 'OPEN',
      date: new Date().toLocaleTimeString().substring(0, 5),
      tradeMode,
    };

    setUserOrders([newOrder, ...userOrders]);
    alert(`Order Placed: ${tradeMode} ${side} ${quantity} BTC @ ${activeTab === 'LIMIT' ? price : 'Market'}`);
  };

  // Handle Order Cancellation
  const handleCancelOrder = (orderId: string) => {
    const order = userOrders.find((o) => o.id === orderId);
    if (!order) return;

    const cost = order.qty * order.price;

    if (order.tradeMode === 'SPOT') {
      if (order.side === 'BUY') {
        setSpotBalances({
          ...spotBalances,
          USDT: spotBalances.USDT + cost,
        });
      } else {
        setSpotBalances({
          ...spotBalances,
          BTC: spotBalances.BTC + order.qty,
        });
      }
    } else {
      // Margin refund
      const currentUSDT = marginBalances.USDT;
      const currentBTC = marginBalances.BTC;

      if (order.side === 'BUY') {
        currentUSDT.locked -= cost;
        currentUSDT.balance += cost;
      } else {
        currentBTC.locked -= order.qty;
        currentBTC.balance += order.qty;
      }

      setMarginBalances({
        USDT: currentUSDT,
        BTC: currentBTC,
      });
    }

    setUserOrders(userOrders.filter((o) => o.id !== orderId));
  };

  // Handle Wallet Transfers
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (amount <= 0) return;

    if (transferDirection === 'SPOT_TO_MARGIN') {
      const spotAvailable = spotBalances[transferAsset] || 0;
      if (spotAvailable < amount) {
        alert('Insufficient available balance in Spot wallet.');
        return;
      }
      setSpotBalances({
        ...spotBalances,
        [transferAsset]: spotAvailable - amount,
      });
      const mBal = marginBalances[transferAsset] || { balance: 0, locked: 0, borrowed: 0, interest: 0 };
      mBal.balance += amount;
      setMarginBalances({
        ...marginBalances,
        [transferAsset]: mBal,
      });
    } else {
      const mBal = marginBalances[transferAsset] || { balance: 0, locked: 0, borrowed: 0, interest: 0 };
      if (mBal.balance < amount) {
        alert('Insufficient available balance in Margin wallet.');
        return;
      }
      mBal.balance -= amount;
      setMarginBalances({
        ...marginBalances,
        [transferAsset]: mBal,
      });
      const spotAvailable = spotBalances[transferAsset] || 0;
      setSpotBalances({
        ...spotBalances,
        [transferAsset]: spotAvailable + amount,
      });
    }

    setIsTransferOpen(false);
    setTransferAmount('');
    alert('Transfer completed successfully!');
  };

  // Handle Borrow / Repay Actions
  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(borrowAmount);
    if (amount <= 0) return;

    const mBal = marginBalances[borrowAsset] || { balance: 0, locked: 0, borrowed: 0, interest: 0 };

    if (borrowActionType === 'BORROW') {
      mBal.balance += amount;
      mBal.borrowed += amount;
      alert(`Successfully borrowed ${amount} ${borrowAsset}!`);
    } else {
      const totalDebt = mBal.borrowed + mBal.interest;
      if (totalDebt <= 0) {
        alert('No outstanding debt for this asset.');
        return;
      }
      if (mBal.balance < amount) {
        alert('Insufficient available margin balance to execute repayment.');
        return;
      }
      const pay = Math.min(amount, totalDebt);
      mBal.balance -= pay;
      if (pay > mBal.interest) {
        const principalPay = pay - mBal.interest;
        mBal.interest = 0;
        mBal.borrowed = Math.max(0, mBal.borrowed - principalPay);
      } else {
        mBal.interest -= pay;
      }
      alert(`Successfully repaid ${pay} ${borrowAsset} of debt!`);
    }

    setMarginBalances({
      ...marginBalances,
      [borrowAsset]: mBal,
    });
    setIsBorrowOpen(false);
    setBorrowAmount('');
  };

  // Tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const isUp = Math.random() > 0.48;
      const tick = Number((Math.random() * 2).toFixed(2));
      const nextPrice = Number((isUp ? currentPrice + tick : currentPrice - tick).toFixed(2));
      
      setCurrentPrice(nextPrice);
      setPriceChange((prev) => Number((prev + (isUp ? 0.02 : -0.02)).toFixed(2)));

      const newTrade = {
        time: new Date().toTimeString().split(' ')[0],
        price: nextPrice,
        qty: Number((Math.random() * 1.5).toFixed(4)),
        side: isUp ? 'BUY' : 'SELL',
      };
      setTrades((prev) => [newTrade, ...prev.slice(0, 9)]);

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
        <div className="w-full lg:w-[320px] border-b lg:border-b-0 lg:border-r border-[#2B3139] flex flex-col shrink-0 h-full overflow-hidden">
          <div className="p-3 border-b border-[#2B3139] bg-[#151A21]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Order Book</h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-between p-3 font-mono text-[10px] overflow-y-auto border-b border-[#2B3139]">
            {/* Asks (Sells) */}
            <div className="space-y-1">
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

            {/* Current Price */}
            <div className="py-2 border-y border-[#2B3139] my-1 text-center">
              <span className={`text-base font-bold font-mono ${priceChange >= 0 ? 'text-[#16C784]' : 'text-[#EA3943]'}`}>
                {currentPrice.toFixed(2)}
              </span>
            </div>

            {/* Bids (Buys) */}
            <div className="space-y-1">
              {bids.map((bid, idx) => (
                <div key={idx} className="grid grid-cols-3 hover:bg-[#1E2329]/50 py-0.5 cursor-pointer">
                  <span className="text-[#16C784]">{bid.price.toFixed(2)}</span>
                  <span className="text-right text-[#F4F4F5]">{bid.qty.toFixed(4)}</span>
                  <span className="text-right text-[#A1A1AA]">{bid.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="h-[250px] flex flex-col bg-[#151A21]/10">
            <div className="p-3 border-b border-[#2B3139] bg-[#151A21]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Recent Market Trades</h3>
            </div>
            <div className="flex-1 p-3 font-mono text-[10px] overflow-y-auto space-y-1">
              <div className="grid grid-cols-3 text-[#A1A1AA]/50 font-sans pb-1">
                <span>Time</span>
                <span className="text-right">Price(USDT)</span>
                <span className="text-right">Amount(BTC)</span>
              </div>
              {trades.map((trade, idx) => (
                <div key={idx} className="grid grid-cols-3 py-0.5">
                  <span className="text-[#A1A1AA]">{trade.time}</span>
                  <span className={`text-right font-bold ${trade.side === 'BUY' ? 'text-[#16C784]' : 'text-[#EA3943]'}`}>{trade.price.toFixed(2)}</span>
                  <span className="text-right text-[#F4F4F5]">{trade.qty.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Workspace */}
        <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-[#2B3139]">
          {/* Price Chart */}
          <div className="flex-1 p-4 flex flex-col relative bg-[#0B0E11]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#A1A1AA]">PRICE CHART (BTC/USDT)</span>
              <div className="flex space-x-1.5 bg-[#151A21] p-0.5 rounded border border-[#2B3139]">
                {['1m', '5m', '15m', '1h', '4h', '1d'].map((time) => (
                  <button key={time} className={`px-2 py-0.5 text-[10px] rounded font-bold ${time === '15m' ? 'bg-[#F5B731] text-[#0B0E11]' : 'text-[#A1A1AA]'}`}>{time}</button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 border border-[#2B3139]/40 bg-[#151A21]/20 rounded-xl relative flex flex-col justify-end p-8 overflow-hidden select-none">
              <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
                {[68000, 67500, 67000, 66500].map((gridPrice) => (
                  <div key={gridPrice} className="w-full border-b border-dashed border-[#A1A1AA] text-[10px] text-right font-mono pr-2 pb-1">{gridPrice}</div>
                ))}
              </div>
              
              <div className="h-64 flex items-end justify-around space-x-1 font-mono">
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

          {/* Lower Center: Order Tabs */}
          <div className="h-[220px] flex flex-col border-t border-[#2B3139] min-h-0 bg-[#151A21]/30">
            <div className="flex border-b border-[#2B3139] bg-[#151A21] px-4 py-2 text-xs font-bold text-[#A1A1AA] gap-6">
              <span className="text-[#F5B731] cursor-pointer">Open Orders ({userOrders.length})</span>
              <span className="hover:text-white cursor-pointer transition-colors">Order History</span>
              <span className="hover:text-white cursor-pointer transition-colors">Trade History</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs text-[#A1A1AA] border-collapse">
                <thead>
                  <tr className="border-b border-[#2B3139]/80 pb-2 text-[10px] uppercase">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Pair</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Mode</th>
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
                      <td className="py-2.5 text-[#A1A1AA] font-sans">{ord.type}</td>
                      <td className={`py-2.5 font-bold ${ord.side === 'BUY' ? 'text-[#16C784]' : 'text-[#EA3943]'}`}>{ord.side}</td>
                      <td className="py-2.5 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.tradeMode === 'MARGIN' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                          {ord.tradeMode}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">${ord.price.toFixed(2)}</td>
                      <td className="py-2.5 text-right">{ord.qty.toFixed(4)}</td>
                      <td className="py-2.5 text-right">{ord.filled.toFixed(2)}%</td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="bg-transparent hover:text-[#EA3943] text-xs font-semibold px-2 py-0.5 border border-[#2B3139] hover:border-[#EA3943] rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                  {userOrders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#A1A1AA] font-sans">
                        No resting orders at the moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Order placement Form */}
        <div className="w-full lg:w-[320px] bg-[#151A21] flex flex-col p-4 shrink-0 overflow-y-auto">
          {/* Main Account Toggle Spot vs Margin */}
          <div className="grid grid-cols-2 bg-[#1E2329] p-1 rounded-xl border border-[#2B3139] mb-4">
            <button
              onClick={() => setTradeMode('SPOT')}
              className={`text-center py-2 text-xs font-bold rounded-lg transition-all ${
                tradeMode === 'SPOT' ? 'bg-[#F5B731] text-[#0B0E11] shadow' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Spot Trading
            </button>
            <button
              onClick={() => setTradeMode('MARGIN')}
              className={`text-center py-2 text-xs font-bold rounded-lg transition-all ${
                tradeMode === 'MARGIN' ? 'bg-orange-500 text-white shadow' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Margin (5x)
            </button>
          </div>

          {/* Margin Level Risk Meter (Visible only in Margin Mode) */}
          {tradeMode === 'MARGIN' && (
            <div className="bg-[#1E2329] border border-[#2B3139]/80 rounded-xl p-3.5 mb-4 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#A1A1AA] font-medium">Margin Ratio</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  metrics.marginLevel > 2.0 ? 'bg-[#16C784]/15 text-[#16C784]' : metrics.marginLevel > 1.5 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {metrics.marginLevel === 999.0 ? 'No Debt' : `${metrics.marginLevel.toFixed(2)}x`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0B0E11] rounded-full overflow-hidden mb-3 relative border border-[#2B3139]/20">
                <div 
                  className={`h-full transition-all ${metrics.marginLevel > 2.0 ? 'bg-[#16C784]' : metrics.marginLevel > 1.5 ? 'bg-yellow-400' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, (metrics.marginLevel / 3) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-[#A1A1AA] font-mono mb-3">
                <div>
                  <span className="block text-[#A1A1AA]/50 text-[9px] uppercase">Net Equity</span>
                  <span className="text-white font-bold">${metrics.netEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="block text-[#A1A1AA]/50 text-[9px] uppercase">Total Debt</span>
                  <span className="text-white font-bold">${metrics.totalDebt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button onClick={() => setIsTransferOpen(true)} className="bg-[#2B3139] hover:bg-[#343A43] text-white py-1 rounded text-[10px] font-bold transition-all">Transfer</button>
                <button onClick={() => { setBorrowActionType('BORROW'); setIsBorrowOpen(true); }} className="bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/20 py-1 rounded text-[10px] font-bold transition-all">Borrow</button>
                <button onClick={() => { setBorrowActionType('REPAY'); setIsBorrowOpen(true); }} className="bg-[#2B3139] hover:bg-[#343A43] text-white py-1 rounded text-[10px] font-bold transition-all">Repay</button>
              </div>
            </div>
          )}

          {/* Buy/Sell Order Panel */}
          <div className="flex bg-[#1E2329] p-1 rounded-lg border border-[#2B3139] mb-4">
            <button
              onClick={() => setSide('BUY')}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all ${
                side === 'BUY' ? 'bg-[#16C784] text-[#0B0E11]' : 'text-[#A1A1AA]'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('SELL')}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all ${
                side === 'SELL' ? 'bg-[#EA3943] text-[#F4F4F5]' : 'text-[#A1A1AA]'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Margin Transaction Type Selector (Borrow/Repay/Normal) */}
          {tradeMode === 'MARGIN' && (
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#0B0E11] border border-[#2B3139]/80 rounded-lg mb-4 text-[10px] font-bold text-center">
              {['NORMAL', 'BORROW', 'REPAY'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarginOrderType(m as any)}
                  className={`py-1.5 rounded transition-all ${
                    marginOrderType === m ? 'bg-orange-500 text-white' : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Order Type Selector */}
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
                <span className="font-mono text-white font-semibold">
                  {tradeMode === 'SPOT' 
                    ? `${spotBalances[side === 'BUY' ? 'USDT' : 'BTC'].toFixed(side === 'BUY' ? 2 : 4)} ${side === 'BUY' ? 'USDT' : 'BTC'}`
                    : `${(marginBalances[side === 'BUY' ? 'USDT' : 'BTC'].balance).toFixed(side === 'BUY' ? 2 : 4)} ${side === 'BUY' ? 'USDT' : 'BTC'}`
                  }
                </span>
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

              {/* Shortcuts */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-bold text-center">
                {['25%', '50%', '75%', '100%'].map((pct) => (
                  <button
                    type="button"
                    key={pct}
                    onClick={() => {
                      const multiplier = parseFloat(pct) / 100;
                      const maxAvailable = tradeMode === 'SPOT' 
                        ? spotBalances[side === 'BUY' ? 'USDT' : 'BTC']
                        : marginBalances[side === 'BUY' ? 'USDT' : 'BTC'].balance;

                      if (side === 'BUY') {
                        const priceVal = activeTab === 'LIMIT' ? Number(price) : currentPrice;
                        setQuantity(((maxAvailable * multiplier) / priceVal).toFixed(4));
                      } else {
                        setQuantity((maxAvailable * multiplier).toFixed(4));
                      }
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
                  ? tradeMode === 'MARGIN' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-[#16C784] hover:bg-emerald-500 text-[#0B0E11]'
                  : tradeMode === 'MARGIN' ? 'bg-orange-700 hover:bg-orange-800 text-white' : 'bg-[#EA3943] hover:bg-red-500 text-white'
              }`}
            >
              {tradeMode === 'SPOT' 
                ? (side === 'BUY' ? 'Buy BTC' : 'Sell BTC')
                : `${side === 'BUY' ? 'Margin Buy' : 'Margin Sell'} BTC ${marginOrderType !== 'NORMAL' ? `(${marginOrderType})` : ''}`
              }
            </button>
          </form>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. MODAL DIALOGS */}
      {/* ==================================================== */}
      
      {/* A. Transfer Spot <=> Margin Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#151A21] border border-[#2B3139] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold mb-4">Transfer Assets</h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Direction</label>
                <select
                  value={transferDirection}
                  onChange={(e) => setTransferDirection(e.target.value as any)}
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                >
                  <option value="SPOT_TO_MARGIN">Spot Account ➔ Margin Account</option>
                  <option value="MARGIN_TO_SPOT">Margin Account ➔ Spot Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Select Asset</label>
                <select
                  value={transferAsset}
                  onChange={(e) => setTransferAsset(e.target.value)}
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                >
                  <option value="USDT">USDT - Tether</option>
                  <option value="BTC">BTC - Bitcoin</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wide">Amount</label>
                  <span className="text-[10px] text-[#A1A1AA]/70 font-mono">
                    Available: {transferDirection === 'SPOT_TO_MARGIN' 
                      ? `${spotBalances[transferAsset]?.toFixed(transferAsset === 'USDT' ? 2 : 4)} ${transferAsset}`
                      : `${marginBalances[transferAsset]?.balance.toFixed(transferAsset === 'USDT' ? 2 : 4)} ${transferAsset}`
                    }
                  </span>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none font-mono"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="flex-1 bg-transparent border border-[#2B3139] text-[#A1A1AA] hover:bg-[#2B3139] py-3 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] py-3 rounded-xl text-sm font-bold transition-all shadow"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Borrow & Repay Debt Modal */}
      {isBorrowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#151A21] border border-[#2B3139] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold mb-4">{borrowActionType === 'BORROW' ? 'Borrow Assets' : 'Repay Debt'}</h3>
            <form onSubmit={handleBorrowSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Action</label>
                <div className="grid grid-cols-2 bg-[#0B0E11] p-1 rounded-lg border border-[#2B3139]">
                  <button
                    type="button"
                    onClick={() => setBorrowActionType('BORROW')}
                    className={`py-2 text-xs font-bold rounded transition-all ${
                      borrowActionType === 'BORROW' ? 'bg-orange-500 text-white' : 'text-[#A1A1AA]'
                    }`}
                  >
                    Borrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowActionType('REPAY')}
                    className={`py-2 text-xs font-bold rounded transition-all ${
                      borrowActionType === 'REPAY' ? 'bg-orange-500 text-white' : 'text-[#A1A1AA]'
                    }`}
                  >
                    Repay
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Select Asset</label>
                <select
                  value={borrowAsset}
                  onChange={(e) => setBorrowAsset(e.target.value)}
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                >
                  <option value="USDT">USDT - Tether</option>
                  <option value="BTC">BTC - Bitcoin</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wide">Amount</label>
                  <span className="text-[10px] text-[#A1A1AA]/70 font-mono">
                    {borrowActionType === 'BORROW' 
                      ? `Max Borrowable: ${(metrics.netEquity * 4 / (assetPrices[borrowAsset] || 1.0)).toFixed(4)} ${borrowAsset}`
                      : `Outstanding Debt: ${(marginBalances[borrowAsset]?.borrowed + marginBalances[borrowAsset]?.interest).toFixed(4)} ${borrowAsset}`
                    }
                  </span>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none font-mono"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBorrowOpen(false)}
                  className="flex-1 bg-transparent border border-[#2B3139] text-[#A1A1AA] hover:bg-[#2B3139] py-3 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-bold transition-all shadow"
                >
                  Confirm {borrowActionType === 'BORROW' ? 'Borrow' : 'Repay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
