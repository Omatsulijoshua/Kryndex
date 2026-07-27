'use client';

import { useEffect } from 'react';

export default function AdminRoot() {
  useEffect(() => {
    window.location.href = '/dashboard';
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#F4F4F5] flex items-center justify-center text-xs font-mono">
      Redirecting to Admin Portal...
    </div>
  );
}
