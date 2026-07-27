'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const INITIAL_MARKETS = [
  { symbol: 'BTC/USDT', base: 'BTC', quote: 'USDT', price: 67245.50, change: 2.45, high24h: 68100.00, low24h: 65400.00, volume24h: '1.2B USDT' },
  { symbol: 'ETH/USDT', base: 'ETH', quote: 'USDT', price: 3482.15, change: -1.18, high24h: 3590.00, low24h: 3410.00, volume24h: '840M USDT' },
  { symbol: 'USDC/USDT', base: 'USDC', quote: 'USDT', price: 1.0001, change: 0.02, high24h: 1.0005, low24h: 0.9998, volume24h: '320M USDT' },
  { symbol: 'BTC/USDC', base: 'BTC', quote: 'USDC', price: 67235.10, change: 2.41, high24h: 68080.00, low24h: 65380.00, volume24h: '45M USDC' },
  { symbol: 'ETH/USDC', base: 'ETH', quote: 'USDC', price: 3481.50, change: -1.21, high24h: 3588.00, low24h: 3408.00, volume24h: '28M USDC' },
];

export default function MarketsPage() {
  const [markets, setMarkets] = useState(INITIAL_MARKETS);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.symbol === 'USDC/USDT') return m;
          const drift = (Math.random() - 0.49) * (m.price * 0.0005);
          const newPrice = Number((m.price + drift).toFixed(2));
          const pctChange = Number((m.change + (Math.random() - 0.5) * 0.03).toFixed(2));
          return {
            ...m,
            price: newPrice,
            change: pctChange,
          };
        })
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const filteredMarkets = markets.filter((m) =>
    m.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* Navigation Header */}
      <header className="border-b border-border-slate/50 bg-background-primary/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent-gold to-amber-600 flex items-center justify-center">
                <span className="text-background-primary font-bold text-xl">K</span>
              </div>
              <span className="font-bold text-2xl tracking-wider">KRYNDEX</span>
            </Link>
            <nav className="hidden md:flex space-x-6 text-sm font-medium text-text-secondary">
              <Link href="/markets" className="text-accent-gold">Markets</Link>
              <Link href="/trade" className="hover:text-accent-gold transition-colors">Trade</Link>
              <Link href="/dashboard/support" className="hover:text-accent-gold transition-colors">Support</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/profile" className="text-sm hover:text-accent-gold transition-colors">Dashboard</Link>
            <Link href="/auth/logout" className="text-xs text-text-secondary hover:text-danger-red transition-colors">Log Out</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold mb-6 tracking-tight">Market Overview</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search coin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-elevated border border-border-slate px-4 py-2 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-gold"
            />
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button className="bg-accent-gold text-background-primary text-xs font-bold px-4 py-2 rounded-lg shadow-sm">All Markets</button>
            <button className="bg-surface-elevated text-text-secondary text-xs hover:text-text-primary px-4 py-2 rounded-lg border border-border-slate/50 transition-colors">Favorites</button>
          </div>
        </div>

        {/* Markets Table */}
        <div className="overflow-x-auto bg-surface-elevated/20 border border-border-slate rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-slate text-text-secondary text-xs font-semibold uppercase">
                <th className="px-6 py-4">Pair</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">24h Change</th>
                <th className="px-6 py-4 text-right">24h High</th>
                <th className="px-6 py-4 text-right">24h Low</th>
                <th className="px-6 py-4 text-right">24h Volume</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-slate/40 text-sm">
              {filteredMarkets.map((m) => (
                <tr key={m.symbol} className="hover:bg-surface-elevated/40 transition-colors group">
                  <td className="px-6 py-4 font-bold">
                    <span className="text-text-primary">{m.base}</span>
                    <span className="text-text-secondary text-xs">/{m.quote}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium">
                    ${m.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${m.change >= 0 ? 'text-success-green' : 'text-danger-red'}`}>
                    {m.change >= 0 ? '+' : ''}{m.change}%
                  </td>
                  <td className="px-6 py-4 text-right text-text-secondary font-mono">
                    ${m.high24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-text-secondary font-mono">
                    ${m.low24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-text-secondary font-mono">
                    {m.volume24h}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/trade?pair=${m.symbol.replace('/', '_')}`}
                      className="bg-surface-elevated border border-border-slate hover:bg-accent-gold hover:border-accent-gold hover:text-background-primary text-text-primary px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-block"
                    >
                      Trade
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredMarkets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary text-sm">
                    No trading pairs match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
