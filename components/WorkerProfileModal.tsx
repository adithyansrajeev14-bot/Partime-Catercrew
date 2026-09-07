'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, DollarSign, Award, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorkerProfile } from '../lib/types';

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  onSaved?: () => void;
}

const AVAILABLE_SKILLS = [
  'Buffet Serving',
  'VIP Plating',
  'Live Counters',
  'Barista / Coffee Station',
  'Bartending Assistant',
  'Kitchen Steward',
  'Guest Hostess',
  'Silver Service',
  'Table Set-up & Clearing',
  'Cashiering / Token System',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export function WorkerProfileModal({ isOpen, onClose, uid, onSaved }: WorkerProfileModalProps) {
  const [profile, setProfile] = useState<WorkerProfile>({
    uid,
    name: '',
    age: 22,
    phone: '',
    location: 'Mumbai, Maharashtra',
    height: "5'10\"",
    experience: '2 Years',
    skills: ['Buffet Serving', 'VIP Plating'],
    availability: 'Immediate / Weekends',
    expectedWage: 900,
    profilePhotoUrl: PRESET_AVATARS[0],
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !uid) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'workers', uid));
        if (snap.exists()) {
          setProfile(snap.data() as WorkerProfile);
        }
      } catch (err) {
        console.error('Error fetching worker profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isOpen, uid]);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    setProfile((prev) => {
      const skills = prev.skills || [];
      if (skills.includes(skill)) {
        return { ...prev, skills: skills.filter((s) => s !== skill) };
      } else {
        return { ...prev, skills: [...skills, skill] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'workers', uid), {
        ...profile,
        age: Number(profile.age),
        expectedWage: Number(profile.expectedWage),
      }, { merge: true });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
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
          <h2 className="text-xl font-black text-[#1A1A1A]">Worker Profile</h2>
          <p className="text-xs text-gray-500">
            Event companies review your experience and skills before booking you for catering gigs
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading your profile...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Photo & Presets */}
            <div>
              <label className="block font-bold text-gray-800 mb-1.5">Profile Photo</label>
              <div className="flex items-center gap-3 mb-2">
                {profile.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profilePhotoUrl}
                    alt={profile.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#00A651]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#00A651] font-black text-xl flex items-center justify-center">
                    {profile.name ? profile.name.charAt(0) : 'W'}
                  </div>
                )}
                <div>
                  <span className="text-[11px] text-gray-500 block mb-1">
                    Select an avatar or paste a photo URL:
                  </span>
                  <div className="flex items-center gap-2">
                    {PRESET_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setProfile({ ...profile, profilePhotoUrl: url })}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition ${
                          profile.profilePhotoUrl === url ? 'border-[#00A651] scale-105' : 'border-transparent opacity-70'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <input
                type="url"
                placeholder="Or paste custom image URL..."
                value={profile.profilePhotoUrl || ''}
                onChange={(e) => setProfile({ ...profile, profilePhotoUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none text-xs"
              />
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
                />
              </div>
            </div>

            {/* Age, Height, Location */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Age</label>
                <input
                  type="number"
                  min="18"
                  max="60"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Height</label>
                <input
                  type="text"
                  placeholder="e.g. 5'10&quot;"
                  value={profile.height || ''}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Expected Wage (₹)</label>
                <input
                  type="number"
                  step="50"
                  value={profile.expectedWage}
                  onChange={(e) => setProfile({ ...profile, expectedWage: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-bold text-[#00A651]"
                />
              </div>
            </div>

            {/* Location & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Location / City</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Experience</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Years in Banquets"
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block font-bold text-gray-800 mb-1">Availability</label>
              <input
                type="text"
                placeholder="e.g. Immediate, Weekends & Evenings"
                value={profile.availability}
                onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-semibold"
              />
            </div>

            {/* Skills selection */}
            <div>
              <label className="block font-bold text-gray-800 mb-1.5">
                Catering Skills (Tap to select)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_SKILLS.map((skill) => {
                  const selected = profile.skills?.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        selected
                          ? 'bg-[#00A651] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block font-bold text-gray-800 mb-1">Short Bio</label>
              <textarea
                rows={2}
                placeholder="Share your strengths, types of events handled, or grooming standards..."
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none font-medium leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-[#00A651] hover:bg-[#008f45] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#00A651]/20 flex items-center justify-center gap-2 transition"
            >
              {saving ? <span>Saving Profile...</span> : <span>Save Profile Changes</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
