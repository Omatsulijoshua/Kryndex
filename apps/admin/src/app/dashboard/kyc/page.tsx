'use client';

import React, { useState } from 'react';

const INITIAL_QUEUE = [
  { id: 'app_9201', user: 'Mark Thorne', country: 'GB', level: 'STANDARD', docType: 'PASSPORT', fileUrl: 'https://minio.kryndex.local/kyc/passports/signed_url_1', status: 'PENDING_REVIEW', submitted: '10 minutes ago' },
  { id: 'app_8492', user: 'Amara Diop', country: 'FR', level: 'ENHANCED', docType: 'UTILITY_BILL', fileUrl: 'https://minio.kryndex.local/kyc/bills/signed_url_2', status: 'PENDING_REVIEW', submitted: '1 hour ago' },
];

export default function AdminKycDesk() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    alert(`Mock: Application ${id} set to ${action}. Audit log created: [Staff Operator Approved/Rejected KYC application ${id}].`);
    setQueue(queue.filter((item) => item.id !== id));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-mono text-white">KYC Verification Desk</h1>
        <p className="text-xs text-[#A1A1AA] mt-1">Review identity documents and verify user compliance statuses.</p>
      </div>

      <div className="bg-[#151A21] border border-[#2B3139] rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[#2B3139] text-[#A1A1AA] uppercase font-bold tracking-wider">
              <th className="px-6 py-4">Application ID</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Country</th>
              <th className="px-6 py-4">Tier</th>
              <th className="px-6 py-4">Doc Type</th>
              <th className="px-6 py-4">Document Link</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B3139]/40 text-white">
            {queue.map((item) => (
              <tr key={item.id} className="hover:bg-[#1E2329]/40">
                <td className="px-6 py-4 font-bold text-[#F5B731]">{item.id}</td>
                <td className="px-6 py-4 font-sans font-semibold text-white">{item.user}</td>
                <td className="px-6 py-4">{item.country}</td>
                <td className="px-6 py-4 text-[10px]"><span className="bg-[#1E2329] border border-[#2B3139] px-2 py-0.5 rounded text-white">{item.level}</span></td>
                <td className="px-6 py-4 text-text-secondary">{item.docType}</td>
                <td className="px-6 py-4">
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert(`Simulated S3 Signed URL redirect: ${item.fileUrl}`); }}
                    className="text-[#F5B731] hover:underline"
                  >
                    View Document
                  </a>
                </td>
                <td className="px-6 py-4 text-[#A1A1AA] font-sans">{item.submitted}</td>
                <td className="px-6 py-4 text-center space-x-2 font-sans">
                  <button
                    onClick={() => handleAction(item.id, 'APPROVE')}
                    className="bg-[#16C784]/20 hover:bg-[#16C784] text-[#16C784] hover:text-[#0B0E11] px-2.5 py-1 rounded text-xs font-bold transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'REJECT')}
                    className="bg-[#EA3943]/20 hover:bg-[#EA3943] text-[#EA3943] hover:text-white px-2.5 py-1 rounded text-xs font-bold transition-all"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[#A1A1AA] font-sans text-xs">
                  All pending KYC applications have been reviewed. Queue is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
