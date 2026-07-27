'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    alert(`Mock: Reset link sent to ${email}`);
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
        <h2 className="text-2xl font-bold tracking-tight mb-2">Reset Password</h2>
        <p className="text-xs text-[#A1A1AA] mb-8">Enter your email and we will send you a password recovery link.</p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              className="w-full bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] font-bold py-3.5 rounded-xl text-sm transition-all"
            >
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <span className="text-4xl block mb-4">📧</span>
            <h3 className="text-lg font-bold mb-2">Check your email</h3>
            <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
              We have sent a password reset link to <strong className="text-white">{email}</strong>. Please follow the instructions to secure your account.
            </p>
          </div>
        )}

        <p className="text-xs text-[#A1A1AA] text-center mt-8">
          Back to{' '}
          <Link href="/auth/login" className="text-[#F5B731] hover:underline font-bold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
