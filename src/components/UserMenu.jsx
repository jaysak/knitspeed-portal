// src/components/UserMenu.jsx
//
// Top-right identity badge: avatar circle + name + role label.
// Click → dropdown with email + Sign Out button.
// Color cue: amber for provider, dark stone for customer, neutral for admin.

import { useState, useEffect, useRef } from 'react';
import { signOut } from '../lib/auth';
import { isProvider, isCustomer, isAdmin } from '../lib/session';

// Pull a friendly display name out of the email.
// jaysak+knitspeed-gift@gmail.com → gift
// jaysak+knitspeed-bank@gmail.com → bank
// alice@company.com               → alice
function deriveDisplayName(email) {
  if (!email) return '';
  const local = email.split('@')[0];
  if (local.includes('+')) {
    const tag = local.split('+').slice(-1)[0];
    // strip a "knitspeed-" prefix if present, take last segment
    return tag.replace(/^knitspeed-/, '').split('-').slice(-1)[0];
  }
  return local;
}

export default function UserMenu({ session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const email = session.email ?? '';
  const displayName = deriveDisplayName(email);
  const initial = (displayName[0] ?? '?').toUpperCase();

  let roleLabel = 'Guest';
  let roleColor = 'bg-stone-400';
  if (isProvider(session)) {
    roleLabel = 'Provider · ผู้ให้ข้อมูล';
    roleColor = 'bg-amber-700';
  } else if (isAdmin(session)) {
    roleLabel = 'Admin';
    roleColor = 'bg-stone-900';
  } else if (isCustomer(session)) {
    roleLabel = 'Customer · ลูกค้า';
    roleColor = 'bg-teal-700';
  }

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1 border-2 border-stone-300 hover:border-stone-900 transition-all bg-transparent"
      >
        <div className={`w-8 h-8 ${roleColor} text-stone-50 flex items-center justify-center font-medium text-sm`}>
          {initial}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-[10px] uppercase tracking-widest text-stone-500">{roleLabel}</div>
          <div className="text-sm font-medium text-stone-900 capitalize">{displayName}</div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-stone-50 border-2 border-stone-900 shadow-lg z-30">
          <div className="px-4 py-3 border-b border-stone-200">
            <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Signed in as</div>
            <div className="text-sm font-mono text-stone-900 break-all">{email}</div>
            <div className="text-xs text-stone-600 mt-1">{roleLabel}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 text-left text-sm font-medium text-stone-900 hover:bg-stone-100 transition-colors"
          >
            Sign out · ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}
