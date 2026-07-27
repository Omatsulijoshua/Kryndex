'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { name: 'Overview', path: '/dashboard' },
  { name: 'Wallet & Balances', path: '/dashboard/wallet' },
  { name: 'Order History', path: '/dashboard/orders' },
  { name: 'Profile Settings', path: '/dashboard/profile' },
  { name: 'Security & 2FA', path: '/dashboard/security' },
  { name: 'Identity Verification (KYC)', path: '/dashboard/kyc' },
  { name: 'Customer Support', path: '/dashboard/support' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#F4F4F5] flex flex-col font-sans">
      {/* Upper Navigation Header */}
      <header className="border-b border-[#2B3139] bg-[#151A21] px-4 py-3 flex items-center justify-between h-16 shrink-0 z-20">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 select-none">
            <div className="w-8 h-8 rounded-lg bg-[#F5B731] flex items-center justify-center font-bold text-[#0B0E11]">K</div>
            <span className="font-bold tracking-wider text-xl">KRYNDEX</span>
          </Link>
        </div>
        <div className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/markets" className="hover:text-[#F5B731] text-[#A1A1AA] transition-colors">Markets</Link>
          <Link href="/trade" className="hover:text-[#F5B731] text-[#A1A1AA] transition-colors">Trade</Link>
          <div className="w-8 h-8 rounded-full bg-[#1E2329] border border-[#2B3139] flex items-center justify-center text-[#F5B731] font-bold text-xs select-none">
            JD
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#2B3139] bg-[#151A21]/30 shrink-0 hidden md:flex flex-col p-4 justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] text-[#A1A1AA]/50 font-bold uppercase tracking-wider px-3 mb-3">User Console</span>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
            <Link
              href="/auth/login"
              className="block text-xs font-semibold text-[#A1A1AA] hover:text-[#EA3943] px-3 py-2 transition-colors"
            >
              Sign Out Session
            </Link>
          </div>
        </aside>

        {/* Dashboard Pages */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F5B731]/5 rounded-full blur-[100px] pointer-events-none z-0" />
          <div className="max-w-5xl mx-auto relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
