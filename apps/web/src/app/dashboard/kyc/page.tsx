'use client';

import React, { useState } from 'react';

export default function KycPage() {
  const [kycLevel, setKycLevel] = useState<'STANDARD' | 'ENHANCED'>('STANDARD');
  const [docType, setDocType] = useState('PASSPORT');
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      alert('Mock: KYC documents successfully uploaded using secure single-use presigned S3 URLs. Status: PENDING_REVIEW');
    }, 1500);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Identity Verification</h1>
        <p className="text-xs text-[#A1A1AA] mt-1">Complete document submissions to increase withdrawal limits and activate standard services.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Submission */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-6">Standard Document Verification</h3>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">National ID Card</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Identity Document Photo</label>
                  <div className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg p-4 text-center cursor-pointer hover:border-[#F5B731] transition-all">
                    <span className="text-2xl block mb-1">📇</span>
                    <span className="text-xs text-[#A1A1AA]">Select Passport scan image</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Selfie Photo</label>
                  <div className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg p-4 text-center cursor-pointer hover:border-[#F5B731] transition-all">
                    <span className="text-2xl block mb-1">📸</span>
                    <span className="text-xs text-[#A1A1AA]">Select selfie camera photo</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-[#F5B731] hover:bg-yellow-500 disabled:bg-[#A1A1AA] text-[#0B0E11] font-bold py-3.5 rounded-xl text-sm transition-all mt-4"
              >
                {uploading ? 'Generating secure channels & Uploading...' : 'Upload KYC Documents'}
              </button>
            </form>
          </div>
        </div>

        {/* Level Limitations Sidebar */}
        <div className="bg-[#151A21] border border-[#2B3139] p-6 rounded-2xl h-fit">
          <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">KYC Tiers</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white">Level 1: Basic</span>
              <span className="text-[#16C784] font-bold">Approved</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white">Level 2: Standard</span>
              <span className="text-[#16C784] font-bold">Approved</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white">Level 3: Enhanced</span>
              <span className="text-[#F5B731] font-bold">Not Started</span>
            </div>
            <div className="border-t border-[#2B3139]/40 pt-4">
              <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
                Unlock Enhanced level verification to expand your daily withdrawal limits to $500,000 equivalent. Proof of Address and Source of Funds statement required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
