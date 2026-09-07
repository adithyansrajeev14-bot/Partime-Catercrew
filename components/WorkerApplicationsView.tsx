'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JobApplication, CateringJob } from '../lib/types';
import { Briefcase, Calendar, Clock, MapPin, MessageCircle, AlertCircle, CheckCircle, Clock3, XCircle, Star } from 'lucide-react';

interface WorkerApplicationsViewProps {
  workerId: string;
  onBrowseJobs: () => void;
  onRateCompany?: (job: CateringJob, app: JobApplication) => void;
}

export function WorkerApplicationsView({ workerId, onBrowseJobs, onRateCompany }: WorkerApplicationsViewProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobsMap, setJobsMap] = useState<Record<string, CateringJob>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerId) return;

    // Listen to applications
    const q = query(collection(db, 'applications'), where('workerId', '==', workerId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: JobApplication[] = [];
        snapshot.forEach((d) => list.push(d.data() as JobApplication));
        setApplications(
          list.sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime())
        );
        setLoading(false);
      },
      (err) => {
        console.warn('Worker applications listener error:', err);
        setLoading(false);
      }
    );

    // Also get all jobs map for details
    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const map: Record<string, CateringJob> = {};
      snapshot.forEach((d) => {
        const j = d.data() as CateringJob;
        map[j.jobId] = j;
      });
      setJobsMap(map);
    });

    return () => {
      unsubscribe();
      unsubJobs();
    };
  }, [workerId]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs">
        <h2 className="text-lg font-black text-[#1A1A1A]">My Shift Applications</h2>
        <p className="text-xs text-gray-500">
          Track the status of your catering shift requests and chat directly with managers
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-xs text-gray-500">
          Loading your applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-300 text-center flex flex-col items-center justify-center gap-3">
          <Briefcase className="w-10 h-10 text-gray-300" />
          <div>
            <h4 className="text-sm font-bold text-gray-800">You haven&apos;t applied to any shifts yet</h4>
            <p className="text-xs text-gray-500 max-w-xs mt-1">
              Browse the live feed for urgent wedding sangeets, corporate banquets, and buffet shifts with daily wage payouts.
            </p>
          </div>
          <button
            type="button"
            onClick={onBrowseJobs}
            className="py-2.5 px-4 rounded-xl bg-[#00A651] text-white font-bold text-xs shadow-xs hover:bg-[#008f45] transition"
          >
            Find a Job Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const job = jobsMap[app.jobId];
            const title = job?.title || app.jobTitle || 'Catering Event Shift';
            const location = job?.location || 'Venue Location';
            const date = job?.date || app.jobDate || 'Upcoming Date';
            const pay = job?.totalWage || app.totalWage || 850;
            const companyName = job?.companyName || 'Event Company';
            const cleanPhone = job?.companyPhone?.replace(/\D/g, '') || '';
            const waUrl = `https://wa.me/${
              cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone || '919820198201'
            }?text=${encodeURIComponent(
              `Hi ${companyName}, I applied on CaterCrew for "${title}". Following up on my application status.`
            )}`;

            return (
              <div
                key={app.applicationId}
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-600">{companyName}</span>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      app.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : app.status === 'rejected'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {app.status === 'accepted' ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Accepted • Slot Confirmed</span>
                      </>
                    ) : app.status === 'rejected' ? (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Position Filled</span>
                      </>
                    ) : (
                      <>
                        <Clock3 className="w-3 h-3" />
                        <span>Application Pending</span>
                      </>
                    )}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-[#1A1A1A] mb-2">{title}</h3>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  <div>
                    <span className="text-gray-400">Date: </span>
                    <span className="font-semibold text-gray-800">{date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Pay: </span>
                    <span className="font-bold text-[#00A651]">₹{pay}/day</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400">
                    Applied on {new Date(app.appliedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {app.status === 'accepted' && onRateCompany && (
                      <button
                        type="button"
                        onClick={() => job && onRateCompany(job, app)}
                        className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 transition"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Rate Company</span>
                      </button>
                    )}

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-[#25D366]/10 text-[#128C7E] font-bold text-xs flex items-center gap-1 hover:bg-[#25D366]/20 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]" />
                      <span>Message Company</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
