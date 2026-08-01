'use client';

import React, { useState } from 'react';

const MOCK_ADDRESSES: Record<string, string> = {
  BTC: 'tb1q3y9x2n4x9u8w8q7y8z6x5v4u3t2s1r0q9p8o7n6m',
  ETH: '0x3f5CE0FB54F109d94dD8b0f81023D7c64a5B7c02',
  USDT: '0x3f5CE0FB54F109d94dD8b0f81023D7c64a5B7c02',
  USDC: '0x3f5CE0FB54F109d94dD8b0f81023D7c64a5B7c02',
};

const INITIAL_TX_HISTORY = [
  { id: '1', date: '2026-07-27 10:14', type: 'DEPOSIT', asset: 'BTC', amount: '0.05240000', status: 'COMPLETED', txHash: 'a5c7...1d4f' },
  { id: '2', date: '2026-07-26 15:42', type: 'WITHDRAWAL', asset: 'USDT', amount: '120.00', status: 'COMPLETED', txHash: 'd7a9...8e0b' },
  { id: '3', date: '2026-07-25 09:20', type: 'DEPOSIT', asset: 'BTC', amount: '0.10000000', status: 'COMPLETED', txHash: 'f4b2...6c3e' },
];

export default function WalletPage() {
  const [walletTab, setWalletTab] = useState<'SPOT' | 'MARGIN'>('SPOT');
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [marginTab, setMarginTab] = useState<'BORROW' | 'REPAY' | 'TRANSFER'>('TRANSFER');
  
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [selectedNetwork, setSelectedNetwork] = useState('MAINNET');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);

  // Transfer form
  const [transferAsset, setTransferAsset] = useState('USDT');
  const [transferDirection, setTransferDirection] = useState<'SPOT_TO_MARGIN' | 'MARGIN_TO_SPOT'>('SPOT_TO_MARGIN');
  const [transferAmount, setTransferAmount] = useState('');

  // Borrow form
  const [borrowAsset, setBorrowAsset] = useState('USDT');
  const [borrowAmount, setBorrowAmount] = useState('');

  // Transaction history state
  const [txHistory, setTxHistory] = useState(INITIAL_TX_HISTORY);

  // Interactive Balances State
  const [spotBalances, setSpotBalances] = useState<Record<string, number>>({
    BTC: 0.1524,
    ETH: 1.5000,
    USDT: 10250.00,
    USDC: 500.00,
  });

  const [marginBalances, setMarginBalances] = useState<Record<string, { balance: number; borrowed: number; interest: number }>>({
    BTC: { balance: 0.05, borrowed: 0.0, interest: 0.0 },
    ETH: { balance: 0.0, borrowed: 0.0, interest: 0.0 },
    USDT: { balance: 5000.0, borrowed: 1000.0, interest: 2.50 },
    USDC: { balance: 0.0, borrowed: 0.0, interest: 0.0 },
  });

  const btcPrice = 67245.00;
  const ethPrice = 3450.00;
  const assetPrices: Record<string, number> = {
    BTC: btcPrice,
    ETH: ethPrice,
    USDT: 1.0,
    USDC: 1.0,
  };

  // Math metrics for Spot Wallet
  const getSpotTotalUSD = () => {
    let total = 0;
    Object.keys(spotBalances).forEach((asset) => {
      total += spotBalances[asset] * (assetPrices[asset] || 1.0);
    });
    return total;
  };

  // Math metrics for Margin Wallet
  const getMarginMetrics = () => {
    let totalAssets = 0;
    let totalDebt = 0;

    Object.keys(marginBalances).forEach((asset) => {
      const price = assetPrices[asset] || 1.0;
      const bal = marginBalances[asset];
      totalAssets += bal.balance * price;
      totalDebt += (bal.borrowed + bal.interest) * price;
    });

    const netEquity = totalAssets - totalDebt;
    const marginLevel = totalDebt > 0 ? totalAssets / totalDebt : 999.0;

    return {
      totalAssets,
      totalDebt,
      netEquity,
      marginLevel,
    };
  };

  const spotTotalUSD = getSpotTotalUSD();
  const marginMetrics = getMarginMetrics();
  const grandTotalUSD = spotTotalUSD + marginMetrics.netEquity;

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_ADDRESSES[selectedAsset] || 'tb1q...mock');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle spot withdrawal requests
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!withdrawAddress || amountNum <= 0 || !otp) {
      alert('Please fill out all withdrawal fields.');
      return;
    }

    const available = spotBalances[selectedAsset] || 0;
    if (available < amountNum) {
      alert('Insufficient available balance in Spot wallet.');
      return;
    }

    setSpotBalances({
      ...spotBalances,
      [selectedAsset]: available - amountNum,
    });

    const newTx = {
      id: Math.random().toString(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'WITHDRAWAL',
      asset: selectedAsset,
      amount: amountNum.toFixed(4),
      status: 'PROCESSING',
      txHash: '0x' + Math.random().toString(16).substring(2, 8) + '...' + Math.random().toString(16).substring(2, 6),
    };

    setTxHistory([newTx, ...txHistory]);
    alert(`Withdrawal Requested: ${withdrawAmount} ${selectedAsset} to ${withdrawAddress}. Pending block confirmations.`);
    setWithdrawAddress('');
    setWithdrawAmount('');
    setOtp('');
  };

  // Handle wallet transfers
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (amount <= 0) return;

    if (transferDirection === 'SPOT_TO_MARGIN') {
      const spotAvailable = spotBalances[transferAsset] || 0;
      if (spotAvailable < amount) {
        alert('Insufficient available balance in Spot wallet.');
        return;
      }
      setSpotBalances({
        ...spotBalances,
        [transferAsset]: spotAvailable - amount,
      });
      const mBal = marginBalances[transferAsset] || { balance: 0, borrowed: 0, interest: 0 };
      mBal.balance += amount;
      setMarginBalances({
        ...marginBalances,
        [transferAsset]: mBal,
      });
    } else {
      const mBal = marginBalances[transferAsset] || { balance: 0, borrowed: 0, interest: 0 };
      if (mBal.balance < amount) {
        alert('Insufficient available balance in Margin wallet.');
        return;
      }
      mBal.balance -= amount;
      setMarginBalances({
        ...marginBalances,
        [transferAsset]: mBal,
      });
      const spotAvailable = spotBalances[transferAsset] || 0;
      setSpotBalances({
        ...spotBalances,
        [transferAsset]: spotAvailable + amount,
      });
    }

    const newTx = {
      id: Math.random().toString(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: transferDirection === 'SPOT_TO_MARGIN' ? 'TRANSFER_IN' as any : 'TRANSFER_OUT' as any,
      asset: transferAsset,
      amount: amount.toFixed(4),
      status: 'COMPLETED',
      txHash: 'Local Ledger settlement',
    };

    setTxHistory([newTx, ...txHistory]);
    setTransferAmount('');
    alert('Wallet transfer successfully finalized!');
  };

  // Handle manual margin borrowings / repayments
  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(borrowAmount);
    if (amount <= 0) return;

    const mBal = marginBalances[borrowAsset] || { balance: 0, borrowed: 0, interest: 0 };

    if (marginTab === 'BORROW') {
      // Leveraged borrows (5x limits)
      const maxBorrowUSD = marginMetrics.netEquity * 4;
      const maxBorrowAsset = maxBorrowUSD / (assetPrices[borrowAsset] || 1.0);

      if (amount > maxBorrowAsset) {
        alert(`Limit exceeded. Based on collateral, you can borrow up to ${maxBorrowAsset.toFixed(4)} ${borrowAsset}.`);
        return;
      }

      mBal.balance += amount;
      mBal.borrowed += amount;
      alert(`Borrowed ${amount} ${borrowAsset} successfully!`);
    } else {
      const totalDebt = mBal.borrowed + mBal.interest;
      if (totalDebt <= 0) {
        alert('No outstanding debt for this asset.');
        return;
      }
      if (mBal.balance < amount) {
        alert('Insufficient available margin balance to execute repayment.');
        return;
      }

      const pay = Math.min(amount, totalDebt);
      mBal.balance -= pay;
      if (pay > mBal.interest) {
        const principalPay = pay - mBal.interest;
        mBal.interest = 0;
        mBal.borrowed = Math.max(0, mBal.borrowed - principalPay);
      } else {
        mBal.interest -= pay;
      }
      alert(`Repaid ${pay.toFixed(4)} ${borrowAsset} of debt successfully.`);
    }

    setMarginBalances({
      ...marginBalances,
      [borrowAsset]: mBal,
    });
    setBorrowAmount('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Wallets</h1>
        <p className="text-xs text-[#A1A1AA] mt-1 font-medium">Manage Spot balances, leverage Margin credit, and monitor ledger listings.</p>
      </div>

      {/* Main Tab bar - Spot vs Margin */}
      <div className="flex space-x-2 border-b border-[#2B3139] pb-px">
        <button
          onClick={() => setWalletTab('SPOT')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-2 ${
            walletTab === 'SPOT' ? 'border-[#F5B731] text-[#F5B731]' : 'border-transparent text-[#A1A1AA] hover:text-white'
          }`}
        >
          Spot Account
        </button>
        <button
          onClick={() => setWalletTab('MARGIN')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-2 ${
            walletTab === 'MARGIN' ? 'border-orange-500 text-orange-500' : 'border-transparent text-[#A1A1AA] hover:text-white'
          }`}
        >
          Cross Margin (5x)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Left Interactive Panel */}
        <div className="lg:col-span-2 bg-[#151A21] border border-[#2B3139] rounded-2xl overflow-hidden shadow-lg">
          {walletTab === 'SPOT' ? (
            /* ==================================================== */
            /* SPOT WALLET CONTROLS */
            /* ==================================================== */
            <div>
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
                          <option value="MAINNET">Standard network (SegWit / ERC20)</option>
                          <option value="BSC">BNB Smart Chain (BEP20)</option>
                          <option value="TRX">Tron (TRC20)</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-24 h-24 bg-white p-2 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
                        <div className="w-20 h-20 bg-[#0B0E11] text-[#F5B731] border-2 border-[#F5B731] rounded flex items-center justify-center font-extrabold text-[12px] tracking-wider">
                          QR CODE
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full text-center sm:text-left">
                        <span className="block text-xs text-[#A1A1AA] mb-1 font-semibold">Your Deposit Address</span>
                        <span className="block text-xs font-mono break-all text-white font-bold select-all mb-3 bg-[#151A21] px-3 py-2.5 rounded border border-[#2B3139]/40">
                          {MOCK_ADDRESSES[selectedAsset] || 'tb1q...mock'}
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
                      <p>• Requires 3 network block confirmations before balance is credited.</p>
                    </div>
                  </div>
                ) : (
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
                        <select className="w-full bg-[#0B0E11] border border-[#2B3139]/50 px-4 py-3 rounded-lg text-sm focus:outline-none">
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
                        <div className="flex justify-between mb-2">
                          <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wide">Amount</label>
                          <span className="text-[10px] text-[#A1A1AA]/60">Available: {spotBalances[selectedAsset]?.toFixed(4)} {selectedAsset}</span>
                        </div>
                        <input
                          type="number"
                          required
                          step="0.000001"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none font-mono"
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
          ) : (
            /* ==================================================== */
            /* MARGIN WALLET CONTROLS */
            /* ==================================================== */
            <div>
              <div className="flex bg-[#1E2329] border-b border-[#2B3139] p-1.5">
                <button
                  onClick={() => setMarginTab('TRANSFER')}
                  className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all ${
                    marginTab === 'TRANSFER' ? 'bg-orange-500 text-white' : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Transfer Funds
                </button>
                <button
                  onClick={() => setMarginTab('BORROW')}
                  className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all ${
                    marginTab === 'BORROW' ? 'bg-orange-500 text-white' : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Borrow Leveraged
                </button>
                <button
                  onClick={() => setMarginTab('REPAY')}
                  className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all ${
                    marginTab === 'REPAY' ? 'bg-orange-500 text-white' : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Repay Debt
                </button>
              </div>

              <div className="p-6">
                {marginTab === 'TRANSFER' ? (
                  <form onSubmit={handleTransferSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Direction</label>
                        <select
                          value={transferDirection}
                          onChange={(e) => setTransferDirection(e.target.value as any)}
                          className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                        >
                          <option value="SPOT_TO_MARGIN">Spot Account ➔ Margin Account</option>
                          <option value="MARGIN_TO_SPOT">Margin Account ➔ Spot Account</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Select Asset</label>
                        <select
                          value={transferAsset}
                          onChange={(e) => setTransferAsset(e.target.value)}
                          className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                        >
                          <option value="USDT">USDT - Tether</option>
                          <option value="BTC">BTC - Bitcoin</option>
                          <option value="ETH">ETH - Ethereum</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wide">Amount to Transfer</label>
                        <span className="text-[10px] text-[#A1A1AA]/60 font-mono">
                          Available: {transferDirection === 'SPOT_TO_MARGIN'
                            ? `${spotBalances[transferAsset]?.toFixed(4)} ${transferAsset}`
                            : `${marginBalances[transferAsset]?.balance.toFixed(4)} ${transferAsset}`
                          }
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg mt-4"
                    >
                      Confirm Transfer
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleBorrowSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Asset</label>
                        <select
                          value={borrowAsset}
                          onChange={(e) => setBorrowAsset(e.target.value)}
                          className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none"
                        >
                          <option value="USDT">USDT - Tether</option>
                          <option value="BTC">BTC - Bitcoin</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wide">Amount</label>
                          <span className="text-[10px] text-[#A1A1AA]/60 font-mono">
                            {marginTab === 'BORROW'
                              ? `Max: ${(marginMetrics.netEquity * 4 / (assetPrices[borrowAsset] || 1.0)).toFixed(4)}`
                              : `Debt: ${(marginBalances[borrowAsset]?.borrowed + marginBalances[borrowAsset]?.interest).toFixed(4)}`
                            }
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={borrowAmount}
                          onChange={(e) => setBorrowAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg mt-4"
                    >
                      {marginTab === 'BORROW' ? 'Borrow Assets' : 'Repay Margin Debt'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Snapshot panel */}
        <div className="bg-[#151A21] border border-[#2B3139] p-6 rounded-2xl h-fit shadow-md space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">Total Net Equity</h3>
            <span className="text-2xl font-extrabold text-white font-mono">${grandTotalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>

          {/* Detailed Wallet breakdowns */}
          <div className="border-t border-[#2B3139]/40 pt-4 space-y-4">
            <div>
              <span className="text-[10px] text-[#A1A1AA] uppercase font-bold block mb-1">Spot Account Value</span>
              <span className="text-lg font-bold text-white font-mono">${spotTotalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <div className="space-y-1.5 text-xs mt-2 pl-3 border-l border-[#2B3139]">
                <div className="flex justify-between font-mono">
                  <span className="text-[#A1A1AA]">BTC:</span>
                  <span className="text-white">{spotBalances.BTC.toFixed(4)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#A1A1AA]">USDT:</span>
                  <span className="text-white">${spotBalances.USDT.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-orange-400 uppercase font-bold block mb-1">Margin Account Equity</span>
              <span className="text-lg font-bold text-orange-400 font-mono">${marginMetrics.netEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <div className="space-y-1.5 text-xs mt-2 pl-3 border-l border-orange-500/20">
                <div className="flex justify-between font-mono">
                  <span className="text-[#A1A1AA]">Assets:</span>
                  <span className="text-white font-medium">${marginMetrics.totalAssets.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#A1A1AA]">Debt:</span>
                  <span className="text-white font-medium">${marginMetrics.totalDebt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#A1A1AA]">Risk:</span>
                  <span className={`font-bold ${marginMetrics.marginLevel > 2.0 ? 'text-[#16C784]' : 'text-red-400'}`}>
                    {marginMetrics.marginLevel === 999.0 ? 'No Debt' : `${marginMetrics.marginLevel.toFixed(2)}x`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <h2 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Recent Transactions</h2>
      <div className="overflow-x-auto bg-[#151A21]/30 border border-[#2B3139] rounded-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#2B3139] text-[#A1A1AA] uppercase tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Asset</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">TX ID Hash / Source</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B3139]/40 font-mono text-white">
            {txHistory.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#1E2329]/40">
                <td className="px-6 py-4 text-[#A1A1AA] font-sans">{tx.date}</td>
                <td className={`px-6 py-4 font-bold ${
                  tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' ? 'text-[#16C784]' : 'text-[#EA3943]'
                }`}>{tx.type}</td>
                <td className="px-6 py-4 font-sans">{tx.asset}</td>
                <td className="px-6 py-4 text-right">{tx.amount}</td>
                <td className="px-6 py-4 text-[#A1A1AA]">{tx.txHash}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded font-sans font-semibold ${
                    tx.status === 'COMPLETED' ? 'bg-[#16C784]/10 text-[#16C784]' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
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
