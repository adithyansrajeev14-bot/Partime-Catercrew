'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  UserCheck,
  Star,
  MapPin,
  Clock,
  DollarSign,
  MessageCircle,
  Phone,
  ShieldCheck,
  Award
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorkerProfile } from '../lib/types';

export function WorkersDirectory() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'workers'),
      (snapshot) => {
        const list: WorkerProfile[] = [];
        snapshot.forEach((d) => list.push(d.data() as WorkerProfile));
        setWorkers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Workers directory listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((w) => {
      w.skills?.forEach((s) => set.add(s));
    });
    return Array.from(set);
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesSearch =
        !searchQuery ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSkill =
        selectedSkill === 'all' || w.skills?.includes(selectedSkill);

      return matchesSearch && matchesSkill;
    });
  }, [workers, searchQuery, selectedSkill]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#00A651]/10 text-[#00A651] flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-black text-[#1A1A1A]">Available Catering Staff</h2>
        </div>
        <p className="text-xs text-gray-500">
          Browse verified stewards, bartenders, and banquet servers. Contact directly on WhatsApp for immediate event booking.
        </p>
      </div>

      {/* Search & Skill Chips */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="worker-search-input"
            type="text"
            placeholder="Search workers by name, city, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00A651] shadow-xs"
          />
        </div>

        {/* Skill filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSkill('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedSkill === 'all'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Staff ({workers.length})
          </button>
          {allSkills.map((sk) => (
            <button
              key={sk}
              type="button"
              onClick={() => setSelectedSkill(sk)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedSkill === sk
                  ? 'bg-[#00A651] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {sk}
            </button>
          ))}
        </div>
      </div>

      {/* Workers Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-xs text-gray-500">
          Loading worker directory...
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-300 text-center text-xs text-gray-500">
          No catering staff found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredWorkers.map((w) => {
            const cleanPhone = w.phone?.replace(/\D/g, '') || '';
            const waUrl = `https://wa.me/${
              cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone || '919876543210'
            }?text=${encodeURIComponent(
              `Hi ${w.name}, we saw your profile on CaterCrew! We have an upcoming catering event and would like to hire you. Are you available?`
            )}`;

            return (
              <div
                key={w.uid}
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {w.profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.profilePhotoUrl}
                          alt={w.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#00A651]/30 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00A651] font-black text-base flex items-center justify-center shrink-0">
                          {w.name ? w.name.charAt(0).toUpperCase() : 'W'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-[#1A1A1A]">{w.name}</h4>
                          <span className="text-[10px] font-bold text-gray-500">
                            ({w.age} yrs{w.height ? ` • ${w.height}` : ''})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{w.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 justify-end">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{w.rating || 4.9}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {w.completedGigs || 20}+ gigs
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {w.skills?.map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  {/* Bio / Experience */}
                  {w.bio && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                      {w.bio}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100 mb-3.5">
                    <div>
                      <span className="text-gray-400">Experience: </span>
                      <span className="font-semibold text-gray-800">{w.experience}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Rate: </span>
                      <span className="font-bold text-[#00A651]">₹{w.expectedWage || 800}/day</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Availability: </span>
                      <span className="font-semibold text-gray-800">{w.availability}</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Contact Action */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4 fill-[#25D366]" />
                  <span>Contact on WhatsApp</span>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
