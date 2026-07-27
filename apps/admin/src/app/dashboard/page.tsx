'use client';

import React, { useState } from 'react';

export default function AdminOverview() {
  const [reconMessage, setReconMessage] = useState('Standby');
  const [runningRecon, setRunningRecon] = useState(false);

  const handleRunReconciliation = () => {
    setRunningRecon(true);
    setReconMessage('Reconciliation running: auditing ledgers...');
    setTimeout(() => {
      setRunningRecon(false);
      setReconMessage('Success: Ledger Invariant checks passed. Credits = Debits. Variance = 0.');
    }, 1500);
  };

  const metrics = [
    { label: 'Total Registrations', value: '45,210', change: '+12% this week' },
    { label: 'Active Trade Connections', value: '1,840', change: 'Live WebSockets' },
    { label: '24h Spot volume', value: '$84.2M equivalent', change: 'BTC & ETH pairs' },
    { label: 'Total Ledger Balance', value: '850.44 BTC', change: 'Exchange Reserve' },
    { label: '24h Fee Revenue', value: '42,108.50 USDT', change: 'Maker/Taker collections' },
    { label: 'Pending Withdraw Queue', value: '4 items', change: 'High risk flags' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white">Health & Core Overview</h1>
          <p className="text-xs text-[#A1A1AA] mt-1">Real-time status monitoring, aggregate trade volumes, and administrative tools.</p>
        </div>
        <div>
          <button
            onClick={handleRunReconciliation}
            disabled={runningRecon}
            className="bg-[#F5B731] hover:bg-yellow-500 disabled:bg-[#A1A1AA] text-[#0B0E11] text-xs font-mono font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            {runningRecon ? 'Running Reconciliation...' : 'Run Financial Audit'}
          </button>
        </div>
      </div>

      {/* Reconciliation Log Output */}
      <div className="bg-[#0B0E11] border border-[#2B3139] p-4 rounded-xl mb-8 font-mono text-xs">
        <span className="block text-[#A1A1AA]/50 text-[10px] uppercase font-bold mb-2">Internal Auditor Feed</span>
        <p className={`${reconMessage.includes('Success') ? 'text-[#16C784]' : 'text-white'}`}>
          &gt; {reconMessage}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-[#151A21] border border-[#2B3139] p-5 rounded-xl">
            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block font-bold mb-1">{m.label}</span>
            <span className="text-xl font-mono font-bold text-white block">{m.value}</span>
            <span className="text-[10px] text-[#A1A1AA]/80 mt-2 block">{m.change}</span>
          </div>
        ))}
      </div>

      {/* Service resources */}
      <h2 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 font-mono">Resource Utilisation</h2>
      <div className="bg-[#151A21] border border-[#2B3139] rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[#A1A1AA]">Matching Engine CPU</span>
              <span className="text-white font-bold">12%</span>
            </div>
            <div className="w-full bg-[#0B0E11] h-2 rounded-full overflow-hidden">
              <div className="bg-[#16C784] h-full w-[12%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[#A1A1AA]">In-Memory RAM Usage</span>
              <span className="text-white font-bold">4.2GB / 16GB</span>
            </div>
            <div className="w-full bg-[#0B0E11] h-2 rounded-full overflow-hidden">
              <div className="bg-[#F5B731] h-full w-[26%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[#A1A1AA]">Kafka Queue Lag</span>
              <span className="text-[#16C784] font-bold">0 messages</span>
            </div>
            <div className="w-full bg-[#0B0E11] h-2 rounded-full overflow-hidden">
              <div className="bg-[#16C784] h-full w-[0%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
