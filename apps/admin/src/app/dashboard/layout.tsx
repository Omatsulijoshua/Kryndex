'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_NAV = [
  { name: 'Health & Overview', path: '/dashboard' },
  { name: 'User Management', path: '/dashboard/users' },
  { name: 'Admin Management', path: '/dashboard/admins' },
  { name: 'KYC Review Desk', path: '/dashboard/kyc' },
  { name: 'Asset & Pairs Configuration', path: '/dashboard/pairs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (localStorage.getItem('admin_logged_in') !== 'true') {
      window.location.href = '/auth/login';
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#F4F4F5] flex flex-col font-sans">
      {/* Admin header */}
      <header className="border-b border-[#2B3139] bg-[#151A21] px-6 py-3 flex items-center justify-between h-16 shrink-0 z-20">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 select-none">
            <img src="/favicon.png" className="w-8 h-8 rounded-lg object-contain bg-[#0B0E11] border border-[#2B3139]" alt="Kryndex Logo" />
            <span className="font-bold tracking-wider text-lg text-white">KRYNDEX CORE ENGINE</span>
          </div>
          <span className="text-[10px] font-mono bg-[#EA3943]/15 text-[#EA3943] px-2.5 py-0.5 rounded font-bold border border-[#EA3943]/20">
            INTERNAL OPS ONLY
          </span>
        </div>
        
        {/* Systems status dots */}
        <div className="hidden lg:flex items-center space-x-6 text-[10px] font-mono text-[#A1A1AA]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse" />
            <span>Postgres: UP</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse" />
            <span>Redis: UP</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse" />
            <span>Kafka: UP</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse" />
            <span>ClickHouse: UP</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <span className="text-[#A1A1AA]">Role:</span>
          <span className="font-bold text-[#F5B731]">SUPER_ADMIN</span>
        </div>
      </header>

      {/* Workspace layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <aside className="w-64 border-r border-[#2B3139] bg-[#151A21]/30 shrink-0 hidden md:flex flex-col p-4 justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] text-[#A1A1AA]/50 font-bold uppercase tracking-wider px-3 mb-3">Ops Navigation</span>
            {ADMIN_NAV.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    active
                      ? 'bg-[#F5B731] text-[#0B0E11] font-bold shadow-md shadow-[#F5B731]/10'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#1E2329]/50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[#2B3139] pt-4">
            <button
              onClick={() => {
                localStorage.removeItem('admin_logged_in');
                window.location.href = '/auth/login';
              }}
              className="w-full text-left block text-xs font-semibold font-mono text-[#A1A1AA] hover:text-[#EA3943] px-3 py-2 transition-colors"
            >
              Terminate Session
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F5B731]/5 rounded-full blur-[100px] pointer-events-none z-0" />
          <div className="max-w-6xl mx-auto relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
