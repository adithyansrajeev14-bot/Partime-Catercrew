'use client';

import React from 'react';
import { ChefHat, Building2, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { UserRole } from '../lib/types';

interface OnboardingModalProps {
  isOpen: boolean;
  onSelectRole: (role: UserRole) => void;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onSelectRole, onClose }: OnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden flex flex-col items-center text-center">
        {/* Decorative subtle background circle */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#00A651]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#00A651]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Logo Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00A651] to-[#00c962] text-white flex items-center justify-center shadow-lg shadow-[#00A651]/25 mb-4">
          <ChefHat className="w-9 h-9 stroke-[2.2]" />
        </div>

        {/* App Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight mb-1">
          Cater<span className="text-[#00A651]">CREW</span>
        </h1>
        <p className="text-xs text-gray-500 font-medium mb-6">
          Fast catering job marketplace for events & banquets
        </p>

        {/* Main Prompt */}
        <div className="w-full bg-[#f6faf8] rounded-2xl p-4 border border-[#e0f2e9] mb-6">
          <p className="text-xs font-bold text-[#00A651] uppercase tracking-wider mb-1">
            Get Started
          </p>
          <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A]">
            Who are you posting as?
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Choose your role to customize your catering experience. You can easily switch anytime.
          </p>
        </div>

        {/* Action Pill Buttons */}
        <div className="w-full flex flex-col gap-3.5 mb-8">
          {/* Company Pill (Green) */}
          <button
            id="onboarding-company-btn"
            type="button"
            onClick={() => {
              onSelectRole('company');
              onClose();
            }}
            className="w-full group relative flex items-center justify-between px-6 py-4 rounded-full bg-[#00A651] hover:bg-[#008f45] active:scale-[0.98] text-white shadow-md shadow-[#00A651]/25 transition-all"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-base font-black tracking-wide uppercase">
                  Company
                </div>
                <div className="text-xs text-green-100 font-normal">
                  Post catering jobs & hire workers
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Worker Pill (Dark Grey) */}
          <button
            id="onboarding-worker-btn"
            type="button"
            onClick={() => {
              onSelectRole('worker');
              onClose();
            }}
            className="w-full group relative flex items-center justify-between px-6 py-4 rounded-full bg-[#1A1A1A] hover:bg-black active:scale-[0.98] text-white shadow-md shadow-black/20 transition-all"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-base font-black tracking-wide uppercase">
                  Individual / Worker
                </div>
                <div className="text-xs text-gray-300 font-normal">
                  Find catering gigs & daily wages
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Branding Footer */}
        <div className="pt-2 border-t border-gray-100 w-full flex flex-col items-center">
          <div className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
            from <span className="text-[#1A1A1A] font-black">PARTIME</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5">
            Connecting Event Companies with Reliable Catering Staff
          </span>
        </div>
      </div>
    </div>
  );
}
