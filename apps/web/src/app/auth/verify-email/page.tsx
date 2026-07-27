'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('your email');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      alert('Mock: Email verified successfully!');
      window.location.href = '/auth/login';
    } else {
      alert('Verification code must be 6 digits.');
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
        <h2 className="text-2xl font-bold tracking-tight mb-2">Verify Email</h2>
        <p className="text-xs text-[#A1A1AA] mb-8 leading-relaxed">
          We have sent a verification code to <strong className="text-white">{email}</strong>. Enter the 6-digit code below.
        </p>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Verification Code</label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] font-bold py-3.5 rounded-xl text-sm transition-all"
          >
            Verify Email
          </button>
        </form>

        <div className="flex justify-between items-center mt-8 text-xs text-[#A1A1AA]">
          <span>Didn't receive the code?</span>
          <button
            onClick={() => alert('Mock: Resent code')}
            className="text-[#F5B731] hover:underline font-bold bg-transparent border-none cursor-pointer"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}
