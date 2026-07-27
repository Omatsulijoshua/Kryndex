'use client';

import React, { useState } from 'react';

const INITIAL_PAIRS = [
  { symbol: 'BTC_USDT', base: 'BTC', quote: 'USDT', makerFee: 10, takerFee: 20, minQty: '0.0001', status: 'ACTIVE' },
  { symbol: 'ETH_USDT', base: 'ETH', quote: 'USDT', makerFee: 10, takerFee: 20, minQty: '0.001', status: 'ACTIVE' },
  { symbol: 'USDC_USDT', base: 'USDC', quote: 'USDT', makerFee: 5, takerFee: 10, minQty: '1.0', status: 'ACTIVE' },
];

const INITIAL_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', decimals: 8, fee: '0.0005', depositActive: true, withdrawActive: true },
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, fee: '0.005', depositActive: true, withdrawActive: true },
  { symbol: 'USDT', name: 'Tether', decimals: 6, fee: '10.0', depositActive: true, withdrawActive: true },
];

export default function AdminPairsConfig() {
  const [pairs, setPairs] = useState(INITIAL_PAIRS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);

  const togglePair = (symbol: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    alert(`Mock: Pair ${symbol} set to ${nextStatus}. Re-routing orders...`);
    setPairs(pairs.map((p) => p.symbol === symbol ? { ...p, status: nextStatus } : p));
  };

  const toggleAsset = (symbol: string, field: 'depositActive' | 'withdrawActive', current: boolean) => {
    alert(`Mock: Asset ${symbol} ${field} updated to ${!current}.`);
    setAssets(assets.map((a) => a.symbol === symbol ? { ...a, [field]: !current } : a));
  };

  return (
    <div className="space-y-10">
      {/* 1. Trading Pairs Section */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-mono text-white">Pairs & Asset Administration</h1>
          <p className="text-xs text-[#A1A1AA] mt-1">Configure trading pair fee tiers, tick bounds, and network deposit/withdrawal availability.</p>
        </div>

        <h2 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 font-mono">Spot Trading Pairs</h2>
        <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl overflow-hidden shadow-lg mb-8">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2B3139] text-[#A1A1AA] uppercase font-bold tracking-wider">
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Base</th>
                <th className="px-6 py-4">Quote</th>
                <th className="px-6 py-4 text-right">Maker Fee (Bps)</th>
                <th className="px-6 py-4 text-right">Taker Fee (Bps)</th>
                <th className="px-6 py-4 text-right">Min Qty</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3139]/40 text-white">
              {pairs.map((p) => (
                <tr key={p.symbol} className="hover:bg-[#1E2329]/40">
                  <td className="px-6 py-4 font-bold text-[#F5B731]">{p.symbol}</td>
                  <td className="px-6 py-4">{p.base}</td>
                  <td className="px-6 py-4">{p.quote}</td>
                  <td className="px-6 py-4 text-right pr-12">{p.makerFee} Bps</td>
                  <td className="px-6 py-4 text-right pr-12">{p.takerFee} Bps</td>
                  <td className="px-6 py-4 text-right pr-12">{p.minQty}</td>
                  <td className="px-6 py-4 font-sans">
                    <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${p.status === 'ACTIVE' ? 'bg-[#16C784]/15 text-[#16C784]' : 'bg-[#EA3943]/15 text-[#EA3943]'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-sans">
                    <button
                      onClick={() => togglePair(p.symbol, p.status)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        p.status === 'ACTIVE' ? 'bg-[#EA3943]/15 text-[#EA3943] hover:bg-[#EA3943]/25' : 'bg-[#16C784]/15 text-[#16C784] hover:bg-[#16C784]/25'
                      }`}
                    >
                      {p.status === 'ACTIVE' ? 'Suspend' : 'Resume'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Supported Assets Section */}
      <div>
        <h2 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 font-mono">Supported Assets</h2>
        <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2B3139] text-[#A1A1AA] uppercase font-bold tracking-wider">
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-right">Decimals</th>
                <th className="px-6 py-4 text-right">Withdraw Fee</th>
                <th className="px-6 py-4 text-center">Deposits</th>
                <th className="px-6 py-4 text-center">Withdrawals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3139]/40 text-white">
              {assets.map((a) => (
                <tr key={a.symbol} className="hover:bg-[#1E2329]/40">
                  <td className="px-6 py-4 font-bold text-[#F5B731]">{a.symbol}</td>
                  <td className="px-6 py-4 font-sans font-semibold">{a.name}</td>
                  <td className="px-6 py-4 text-right pr-12">{a.decimals}</td>
                  <td className="px-6 py-4 text-right pr-12">{a.fee} {a.symbol}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleAsset(a.symbol, 'depositActive', a.depositActive)}
                      className={`px-3 py-1 rounded text-[10px] font-bold font-sans transition-colors ${
                        a.depositActive ? 'bg-[#16C784]/15 text-[#16C784]' : 'bg-[#EA3943]/15 text-[#EA3943]'
                      }`}
                    >
                      {a.depositActive ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleAsset(a.symbol, 'withdrawActive', a.withdrawActive)}
                      className={`px-3 py-1 rounded text-[10px] font-bold font-sans transition-colors ${
                        a.withdrawActive ? 'bg-[#16C784]/15 text-[#16C784]' : 'bg-[#EA3943]/15 text-[#EA3943]'
                      }`}
                    >
                      {a.withdrawActive ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
