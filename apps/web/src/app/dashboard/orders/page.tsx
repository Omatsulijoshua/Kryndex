'use client';

import React from 'react';

const ORDER_HISTORY = [
  { id: '10214', date: '2026-07-27 11:20', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', price: 66950.00, qty: 0.0500, filled: 0.0500, status: 'FILLED' },
  { id: '10210', date: '2026-07-26 14:15', pair: 'ETH/USDT', side: 'SELL', type: 'MARKET', price: 3491.20, qty: 1.5000, filled: 1.5000, status: 'FILLED' },
  { id: '10205', date: '2026-07-25 09:30', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', price: 67100.00, qty: 0.1000, filled: 0.1000, status: 'FILLED' },
  { id: '10202', date: '2026-07-25 09:12', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', price: 68500.00, qty: 0.0500, filled: 0.0000, status: 'CANCELLED' },
];

export default function OrdersPage() {
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Order History</h1>
          <p className="text-xs text-[#A1A1AA] mt-1">Review your historical filled, partially filled, and cancelled trades.</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#151A21]/30 border border-[#2B3139] rounded-2xl shadow-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#2B3139] text-[#A1A1AA] uppercase tracking-wider font-semibold">
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Pair</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Filled</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B3139]/40 font-mono text-white">
            {ORDER_HISTORY.map((ord) => (
              <tr key={ord.id} className="hover:bg-[#1E2329]/40">
                <td className="px-6 py-4 text-[#A1A1AA]">{ord.id}</td>
                <td className="px-6 py-4 text-[#A1A1AA] font-sans">{ord.date}</td>
                <td className="px-6 py-4 font-sans font-bold">{ord.pair}</td>
                <td className={`px-6 py-4 font-bold ${ord.side === 'BUY' ? 'text-[#16C784]' : 'text-[#EA3943]'}`}>{ord.side}</td>
                <td className="px-6 py-4 font-sans text-xs">{ord.type}</td>
                <td className="px-6 py-4 text-right">${ord.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-right">{ord.qty.toFixed(4)}</td>
                <td className="px-6 py-4 text-right">{ord.filled.toFixed(4)}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded font-sans font-semibold text-[10px] ${
                      ord.status === 'FILLED'
                        ? 'bg-[#16C784]/10 text-[#16C784]'
                        : 'bg-[#A1A1AA]/10 text-[#A1A1AA]'
                    }`}
                  >
                    {ord.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
