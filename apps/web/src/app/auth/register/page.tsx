'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeAge, setAgreeAge] = useState(false);
  const [country, setCountry] = useState('US');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeAge) {
      alert('You must confirm you are 18 years of age or older.');
      return;
    }
    alert(`Mock: Registration code sent to ${email}`);
    window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`;
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
        <h2 className="text-2xl font-bold tracking-tight mb-2">Create Account</h2>
        <p className="text-xs text-[#A1A1AA] mb-8">Register to start trading on the Kryndex spot market.</p>

        <form onSubmit={handleRegister} className="space-y-4">
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
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Country of Residence</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
            >
              <option value="US">United States (Restricted)</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="NG">Nigeria</option>
              <option value="SG">Singapore</option>
            </select>
            {country === 'US' && (
              <span className="text-[10px] text-[#EA3943] mt-2 block font-medium">
                ⚠️ Warning: Geo-restrictions apply to US residents. Spot trading is disabled for this region.
              </span>
            )}
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <input
              type="checkbox"
              id="ageCheck"
              checked={agreeAge}
              onChange={(e) => setAgreeAge(e.target.checked)}
              className="mt-1 rounded border-[#2B3139] text-[#F5B731] focus:ring-0"
            />
            <label htmlFor="ageCheck" className="text-xs text-[#A1A1AA] leading-normal select-none">
              I certify that I am at least 18 years of age, and agree to the Terms of Service and Privacy Policy.
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] font-bold py-3.5 rounded-xl text-sm transition-all"
          >
            Create Account
          </button>
        </form>

        <p className="text-xs text-[#A1A1AA] text-center mt-8">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#F5B731] hover:underline font-bold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
