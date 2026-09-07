'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Shirt,
  MessageCircle,
  CheckCircle2,
  Building2,
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles
} from 'lucide-react';
import { CateringJob } from '../lib/types';

interface JobCardProps {
  job: CateringJob;
  hasApplied: boolean;
  onApply: (job: CateringJob) => void;
  isWorker: boolean;
  onRequireAuth: () => void;
  isApplying?: boolean;
}

export function JobCard({
  job,
  hasApplied,
  onApply,
  isWorker,
  onRequireAuth,
  isApplying = false,
}: JobCardProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format WhatsApp message
  const cleanPhone = job.companyPhone ? job.companyPhone.replace(/\D/g, '') : '';
  const whatsappUrl = `https://wa.me/${cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '919820198201'}?text=${encodeURIComponent(
    `Hi ${job.companyName}, I saw your catering vacancy on CaterCrew: "${job.title}" (${job.date}, ${job.location}). I am interested in working this shift! Please confirm my slot.`
  )}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Catering Gig on CaterCrew: ${job.title} - Pay: ₹${job.totalWage}/day at ${job.location}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `CaterCrew Job: ${job.title} | Pay: ₹${job.totalWage}/day | Date: ${job.date} | Contact: ${job.companyPhone}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id={`job-card-${job.jobId}`}
      className={`relative bg-white rounded-2xl transition-all overflow-hidden ${
        job.isUrgent
          ? 'border-2 border-[#FF3B30] shadow-md shadow-red-500/10'
          : 'border border-gray-200/90 shadow-xs hover:border-gray-300'
      }`}
    >
      {/* Urgent Top Bar Ribbon */}
      {job.isUrgent && (
        <div className="bg-[#FF3B30] text-white px-3.5 py-1 flex items-center justify-between text-xs font-black tracking-wide">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="uppercase tracking-wider text-[11px]">URGENT VACANCY • IMMEDIATE HIRING</span>
          </div>
          <span className="text-[11px] font-bold bg-black/20 px-2 py-0.5 rounded-full">
            +₹{job.bonusWage} BONUS
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Header: Company & Event Type */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 shrink-0">
              <Building2 className="w-4 h-4 text-[#00A651]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 line-clamp-1">
                {job.companyName}
              </h4>
              <span className="inline-block text-[10px] font-semibold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">
                {job.eventType}
              </span>
            </div>
          </div>

          <button
            onClick={handleShare}
            title="Share job"
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition shrink-0"
          >
            {copied ? (
              <span className="text-[10px] font-bold text-[#00A651]">Copied!</span>
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Job Title */}
        <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] leading-snug mb-3">
          {job.title}
        </h3>

        {/* Wage Breakdown Box (Crucial for Urgent & Standard) */}
        <div
          className={`p-3 rounded-xl mb-3.5 border ${
            job.isUrgent
              ? 'bg-red-50/70 border-red-200'
              : 'bg-emerald-50/60 border-emerald-200/80'
          }`}
        >
          <div className="flex items-baseline justify-between flex-wrap gap-1">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Daily Pay Rate:
            </span>
            <div className="text-right">
              <span
                className={`text-xl font-black ${
                  job.isUrgent ? 'text-[#FF3B30]' : 'text-[#00A651]'
                }`}
              >
                ₹{job.totalWage.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-gray-500"> / day</span>
            </div>
          </div>

          {/* Explicit Wage breakdown formula */}
          {job.isUrgent && job.bonusWage > 0 ? (
            <div className="mt-1.5 pt-1.5 border-t border-red-200/60 flex items-center justify-between text-xs font-medium text-red-900">
              <span>Wage Breakdown:</span>
              <span className="font-bold">
                Normal ₹{job.normalWage} + ₹{job.bonusWage} Urgent Bonus = ₹{job.totalWage}/day
              </span>
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-gray-600 font-medium">
              Standard shift wage • Spot cash or direct UPI post-event
            </div>
          )}
        </div>

        {/* Quick Job Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-3.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-semibold truncate">{job.date}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-semibold truncate">{job.time}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate" title={`${job.venue}, ${job.location}`}>
              {job.venue || job.location}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-800">
              {job.workersNeeded} workers needed
            </span>
          </div>
        </div>

        {/* Dress Code Highlight */}
        {job.dressCode && (
          <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-2.5 border border-gray-200/80 mb-3 text-xs text-gray-700">
            <Shirt className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900">Dress Code: </span>
              <span>{job.dressCode}</span>
            </div>
          </div>
        )}

        {/* Description Accordion */}
        {job.description && (
          <div className="mb-4">
            <p
              className={`text-xs text-gray-600 leading-relaxed ${
                !showFullDesc ? 'line-clamp-2' : ''
              }`}
            >
              {job.description}
            </p>
            {job.description.length > 90 && (
              <button
                type="button"
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-[11px] font-bold text-[#00A651] mt-1 flex items-center gap-0.5 hover:underline"
              >
                {showFullDesc ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Read event instructions</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Actions Bar: 1-Tap Apply & WhatsApp Direct Link */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
          {/* Apply Button */}
          {hasApplied ? (
            <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 select-none">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Applied ✓ (Pending Confirmation)</span>
            </div>
          ) : (
            <button
              id={`apply-btn-${job.jobId}`}
              type="button"
              disabled={isApplying || job.status === 'filled'}
              onClick={() => {
                if (!isWorker) {
                  onRequireAuth();
                } else {
                  onApply(job);
                }
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-xs ${
                job.status === 'filled'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : job.isUrgent
                  ? 'bg-[#FF3B30] hover:bg-[#e02d23]'
                  : 'bg-[#00A651] hover:bg-[#008f45]'
              }`}
            >
              {isApplying ? (
                <span className="animate-spin text-xs">● ● ●</span>
              ) : job.status === 'filled' ? (
                <span>Position Filled</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Now</span>
                </>
              )}
            </button>
          )}

          {/* Direct WhatsApp Contact Button */}
          <a
            id={`whatsapp-btn-${job.jobId}`}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] shrink-0"
            title="Chat directly on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
