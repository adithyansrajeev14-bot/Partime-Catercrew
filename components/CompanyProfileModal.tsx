'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, MapPin, FileText, Check } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CompanyProfile } from '../lib/types';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  onSaved?: () => void;
}

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1555244162-803834f70033?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80',
];

export function CompanyProfileModal({ isOpen, onClose, uid, onSaved }: CompanyProfileModalProps) {
  const [profile, setProfile] = useState<CompanyProfile>({
    uid,
    companyName: '',
    contactPerson: '',
    phone: '',
    location: 'Mumbai, Maharashtra',
    address: '',
    serviceType: 'Luxury Weddings & Corporate Buffets',
    experience: '8+ Years',
    description: '',
    logoUrl: PRESET_LOGOS[0],
    verified: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !uid) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'companies', uid));
        if (snap.exists()) {
          setProfile(snap.data() as CompanyProfile);
        }
      } catch (err) {
        console.error('Error fetching company profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isOpen, uid]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'companies', uid), profile, { merge: true });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving company profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl font-black text-[#1A1A1A]">Company Profile</h2>
          <p className="text-xs text-gray-500">
            Workers see these details when applying to your catering gigs
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading company profile...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Logo and Presets */}
            <div>
              <label className="block font-bold text-gray-800 mb-1.5">Company Logo</label>
              <div className="flex items-center gap-3 mb-2">
                {profile.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.logoUrl}
                    alt={profile.companyName}
                    className="w-14 h-14 rounded-2xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#00A651]" />
                  </div>
                )}
                <div>
                  <span className="text-[11px] text-gray-500 block mb-1">
                    Select a preset logo or enter image URL:
                  </span>
                  <div className="flex items-center gap-2">
                    {PRESET_LOGOS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setProfile({ ...profile, logoUrl: url })}
                        className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition ${
                          profile.logoUrl === url ? 'border-[#00A651]' : 'border-transparent opacity-70'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Logo ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <input
                type="url"
                placeholder="Or paste custom logo URL..."
                value={profile.logoUrl || ''}
                onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none text-xs font-medium"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block font-bold text-gray-800 mb-1">Company / Brand Name *</label>
              <input
                type="text"
                required
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold text-xs"
              />
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={profile.contactPerson}
                  onChange={(e) => setProfile({ ...profile, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Official WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold text-xs"
                />
              </div>
            </div>

            {/* Location & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-800 mb-1">City / Region *</label>
                <input
                  type="text"
                  required
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Service Type</label>
                <input
                  type="text"
                  value={profile.serviceType}
                  onChange={(e) => setProfile({ ...profile, serviceType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">Office / Kitchen Address</label>
              <input
                type="text"
                placeholder="e.g. Bandra Kurla Complex, Hall 4, Mumbai"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold text-xs"
              />
            </div>

            {/* Experience & Description */}
            <div>
              <label className="block font-bold text-gray-800 mb-1">Company Experience</label>
              <input
                type="text"
                placeholder="e.g. 10+ Years in Luxury Banquets"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">About Your Catering Business</label>
              <textarea
                rows={2}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Briefly describe your events, catering style, or staff expectations..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-medium leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-[#00A651] hover:bg-[#008f45] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#00A651]/20 flex items-center justify-center gap-2 transition"
            >
              {saving ? <span>Saving...</span> : <span>Save Company Profile</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
