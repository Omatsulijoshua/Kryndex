'use client';

import React, { useState, useEffect } from 'react';

const MOCK_ADDRESSES: Record<string, string> = {
  BTC: 'tb1q3y9x2n4x9u8w8q7y8z6x5v4u3t2s1r0q9p8o7n6m',
  ETH: '0x3f5CE0FB54F109d94dD8b0f81023D7c64a5B7c02',
  USDT: '0x3f5CE0FB54F109d94dD8b0f81023D7c64a5B7c02',
  USDC: '0x3f5CE0FB54F109d94dD8b0f81023D7c64a5B7c02',
};

const TX_HISTORY = [
  { id: '1', date: '2026-07-27 10:14', type: 'DEPOSIT', asset: 'BTC', amount: '0.05240000', status: 'COMPLETED', txHash: 'a5c7...1d4f' },
  { id: '2', date: '2026-07-26 15:42', type: 'WITHDRAWAL', asset: 'USDT', amount: '120.00', status: 'COMPLETED', txHash: 'd7a9...8e0b' },
  { id: '3', date: '2026-07-25 09:20', type: 'DEPOSIT', asset: 'BTC', amount: '0.10000000', status: 'COMPLETED', txHash: 'f4b2...6c3e' },
];

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [selectedNetwork, setSelectedNetwork] = useState('MAINNET');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_ADDRESSES[selectedAsset]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAddress || !withdrawAmount || !otp) {
      alert('Please fill out all withdrawal fields.');
      return;
    }
    alert(`Mock Withdrawal Requested: ${withdrawAmount} ${selectedAsset} to ${withdrawAddress}. Pending 2FA verification.`);
    setWithdrawAddress('');
    setWithdrawAmount('');
    setOtp('');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Wallet</h1>
        <p className="text-xs text-[#A1A1AA] mt-1">Manage deposits, withdrawals, and monitor transaction histories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Actions panel */}
        <div className="lg:col-span-2 bg-[#151A21] border border-[#2B3139] rounded-2xl overflow-hidden shadow-lg">
          {/* Header tabs */}
          <div className="flex bg-[#1E2329] border-b border-[#2B3139] p-1.5">
            <button
              onClick={() => setActiveTab('DEPOSIT')}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'DEPOSIT' ? 'bg-[#F5B731] text-[#0B0E11]' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Deposit Crypto
            </button>
            <button
              onClick={() => setActiveTab('WITHDRAW')}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'WITHDRAW' ? 'bg-[#F5B731] text-[#0B0E11]' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Withdraw Crypto
            </button>
          </div>

          <div className="p-6">
            {/* 1. Deposit View */}
            {activeTab === 'DEPOSIT' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Select Asset</label>
                    <select
                      value={selectedAsset}
                      onChange={(e) => setSelectedAsset(e.target.value)}
                      className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                    >
                      <option value="BTC">BTC - Bitcoin</option>
                      <option value="ETH">ETH - Ethereum</option>
                      <option value="USDT">USDT - Tether</option>
                      <option value="USDC">USDC - USD Coin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Network</label>
                    <select
                      value={selectedNetwork}
                      onChange={(e) => setSelectedNetwork(e.target.value)}
                      className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                    >
                      <option value="MAINNET">Standard network (e.g. SegWit / ERC20)</option>
                      <option value="BSC">BNB Smart Chain (BEP20)</option>
                      <option value="TRX">Tron (TRC20)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6">
                  {/* Mock QR Code */}
                  <div className="w-24 h-24 bg-white p-2 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
                    <div className="w-20 h-20 bg-repeating-conic border-4 border-black flex items-center justify-center">
                      <span className="text-[10px] text-black font-bold">QR CODE</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full text-center sm:text-left">
                    <span className="block text-xs text-[#A1A1AA] mb-1 font-semibold">Your Deposit Address</span>
                    <span className="block text-sm font-mono break-all text-white font-bold select-all mb-3 bg-[#151A21] px-3 py-2 rounded border border-[#2B3139]/40">
                      {MOCK_ADDRESSES[selectedAsset]}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="bg-[#1E2329] border border-[#2B3139] hover:bg-[#2B3139] text-xs font-bold px-4 py-2 rounded-lg transition-colors text-white"
                    >
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-[#A1A1AA] leading-relaxed space-y-1 bg-[#1E2329]/30 border border-[#2B3139]/40 p-4 rounded-xl">
                  <span className="block font-bold text-white mb-1">⚠️ Important Deposit Warnings:</span>
                  <p>• Send only {selectedAsset} to this deposit address. Sending any other coin will result in permanent loss.</p>
                  <p>• Requires 3 network block confirmations before balance is credited on the ledger.</p>
                </div>
              </div>
            ) : (
              /* 2. Withdrawal View */
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Select Asset</label>
                    <select
                      value={selectedAsset}
                      onChange={(e) => setSelectedAsset(e.target.value)}
                      className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                    >
                      <option value="BTC">BTC - Bitcoin</option>
                      <option value="ETH">ETH - Ethereum</option>
                      <option value="USDT">USDT - Tether</option>
                      <option value="USDC">USDC - USD Coin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Network</label>
                    <select className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none">
                      <option value="MAIN">Standard main network</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Recipient Address</label>
                  <input
                    type="text"
                    required
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="Enter recipient wallet address"
                    className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Amount</label>
                    <input
                      type="number"
                      required
                      step="0.000001"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">2FA OTP Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000 000"
                      className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-[#A1A1AA] pt-2">
                  <span>Transaction Fee: <strong className="text-white">0.0005 BTC</strong></span>
                  <span>Minimum withdraw: <strong className="text-white">0.001 BTC</strong></span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-[#F5B731]/10 mt-4"
                >
                  Submit Withdrawal Request
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Balance Card Sidebar */}
        <div className="bg-[#151A21] border border-[#2B3139] p-6 rounded-2xl h-fit shadow-md">
          <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Portfolio Snapshot</h3>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-[#A1A1AA] block">Total Crypto Value</span>
              <span className="text-2xl font-extrabold text-white font-mono">$10,250.00</span>
            </div>
            <div className="border-t border-[#2B3139]/40 pt-4 space-y-2 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-[#A1A1AA]">BTC:</span>
                <span className="text-white font-medium">0.15240000</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#A1A1AA]">USDT:</span>
                <span className="text-white font-medium">1.79</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <h2 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Recent Transactions</h2>
      <div className="overflow-x-auto bg-[#151A21]/30 border border-[#2B3139] rounded-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#2B3139] text-[#A1A1AA] uppercase tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Asset</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">TX ID Hash</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B3139]/40 font-mono text-white">
            {TX_HISTORY.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#1E2329]/40">
                <td className="px-6 py-4 text-[#A1A1AA] font-sans">{tx.date}</td>
                <td className={`px-6 py-4 font-bold ${tx.type === 'DEPOSIT' ? 'text-[#16C784]' : 'text-[#EA3943]'}`}>{tx.type}</td>
                <td className="px-6 py-4 font-sans">{tx.asset}</td>
                <td className="px-6 py-4 text-right">{tx.amount}</td>
                <td className="px-6 py-4 text-[#A1A1AA]">{tx.txHash}</td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-[#16C784]/10 text-[#16C784] px-2 py-0.5 rounded font-sans font-semibold">
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
