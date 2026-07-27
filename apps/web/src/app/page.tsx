'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock live market tickers
const INITIAL_TICKERS = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', price: 67245.50, change: 2.45, volume: '1.2B USDT', high: 68100.00, low: 65400.00 },
  { symbol: 'ETH/USDT', name: 'Ethereum', price: 3482.15, change: -1.18, volume: '840M USDT', high: 3590.00, low: 3410.00 },
  { symbol: 'USDC/USDT', name: 'USD Coin', price: 1.0001, change: 0.02, volume: '320M USDT', high: 1.0005, low: 0.9998 },
];

export default function LandingPage() {
  const [tickers, setTickers] = useState(INITIAL_TICKERS);

  // Simulate price ticks for dynamic display
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((t) => {
          if (t.symbol === 'USDC/USDT') return t;
          const drift = (Math.random() - 0.48) * (t.price * 0.001); // slight upward bias
          const newPrice = Number((t.price + drift).toFixed(2));
          const pctChange = Number((t.change + (Math.random() - 0.5) * 0.05).toFixed(2));
          return {
            ...t,
            price: newPrice,
            change: pctChange,
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary selection:bg-accent-gold selection:text-background-primary">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border-slate/50 bg-background-primary/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent-gold via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-accent-gold/20 group-hover:scale-105 transition-transform">
                <span className="text-background-primary font-bold text-xl">K</span>
              </div>
              <span className="font-bold text-2xl tracking-wider bg-gradient-to-r from-text-primary via-white to-accent-gold bg-clip-text text-transparent">
                KRYNDEX
              </span>
            </Link>
            <nav className="hidden md:flex space-x-6 text-sm font-medium text-text-secondary">
              <Link href="/markets" className="hover:text-accent-gold transition-colors">Markets</Link>
              <Link href="/trade" className="hover:text-accent-gold transition-colors">Trade</Link>
              <Link href="/dashboard/support" className="hover:text-accent-gold transition-colors">Support</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="text-sm font-medium hover:text-accent-gold transition-colors">
              Log In
            </Link>
            <Link
              href="/auth/register"
              className="bg-accent-gold hover:bg-yellow-500 text-background-primary px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-accent-gold/10 hover:shadow-accent-gold/25 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-success-green/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-surface-elevated/80 border border-border-slate px-3 py-1.5 rounded-full text-xs font-semibold text-accent-gold mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
            <span>TRADE BEYOND LIMITS</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            The Next Generation{' '}
            <span className="bg-gradient-to-r from-accent-gold via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Crypto Exchange
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-text-secondary text-lg md:text-xl mb-10 leading-relaxed">
            Secure, compliant, and lightning-fast centralized trading engine built for institutional precision and retail usability.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto bg-gradient-to-r from-accent-gold to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-background-primary font-bold px-8 py-4 rounded-xl shadow-lg shadow-accent-gold/20 hover:shadow-accent-gold/30 transition-all text-center"
            >
              Get Started Now
            </Link>
            <Link
              href="/trade"
              className="w-full sm:w-auto bg-surface-elevated border border-border-slate hover:bg-border-slate/30 text-text-primary font-bold px-8 py-4 rounded-xl transition-colors text-center"
            >
              Go to Trading
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tickers.map((t) => (
              <div
                key={t.symbol}
                className="bg-surface-elevated/40 border border-border-slate/60 hover:border-border-slate p-6 rounded-2xl backdrop-blur-sm transition-all hover:scale-[1.02]"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="font-bold text-text-primary block text-left text-lg">{t.symbol}</span>
                    <span className="text-xs text-text-secondary block text-left">{t.name}</span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-2 py-0.5 rounded ${
                      t.change >= 0 ? 'text-success-green bg-success-green/10' : 'text-danger-red bg-danger-red/10'
                    }`}
                  >
                    {t.change >= 0 ? '+' : ''}
                    {t.change}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-extrabold tracking-tight">
                    ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-text-secondary">Vol: {t.volume}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 border-t border-border-slate/40 bg-surface-elevated/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
            Why Traders Choose{' '}
            <span className="bg-gradient-to-r from-accent-gold to-yellow-500 bg-clip-text text-transparent">
              Kryndex
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-surface-elevated/30 border border-border-slate/50">
              <div className="w-12 h-12 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold mb-6 font-bold text-xl">
                🔒
              </div>
              <h3 className="text-xl font-bold mb-3">Double-Entry Ledger Integrity</h3>
              <p className="text-text-secondary leading-relaxed text-sm">
                Every balance lock, trade settlement, fee deduction, and payout balances exactly to zero on our immutable internal ledger.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-surface-elevated/30 border border-border-slate/50">
              <div className="w-12 h-12 rounded-xl bg-success-green/10 flex items-center justify-center text-success-green mb-6 font-bold text-xl">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-3">High-Performance Rust Matching</h3>
              <p className="text-text-secondary leading-relaxed text-sm">
                Active books sit entirely in memory on our Rust engine, ensuring execution latency under a millisecond with replay safety.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-surface-elevated/30 border border-border-slate/50">
              <div className="w-12 h-12 rounded-xl bg-danger-red/10 flex items-center justify-center text-danger-red mb-6 font-bold text-xl">
                🌐
              </div>
              <h3 className="text-xl font-bold mb-3">Regulatory-Ready Framework</h3>
              <p className="text-text-secondary leading-relaxed text-sm">
                Real-time geo-fencing, sanctions checking, standard KYC levels, and full administrative audit logging keep compliance ahead of requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-slate/30 py-12 bg-background-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-md bg-accent-gold flex items-center justify-center font-bold text-background-primary text-sm">
              K
            </div>
            <span className="font-bold text-text-primary tracking-wider">KRYNDEX</span>
          </div>
          <p className="text-xs text-text-secondary">
            &copy; 2026 Kryndex Ltd. All rights reserved. Trade beyond limits responsibly.
          </p>
          <div className="flex space-x-6 text-xs text-text-secondary">
            <a href="#" className="hover:text-accent-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent-gold transition-colors">Terms of Service</a>
            <Link href="/apps/admin" className="hover:text-accent-gold transition-colors font-bold text-accent-gold/80">Admin Panel</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
