'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      if (email && password) {
        setOtpSent(true);
        alert('Mock: 2FA challenge code requested. Enter any 6 digits to authorize.');
      }
    } else {
      if (otp.length === 6) {
        alert('Mock: Login successful!');
        window.location.href = '/dashboard/profile';
      } else {
        alert('Code must be 6 digits.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#F4F4F5] flex items-center justify-center p-4">
      <div className="absolute top-8 left-8 flex items-center space-x-3 select-none">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5B731] flex items-center justify-center font-bold text-[#0B0E11]">K</div>
          <span className="font-bold tracking-wider text-xl">KRYNDEX</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#151A21] border border-[#2B3139] rounded-2xl p-8 shadow-xl shadow-black/35 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F5B731]/5 rounded-full blur-2xl pointer-events-none" />
        
        <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h2>
        <p className="text-xs text-[#A1A1AA] mb-8">Access your portfolio and trade beyond limits securely.</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {!otpSent ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wide">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-[#F5B731] hover:underline">Forgot password?</Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">2FA Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000 000"
                className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none"
              />
              <span className="text-[10px] text-[#A1A1AA] mt-2 block">Enter the 6-digit code from your authenticator application.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] font-bold py-3.5 rounded-xl text-sm transition-all"
          >
            {otpSent ? 'Verify & Authorize' : 'Log In'}
          </button>
        </form>

        <p className="text-xs text-[#A1A1AA] text-center mt-8">
          New to Kryndex?{' '}
          <Link href="/auth/register" className="text-[#F5B731] hover:underline font-bold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
