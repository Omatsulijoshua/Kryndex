'use client';

import React, { useState } from 'react';

const INITIAL_TICKETS = [
  { id: 'TK-8409', subject: 'Deposit delayed for BTC transaction', category: 'DEPOSITS', priority: 'HIGH', status: 'OPEN', date: '2026-07-27' },
  { id: 'TK-8120', subject: 'API Key permissions config check', category: 'API_KEYS', priority: 'LOW', status: 'RESOLVED', date: '2026-07-25' },
];

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  date: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('WALLETS');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(INITIAL_TICKETS[0]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) {
      alert('Please fill in the subject and description.');
      return;
    }
    const newTicket = {
      id: `TK-${Math.floor(Math.random() * 9000) + 1000}`,
      subject,
      category,
      priority,
      status: 'OPEN',
      date: new Date().toISOString().split('T')[0],
    };
    setTickets([newTicket, ...tickets]);
    setActiveTicket(newTicket);
    setSubject('');
    setDescription('');
    alert(`Mock Support Ticket ${newTicket.id} created successfully! Our staff will respond shortly.`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Customer Support</h1>
        <p className="text-xs text-[#A1A1AA] mt-1">Submit technical tickets, review responses, and speak directly to compliance personnel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List and Conversation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row h-[500px]">
            {/* Sidebar list */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#2B3139] flex flex-col divide-y divide-[#2B3139]/50 overflow-y-auto shrink-0 bg-[#1E2329]/10">
              <span className="block text-[10px] text-[#A1A1AA]/50 font-bold uppercase tracking-wider p-3">Your Tickets</span>
              {tickets.map((tk) => (
                <div
                  key={tk.id}
                  onClick={() => setActiveTicket(tk)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    activeTicket?.id === tk.id ? 'bg-[#F5B731]/10 border-l-2 border-[#F5B731]' : 'hover:bg-[#1E2329]/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-mono text-xs font-bold text-[#F5B731]">{tk.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${tk.status === 'OPEN' ? 'bg-[#16C784]/15 text-[#16C784]' : 'bg-[#A1A1AA]/15 text-[#A1A1AA]'}`}>
                      {tk.status}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white block truncate">{tk.subject}</span>
                  <span className="text-[10px] text-[#A1A1AA] mt-1 block">{tk.date}</span>
                </div>
              ))}
            </div>

            {/* Conversation Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0B0E11]/20">
              {activeTicket ? (
                <>
                  <div className="p-4 border-b border-[#2B3139] bg-[#151A21]/50 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-xs text-[#F5B731] font-bold">{activeTicket.id}</span>
                      <h4 className="text-xs font-bold text-white truncate max-w-sm">{activeTicket.subject}</h4>
                    </div>
                    <span className="text-[10px] text-[#A1A1AA]">Priority: {activeTicket.priority}</span>
                  </div>
                  
                  {/* Chat feed mock */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex flex-col items-start">
                      <div className="bg-[#1E2329] border border-[#2B3139] p-3 rounded-2xl rounded-tl-none max-w-xs text-xs">
                        <span className="block font-bold text-[#A1A1AA] text-[10px] mb-1">Customer (You)</span>
                        <p className="text-white">I made a deposit of 0.0524 BTC an hour ago but my ledger balance has not been updated yet. Please help.</p>
                      </div>
                      <span className="text-[9px] text-[#A1A1AA] mt-1 font-mono">14:12</span>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="bg-[#F5B731]/10 border border-[#F5B731]/30 p-3 rounded-2xl rounded-tr-none max-w-xs text-xs text-right">
                        <span className="block font-bold text-[#F5B731] text-[10px] mb-1">Kryndex Operator (Agent Sarah)</span>
                        <p className="text-white">Hello Joshua! I looked up the transaction. The Bitcoin network block confirmations are currently at 2/3. Your balance will be credited automatically once the 3rd block is sealed.</p>
                      </div>
                      <span className="text-[9px] text-[#A1A1AA] mt-1 font-mono">14:15</span>
                    </div>
                  </div>

                  <div className="p-3 border-t border-[#2B3139] bg-[#151A21]/30 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type reply message..."
                      className="flex-1 bg-[#0B0E11] border border-[#2B3139] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#F5B731]"
                    />
                    <button
                      onClick={() => alert('Mock: Message sent!')}
                      className="bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] text-xs font-bold px-4 py-2 rounded-lg"
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#A1A1AA] text-xs">
                  <span>Select a support ticket to view conversation details.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Ticket Panel */}
        <div className="bg-[#151A21] border border-[#2B3139] p-6 rounded-2xl h-fit">
          <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-4">Create New Ticket</h3>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1 font-bold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0B0E11] border border-[#2B3139] px-3 py-2 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="WALLETS">Deposits & Withdrawals</option>
                <option value="KYC">Identity Verification</option>
                <option value="TRADING">Spot Orders</option>
                <option value="API_KEYS">Developer API</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1 font-bold">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#0B0E11] border border-[#2B3139] px-3 py-2 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1 font-bold">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of issue"
                className="w-full bg-[#0B0E11] border border-[#2B3139] px-3 py-2 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1 font-bold">Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide transaction hashes, coin symbol, or errors"
                className="w-full bg-[#0B0E11] border border-[#2B3139] px-3 py-2 rounded-lg text-xs text-white focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] font-bold py-2.5 rounded-lg text-xs transition-colors"
            >
              Open Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
