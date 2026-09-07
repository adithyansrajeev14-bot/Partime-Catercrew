'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Building2, UserCheck, ShieldCheck, LogIn, LogOut, User, RefreshCw } from 'lucide-react';
import { UserRole, WebsiteSettings } from '../lib/types';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: FirebaseUser | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  siteSettings: WebsiteSettings | null;
}

export function Header({
  currentRole,
  onRoleChange,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
  siteSettings,
}: HeaderProps) {
  const [clickCount, setClickCount] = useState(0);
  const [showSecretHint, setShowSecretHint] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden 7 consecutive clicks on the logo
  const handleLogoClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= 7) {
        onOpenAdmin();
        setShowSecretHint(false);
        return 0;
      }
      if (next >= 4) {
        setShowSecretHint(true);
      }
      return next;
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setClickCount(0);
      setShowSecretHint(false);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Logo with 7-click easter egg */}
        <div
          id="catercrew-logo-btn"
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer select-none group active:scale-95 transition-transform"
          title="CaterCrew Logo"
        >
          {siteSettings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={siteSettings.logoUrl}
              alt="CaterCrew Logo"
              className="w-9 h-9 object-contain rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00A651] to-[#00c962] text-white flex items-center justify-center shadow-sm">
              <ChefHat className="w-6 h-6 stroke-[2.2]" />
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tracking-tight text-[#1A1A1A]">
                Cater<span className="text-[#00A651]">CREW</span>
              </span>
              {showSecretHint && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                  {7 - clickCount} left
                </span>
              )}
            </div>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 -mt-1">
              by Partime
            </span>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200">
          <button
            id="role-worker-toggle"
            type="button"
            onClick={() => onRoleChange('worker')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentRole === 'worker'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Worker</span>
          </button>
          <button
            id="role-company-toggle"
            type="button"
            onClick={() => onRoleChange('company')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentRole === 'company'
                ? 'bg-[#00A651] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Company</span>
          </button>
        </div>

        {/* User Account / Profile */}
        <div className="flex items-center gap-1.5">
          {currentUser ? (
            <div className="flex items-center gap-1">
              <button
                id="header-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-800 transition"
              >
                <div className="w-5 h-5 rounded-full bg-[#00A651]/20 text-[#00A651] flex items-center justify-center font-bold text-[10px]">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'Profile'}
                </span>
              </button>
              <button
                id="header-signout-btn"
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="header-login-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1 bg-[#00A651] text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#008f45] shadow-xs active:scale-95 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
