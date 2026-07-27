'use client';

import React, { useState } from 'react';

const INITIAL_USERS = [
  { id: 'usr_102', name: 'Joshua Omatsuli', email: 'josh@example.com', country: 'NG', level: 'STANDARD', status: 'ACTIVE', volume: '$150K' },
  { id: 'usr_205', name: 'Alina Petrov', email: 'alina@example.com', country: 'DE', level: 'ENHANCED', status: 'ACTIVE', volume: '$840K' },
  { id: 'usr_304', name: 'Steve Adams', email: 'steve@example.com', country: 'US', level: 'BASIC', status: 'RESTRICTED', volume: '$500' },
  { id: 'usr_401', name: 'Carlos Vance', email: 'carlos@example.com', country: 'CA', level: 'UNVERIFIED', status: 'FROZEN', volume: '$0' },
];

export default function AdminUserManagement() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');

  const toggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    alert(`Mock: User ${id} status updated to ${nextStatus}. Audit log created.`);
    setUsers(users.map((u) => u.id === id ? { ...u, status: nextStatus } : u));
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-mono text-white">User Registry</h1>
        <p className="text-xs text-[#A1A1AA] mt-1">Review accounts, adjust limits, and restrict or freeze access permissions.</p>
      </div>

      {/* Filter panel */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#0B0E11] border border-[#2B3139] px-4 py-2 rounded-lg text-xs text-white focus:outline-none w-full sm:w-80 font-mono"
        />
      </div>

      <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[#2B3139] text-[#A1A1AA] uppercase font-bold tracking-wider">
              <th className="px-6 py-4">User ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Country</th>
              <th className="px-6 py-4">KYC Tier</th>
              <th className="px-6 py-4">Trading Vol.</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B3139]/40 text-white">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-[#1E2329]/40">
                <td className="px-6 py-4 font-bold text-[#F5B731]">{user.id}</td>
                <td className="px-6 py-4 font-sans font-semibold text-white">{user.name}</td>
                <td className="px-6 py-4 font-sans">{user.email}</td>
                <td className="px-6 py-4">{user.country}</td>
                <td className="px-6 py-4 text-[10px]"><span className="bg-[#1E2329] border border-[#2B3139] px-2 py-0.5 rounded text-white">{user.level}</span></td>
                <td className="px-6 py-4 text-right font-medium pr-10">{user.volume}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                      user.status === 'ACTIVE'
                        ? 'bg-[#16C784]/15 text-[#16C784]'
                        : 'bg-[#EA3943]/15 text-[#EA3943]'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-sans space-x-1.5">
                  <button
                    onClick={() => toggleStatus(user.id, user.status)}
                    className="bg-[#1E2329] border border-[#2B3139] hover:bg-[#2B3139] text-[#F4F4F5] px-2 py-1 rounded text-xs font-semibold transition-colors"
                  >
                    {user.status === 'ACTIVE' ? 'Freeze' : 'Activate'}
                  </button>
                  <button
                    onClick={() => alert(`Mock: Displayed audit records for ${user.id}`)}
                    className="bg-transparent hover:text-[#F5B731] border border-[#2B3139] hover:border-[#F5B731] text-[#A1A1AA] px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                  >
                    Logs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
