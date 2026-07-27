'use client';

import React from 'react';
import Link from 'next/link';

export default function DashboardOverview() {
  const assetBalances = [
    { coin: 'BTC', name: 'Bitcoin', available: '0.15240000', locked: '0.00000000', value: '10,248.21' },
    { coin: 'ETH', name: 'Ethereum', available: '0.00000000', locked: '0.00000000', value: '0.00' },
    { coin: 'USDT', name: 'Tether', available: '1.79', locked: '0.00', value: '1.79' },
    { coin: 'USDC', name: 'USD Coin', available: '0.00', locked: '0.00', value: '0.00' },
  ];

  const logs = [
    { date: '2026-07-27 13:42', ip: '192.168.1.45', device: 'Chrome / Windows', status: 'Success' },
    { date: '2026-07-26 19:15', ip: '192.168.1.45', device: 'Chrome / Windows', status: 'Success' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#A1A1AA] mt-1">Real-time overview of your balances, assets, and security logs.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/wallet?action=deposit" className="bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all">Deposit</Link>
          <Link href="/dashboard/wallet?action=withdraw" className="bg-[#1E2329] hover:bg-[#2B3139] border border-[#2B3139] text-[#F4F4F5] text-xs font-bold px-4 py-2.5 rounded-lg transition-colors">Withdraw</Link>
        </div>
      </div>

      {/* Account Value Panel */}
      <div className="bg-[#151A21]/40 border border-[#2B3139] rounded-2xl p-6 mb-8 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#F5B731]/5 rounded-full blur-xl pointer-events-none" />
        
        <span className="text-xs text-[#A1A1AA]/70 block font-semibold mb-2">Estimated Balance</span>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold tracking-tight font-mono">$10,250.00</span>
          <span className="text-sm font-semibold text-[#A1A1AA]">USD</span>
        </div>
        <span className="text-[10px] text-[#A1A1AA] mt-2 block font-mono">≈ 0.15241288 BTC</span>
      </div>

      {/* Asset Distribution */}
      <h2 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Your Balances</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {assetBalances.map((asset) => (
          <div key={asset.coin} className="bg-[#151A21] border border-[#2B3139] p-5 rounded-xl hover:border-white/10 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-bold text-lg block">{asset.coin}</span>
                <span className="text-xs text-[#A1A1AA]">{asset.name}</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">${asset.value}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#2B3139]/40 pt-3">
              <div>
                <span className="text-[#A1A1AA]/50 block">Available</span>
                <span className="font-mono text-white font-medium">{asset.available}</span>
              </div>
              <div>
                <span className="text-[#A1A1AA]/50 block">Locked</span>
                <span className="font-mono text-white font-medium">{asset.locked}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checklist / Recent Login Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Status */}
        <div className="bg-[#151A21] border border-[#2B3139] p-6 rounded-xl">
          <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Account Verification Checklist</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-lg">✅</span>
              <div>
                <span className="font-semibold block">Email Verified</span>
                <span className="text-[10px] text-[#A1A1AA]">Email is active and validated.</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-lg">✅</span>
              <div>
                <span className="font-semibold block">Two-Factor Authentication Active</span>
                <span className="text-[10px] text-[#A1A1AA]">TOTP application linked.</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-lg">✅</span>
              <div>
                <span className="font-semibold block">Standard Identity Verified (KYC Level 2)</span>
                <span className="text-[10px] text-[#A1A1AA]">ID Passport reviewed and approved.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Session Logs */}
        <div className="bg-[#151A21] border border-[#2B3139] p-6 rounded-xl">
          <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Recent Access Logs</h3>
          <div className="divide-y divide-[#2B3139]/40 font-mono text-xs">
            {logs.map((log, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                <div>
                  <span className="text-white block font-medium">{log.date}</span>
                  <span className="text-[10px] text-[#A1A1AA] font-sans">{log.device} • {log.ip}</span>
                </div>
                <span className="text-[#16C784] font-semibold font-sans">{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
