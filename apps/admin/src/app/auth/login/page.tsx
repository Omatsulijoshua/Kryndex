'use client';

import React, { useState } from 'react';

export default function AdminLogin() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId && password && otp.length === 6) {
      alert('Mock: Admin Credentials Verified. System Session Initialized.');
      window.location.href = '/dashboard';
    } else {
      alert('Please fill out all fields and enter a 6-digit TOTP code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#F4F4F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#151A21] border border-[#2B3139] rounded-2xl p-8 shadow-xl shadow-black/45 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#F5B731]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center space-x-3 mb-6 select-none justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F5B731] to-[#D99A19] flex items-center justify-center font-bold text-[#0B0E11] text-sm">K</div>
          <span className="font-bold tracking-wider text-lg">KRYNDEX ADMIN</span>
        </div>

        <h2 className="text-xl font-bold tracking-tight mb-2 text-center text-white">System Operations Terminal</h2>
        <p className="text-xs text-[#A1A1AA] mb-8 text-center">Authorization required. All sessions are logged and audited.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] mb-2 uppercase tracking-wide">Operator Username / ID</label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. OP-8109"
              className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none font-mono text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] mb-2 uppercase tracking-wide">Security Phrase / Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] mb-2 uppercase tracking-wide">Hardware/TOTP 2FA Code</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] font-bold py-3.5 rounded-xl text-sm transition-all"
          >
            Initiate System Access
          </button>
        </form>
      </div>
    </div>
  );
}
