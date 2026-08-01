'use client';

import React, { useState } from 'react';

const INITIAL_ADMINS = [
  { id: 'adm_01', name: 'Joshua Omatsuli', email: 'joshuaomatsuli01@gmail.com', role: 'SUPER_ADMIN', status: 'ACTIVE', lastActive: '1 minute ago' },
  { id: 'adm_02', name: 'Marcus Sterling', email: 'marcus@kryndex.local', role: 'RISK_OFFICER', status: 'ACTIVE', lastActive: '2 hours ago' },
  { id: 'adm_03', name: 'Alina Vance', email: 'alina.v@kryndex.local', role: 'SUPPORT_LEAD', status: 'ACTIVE', lastActive: 'Yesterday' },
  { id: 'adm_04', name: 'Dave Jenkins', email: 'dave@kryndex.local', role: 'AUDITOR', status: 'SUSPENDED', lastActive: '5 days ago' },
];

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New admin form state
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'OPERATOR',
  });

  const toggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    alert(`Mock Admin Action: Admin ${id} status updated to ${nextStatus}.`);
    setAdmins(admins.map((adm) => adm.id === id ? { ...adm, status: nextStatus } : adm));
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) {
      alert('Please fill out all fields.');
      return;
    }

    const generatedAdmin = {
      id: `adm_0${admins.length + 1}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      status: 'ACTIVE',
      lastActive: 'Never',
    };

    setAdmins([...admins, generatedAdmin]);
    setIsAddModalOpen(false);
    setNewAdmin({ name: '', email: '', role: 'OPERATOR' });
    alert(`Success: Admin user "${generatedAdmin.name}" added to registry.`);
  };

  const filteredAdmins = admins.filter((adm) =>
    adm.name.toLowerCase().includes(search.toLowerCase()) ||
    adm.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white">Administrator Registry</h1>
          <p className="text-xs text-[#A1A1AA] mt-1">Audit administrative credentials, modify authority levels, and monitor system access logs.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-[#F5B731]/10 font-mono"
        >
          + Provision Admin
        </button>
      </div>

      {/* Filter panel */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search admin registry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#0B0E11] border border-[#2B3139] px-4 py-2 rounded-lg text-xs text-white focus:outline-none w-full sm:w-80 font-mono"
        />
      </div>

      {/* Admin Table */}
      <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[#2B3139] text-[#A1A1AA] uppercase font-bold tracking-wider">
              <th className="px-6 py-4">Admin ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Access Role</th>
              <th className="px-6 py-4">Last Activity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B3139]/40 text-white font-sans">
            {filteredAdmins.map((adm) => (
              <tr key={adm.id} className="hover:bg-[#1E2329]/40">
                <td className="px-6 py-4 font-bold font-mono text-[#F5B731]">{adm.id}</td>
                <td className="px-6 py-4 font-semibold text-white">{adm.name}</td>
                <td className="px-6 py-4">{adm.email}</td>
                <td className="px-6 py-4 font-mono text-[10px]">
                  <span className="bg-[#1E2329] border border-[#2B3139] px-2 py-0.5 rounded text-white">
                    {adm.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#A1A1AA] font-mono">{adm.lastActive}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase font-mono ${
                      adm.status === 'ACTIVE'
                        ? 'bg-[#16C784]/15 text-[#16C784]'
                        : 'bg-[#EA3943]/15 text-[#EA3943]'
                    }`}
                  >
                    {adm.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-sans space-x-1.5">
                  <button
                    onClick={() => toggleStatus(adm.id, adm.status)}
                    className="bg-[#1E2329] border border-[#2B3139] hover:bg-[#2B3139] text-[#F4F4F5] px-2 py-1 rounded text-xs font-semibold transition-colors"
                  >
                    {adm.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => alert(`Mock: System activity audits loaded for ${adm.name}.`)}
                    className="bg-transparent hover:text-[#F5B731] border border-[#2B3139] hover:border-[#F5B731] text-[#A1A1AA] px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                  >
                    Audits
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#151A21] border border-[#2B3139] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold mb-4 font-mono text-white">Provision Access Credentials</h3>
            
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Operator Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Secure Email Address</label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="name@kryndex.local"
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wide">Authorization Level (Role)</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#F5B731] px-4 py-3 rounded-lg text-sm focus:outline-none text-white font-mono"
                >
                  <option value="OPERATOR">OPERATOR - General Desk access</option>
                  <option value="RISK_OFFICER">RISK_OFFICER - Adjust liquidations & fees</option>
                  <option value="SUPPORT_LEAD">SUPPORT_LEAD - Handle KYC & cases</option>
                  <option value="AUDITOR">AUDITOR - View logs & ledger balances</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-transparent border border-[#2B3139] text-[#A1A1AA] hover:bg-[#2B3139] py-3 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#F5B731] hover:bg-yellow-500 text-[#0B0E11] py-3 rounded-xl text-sm font-bold transition-all shadow"
                >
                  Confirm Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
