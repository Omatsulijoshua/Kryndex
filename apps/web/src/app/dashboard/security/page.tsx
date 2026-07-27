'use client';

import React, { useState } from 'react';

export default function SecurityPage() {
  const [mfaActive, setMfaActive] = useState(true);
  const [antiPhishing, setAntiPhishing] = useState('KRYNDEX_SECURE_2026');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Security & 2FA</h1>
        <p className="text-xs text-[#A1A1AA] mt-1">Configure your multi-factor verification, reset keys, and specify phishing identifiers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* MFA Authenticator */}
          <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Authenticator Application (TOTP)</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">Use Google Authenticator or similar apps to generate 2FA authorization codes.</p>
            </div>
            <button
              onClick={() => {
                setMfaActive(!mfaActive);
                alert(`Mock: TOTP MFA set to ${!mfaActive ? 'ACTIVE' : 'INACTIVE'}`);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                mfaActive ? 'bg-[#EA3943]/15 hover:bg-[#EA3943]/25 text-[#EA3943]' : 'bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11]'
              }`}
            >
              {mfaActive ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* Anti-Phishing Setup */}
          <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl p-6 shadow-md">
            <h3 className="font-bold text-sm text-white mb-2">Anti-Phishing Code</h3>
            <p className="text-xs text-[#A1A1AA] mb-4">Specify a private text code that will appear in the header of all official Kryndex transactional emails to verify validity.</p>
            <div className="flex gap-4">
              <input
                type="text"
                value={antiPhishing}
                onChange={(e) => setAntiPhishing(e.target.value)}
                className="bg-[#0B0E11] border border-[#2B3139] px-4 py-2 rounded-lg text-xs text-white focus:outline-none w-full sm:w-64 font-mono"
              />
              <button
                onClick={() => alert(`Mock: Anti-phishing code set to ${antiPhishing}`)}
                className="bg-[#1E2329] border border-[#2B3139] hover:bg-[#2B3139] text-xs font-bold px-4 py-2 rounded-lg transition-colors text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Security Alert Sidebar */}
        <div className="bg-[#151A21] border border-[#2B3139] p-6 rounded-2xl h-fit">
          <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Security Level</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🛡️</span>
              <span className="font-bold text-sm text-[#16C784]">High Security</span>
            </div>
            <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
              Your account has 2FA enabled, passwords rotated recently, and an active anti-phishing code. You are protected against phishing and brute-force takeover attempts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
