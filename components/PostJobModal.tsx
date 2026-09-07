'use client';

import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Flame,
  Shirt,
  DollarSign,
  FileText,
  Phone,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CateringJob, CompanyProfile } from '../lib/types';
import confetti from 'canvas-confetti';
import { dispatchUrgentJobNotification } from '../lib/fcm';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyProfile: CompanyProfile | null;
  companyId: string;
  onSuccess: () => void;
}

const EVENT_TYPE_OPTIONS = [
  'Wedding Reception',
  'Wedding Sangeet & Mehendi',
  'Corporate Gala / Buffet',
  'Cocktail Party & Bar Service',
  'Birthday & Private Banquet',
  'Outdoor Farmhouse Gathering',
  'Exhibition & Food Stalls',
  'VIP Sit-Down Silver Service',
];

const DRESS_CODE_PRESETS = [
  'Black trousers, white collared shirt, black formal shoes',
  'All Black: Black trousers, black collared shirt & black shoes',
  'White formal shirt, black trousers, black tie',
  'Ethnic / Traditional (waistcoat provided by company)',
  'Smart Casual: Dark jeans, black plain t-shirt & sneakers',
];

export function PostJobModal({
  isOpen,
  onClose,
  companyProfile,
  companyId,
  onSuccess,
}: PostJobModalProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState(EVENT_TYPE_OPTIONS[0]);
  const [date, setDate] = useState('Tomorrow, 6:00 PM - 12:00 AM');
  const [time, setTime] = useState('6 Hours');
  const [location, setLocation] = useState(companyProfile?.location || 'Mumbai, Maharashtra');
  const [venue, setVenue] = useState('');
  const [workersNeeded, setWorkersNeeded] = useState<number>(8);
  const [isUrgent, setIsUrgent] = useState(false);
  const [normalWage, setNormalWage] = useState<number>(800);
  const [bonusWage, setBonusWage] = useState<number>(250);
  const [dressCode, setDressCode] = useState(DRESS_CODE_PRESETS[0]);
  const [customDressCode, setCustomDressCode] = useState('');
  const [description, setDescription] = useState(
    'Spot cash payment at end of shift. Hot staff dinner and tea provided. Looking for polite, well-groomed catering stewards.'
  );
  const [companyPhone, setCompanyPhone] = useState(companyProfile?.phone || '9820198201');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculatedTotalWage = isUrgent ? normalWage + bonusWage : normalWage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!title.trim() || !venue.trim() || !location.trim()) {
        throw new Error('Please fill in the event title, venue, and location.');
      }
      if (normalWage <= 0) {
        throw new Error('Please specify a valid wage.');
      }

      const jobId = 'job_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newJob: CateringJob = {
        jobId,
        companyId,
        companyName: companyProfile?.companyName || 'Catering Partner',
        companyPhone: companyPhone || '9820198201',
        title: title.trim(),
        eventType,
        date: date.trim(),
        time: time.trim(),
        location: location.trim(),
        venue: venue.trim(),
        workersNeeded: Number(workersNeeded),
        isUrgent,
        normalWage: Number(normalWage),
        bonusWage: isUrgent ? Number(bonusWage) : 0,
        totalWage: calculatedTotalWage,
        dressCode: customDressCode.trim() || dressCode,
        description: description.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
        applicationsCount: 0,
      };

      await setDoc(doc(db, 'jobs', jobId), newJob);

      // If urgent vacancy, notify all available workers via push & in-app alerts
      if (isUrgent) {
        dispatchUrgentJobNotification(newJob).catch((e) =>
          console.warn('Urgent notification warning:', e)
        );
      }

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to publish catering job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="close-post-job-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A651] bg-[#00A651]/10 px-2.5 py-1 rounded-full uppercase tracking-wider mb-1.5">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Event Company Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A]">
            Post a Catering Job
          </h2>
          <p className="text-xs text-gray-500">
            Publish your staffing requirement to hundreds of verified catering workers
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Urgent Vacancy Toggle */}
          <div
            onClick={() => setIsUrgent(!isUrgent)}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              isUrgent
                ? 'bg-red-50/80 border-[#FF3B30]'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition ${
                  isUrgent ? 'bg-[#FF3B30] text-white shadow-xs' : 'bg-gray-200 text-gray-600'
                }`}
              >
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-[#1A1A1A]">
                    Urgent Vacancy (Emergency Staffing)
                  </span>
                  {isUrgent && (
                    <span className="text-[10px] font-black bg-[#FF3B30] text-white px-2 py-0.5 rounded-full uppercase">
                      PIN TO TOP
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  Adds urgent bonus wage, alert badge, and pins job to top of feed
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={() => {}}
              className="w-5 h-5 accent-[#FF3B30] rounded cursor-pointer"
            />
          </div>

          {/* Job Title */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              Event Title / Requirement *
            </label>
            <input
              id="job-title-input"
              type="text"
              required
              placeholder="e.g. Grand Sangeet Night Banquet Stewards"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none text-xs font-semibold"
            />
          </div>

          {/* Event Type & Workers Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Event Type</label>
              <select
                id="job-event-type-select"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none text-xs font-semibold"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">Workers Needed</label>
              <div className="flex items-center">
                <input
                  id="job-workers-needed-input"
                  type="number"
                  min="1"
                  max="150"
                  required
                  value={workersNeeded}
                  onChange={(e) => setWorkersNeeded(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Wage Breakdown Box */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isUrgent ? 'bg-red-50/50 border-red-200' : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div className="font-bold text-gray-800 mb-2 flex items-center justify-between">
              <span>Wage & Compensation Structure</span>
              <span className="text-[11px] font-black text-[#00A651]">
                Total Pay: ₹{calculatedTotalWage}/day
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Normal Wage (₹/day)</label>
                <input
                  id="job-normal-wage-input"
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={normalWage}
                  onChange={(e) => setNormalWage(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:border-[#00A651] outline-none"
                />
              </div>

              {isUrgent ? (
                <div>
                  <label className="block text-[#FF3B30] font-bold mb-1">Urgent Bonus (₹)</label>
                  <input
                    id="job-bonus-wage-input"
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={bonusWage}
                    onChange={(e) => setBonusWage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl font-bold text-[#FF3B30] focus:border-[#FF3B30] outline-none"
                  />
                </div>
              ) : (
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-gray-500 italic">
                    Turn on &quot;Urgent Vacancy&quot; above to add an incentive bonus.
                  </span>
                </div>
              )}
            </div>

            {/* Calculated Breakdown Display */}
            {isUrgent && (
              <div className="mt-2 pt-2 border-t border-red-200 text-[11px] font-bold text-red-800 flex items-center justify-between">
                <span>Display on Card:</span>
                <span>
                  Normal ₹{normalWage} + ₹{bonusWage} Urgent Bonus = ₹{calculatedTotalWage}/day
                </span>
              </div>
            )}
          </div>

          {/* Date & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Date & Shift Timing *</label>
              <input
                id="job-date-input"
                type="text"
                required
                placeholder="e.g. This Saturday, 5:30 PM - 11:30 PM"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">Shift Duration</label>
              <input
                id="job-time-input"
                type="text"
                placeholder="e.g. 6 Hours"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
              />
            </div>
          </div>

          {/* Venue & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Banquet / Venue Name *</label>
              <input
                id="job-venue-input"
                type="text"
                required
                placeholder="e.g. Taj Lands End Ballroom"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">City / Location *</label>
              <input
                id="job-location-input"
                type="text"
                required
                placeholder="e.g. Bandra West, Mumbai"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
              />
            </div>
          </div>

          {/* Dress Code */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">Uniform / Dress Code</label>
            <select
              id="job-dress-select"
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-medium mb-1.5"
            >
              {DRESS_CODE_PRESETS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="custom">Custom dress code...</option>
            </select>
            {dressCode === 'custom' && (
              <input
                type="text"
                placeholder="Specify required shirt, trousers, shoes, or ethnic wear"
                value={customDressCode}
                onChange={(e) => setCustomDressCode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-medium"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">Event Instructions / Details</label>
            <textarea
              id="job-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify meal provision, payment terms, or special tasks..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-medium text-xs leading-relaxed"
            />
          </div>

          {/* WhatsApp Direct Phone */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              WhatsApp Contact Number for Direct Inquiries
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="job-whatsapp-phone-input"
                type="tel"
                required
                placeholder="e.g. 9820198201"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold text-xs"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="submit-post-job-btn"
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl text-white font-black text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 ${
              isUrgent
                ? 'bg-[#FF3B30] hover:bg-[#e02d23] shadow-red-500/20'
                : 'bg-[#00A651] hover:bg-[#008f45] shadow-[#00A651]/20'
            }`}
          >
            {loading ? (
              <span className="animate-spin text-xs">Publishing...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publish Catering Job Now</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
