'use client';

import React from 'react';

export default function ProfilePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Profile Settings</h1>
        <p className="text-xs text-[#A1A1AA] mt-1">Manage your identity profiles, contact info, and review trading limitations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-xs text-[#A1A1AA] block mb-1">Legal First Name</span>
                <span className="font-semibold text-white">Joshua</span>
              </div>
              <div>
                <span className="text-xs text-[#A1A1AA] block mb-1">Legal Last Name</span>
                <span className="font-semibold text-white">Omatsuli</span>
              </div>
              <div>
                <span className="text-xs text-[#A1A1AA] block mb-1">Date of Birth</span>
                <span className="font-semibold text-white">1996-05-12</span>
              </div>
              <div>
                <span className="text-xs text-[#A1A1AA] block mb-1">Nationality</span>
                <span className="font-semibold text-white">Nigerian</span>
              </div>
              <div>
                <span className="text-xs text-[#A1A1AA] block mb-1">Email Address</span>
                <span className="font-semibold text-white">j***@example.com</span>
              </div>
              <div>
                <span className="text-xs text-[#A1A1AA] block mb-1">Phone Number</span>
                <span className="font-semibold text-white">+234 812 *** ****</span>
              </div>
            </div>
            <div className="border-t border-[#2B3139]/40 pt-4 mt-6">
              <span className="text-[10px] text-[#A1A1AA] leading-normal block">
                🔒 Personally identifiable details are encrypted at rest using AES-256-GCM. Personal data modifications must be verified through compliance support.
              </span>
            </div>
          </div>
        </div>

        {/* Level Limitations Sidebar */}
        <div className="bg-[#151A21] border border-[#2B3139] p-6 rounded-2xl h-fit">
          <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Risk & Limits Status</h3>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-[#A1A1AA] block">Risk Classification</span>
              <span className="bg-[#16C784]/15 text-[#16C784] px-2.5 py-0.5 rounded text-xs font-bold inline-block mt-1 uppercase tracking-wide">
                Low Risk
              </span>
            </div>
            <div className="border-t border-[#2B3139]/40 pt-4 space-y-3 text-xs">
              <div>
                <span className="text-[#A1A1AA] block mb-1">Daily Withdrawal Limit:</span>
                <span className="font-mono text-white font-bold">$50,000.00 / $50,000.00 remaining</span>
              </div>
              <div>
                <span className="text-[#A1A1AA] block mb-1">Daily Deposit Limit:</span>
                <span className="font-mono text-white font-bold">Unlimited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
