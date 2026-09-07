'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Building2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  MessageCircle,
  AlertCircle,
  Phone,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CateringJob, JobApplication } from '../lib/types';

interface CompanyJobsViewProps {
  companyId: string;
  onOpenPostJob: () => void;
  onRateWorker?: (job: CateringJob, app: JobApplication) => void;
}

export function CompanyJobsView({ companyId, onOpenPostJob, onRateWorker }: CompanyJobsViewProps) {
  const [jobs, setJobs] = useState<CateringJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Realtime listener for company's posted jobs
  useEffect(() => {
    if (!companyId) return;
    const qJobs = query(collection(db, 'jobs'), where('companyId', '==', companyId));
    const unsubscribeJobs = onSnapshot(
      qJobs,
      (snapshot) => {
        const list: CateringJob[] = [];
        snapshot.forEach((d) => list.push(d.data() as CateringJob));
        setJobs(list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
        setLoading(false);
      },
      (err) => {
        console.warn('Jobs listener error:', err);
        setLoading(false);
      }
    );

    // Realtime listener for applications to this company's jobs
    const qApps = query(collection(db, 'applications'), where('companyId', '==', companyId));
    const unsubscribeApps = onSnapshot(
      qApps,
      (snapshot) => {
        const appList: JobApplication[] = [];
        snapshot.forEach((d) => appList.push(d.data() as JobApplication));
        setApplications(appList);
      },
      (err) => {
        console.warn('Applications listener error:', err);
      }
    );

    return () => {
      unsubscribeJobs();
      unsubscribeApps();
    };
  }, [companyId]);

  const handleUpdateApplicationStatus = async (appId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus });
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'filled' ? 'open' : 'filled';
      await updateDoc(doc(db, 'jobs', jobId), { status: nextStatus });
    } catch (err) {
      console.error('Error toggling job status:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to remove this catering job?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Post Job Button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#1A1A1A]">Your Catering Postings</h2>
          <p className="text-xs text-gray-500">
            Review worker applications, manage shift status, and connect on WhatsApp
          </p>
        </div>
        <button
          id="company-post-job-top-btn"
          type="button"
          onClick={onOpenPostJob}
          className="py-2.5 px-4 rounded-xl bg-[#00A651] hover:bg-[#008f45] active:scale-[0.98] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-xs text-gray-500">
          Loading your company events...
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-300 text-center flex flex-col items-center justify-center gap-3">
          <Building2 className="w-10 h-10 text-gray-300" />
          <div>
            <h4 className="text-sm font-bold text-gray-800">No catering jobs posted yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              Need banquet servers, bartenders, or live counter stewards? Post your first event to hire workers instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPostJob}
            className="mt-2 py-2.5 px-5 rounded-xl bg-[#00A651] text-white font-bold text-xs shadow-xs hover:bg-[#008f45] transition"
          >
            Post Your First Job
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {jobs.map((job) => {
            const jobApps = applications.filter((a) => a.jobId === job.jobId);
            const isExpanded = expandedJobId === job.jobId;

            return (
              <div
                key={job.jobId}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs"
              >
                {/* Job Summary Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          job.status === 'filled'
                            ? 'bg-gray-100 text-gray-600'
                            : job.isUrgent
                            ? 'bg-[#FF3B30] text-white'
                            : 'bg-[#00A651] text-white'
                        }`}
                      >
                        {job.status === 'filled' ? 'FILLED' : job.isUrgent ? 'URGENT VACANCY' : 'OPEN'}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">{job.eventType}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleJobStatus(job.jobId, job.status)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
                      >
                        {job.status === 'filled' ? 'Re-open' : 'Mark Filled'}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.jobId)}
                        title="Delete Job"
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-[#1A1A1A] mb-1.5">{job.title}</h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
                    <div>
                      <span className="text-gray-400">Date: </span>
                      <span className="font-semibold text-gray-800">{job.date}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Pay: </span>
                      <span className="font-bold text-[#00A651]">₹{job.totalWage}/day</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Needed: </span>
                      <span className="font-semibold text-gray-800">{job.workersNeeded} staff</span>
                    </div>
                  </div>

                  {/* Applicants Accordion Toggle */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedJobId(isExpanded ? null : job.jobId)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#00A651] hover:underline"
                    >
                      <Users className="w-4 h-4" />
                      <span>
                        {jobApps.length} {jobApps.length === 1 ? 'Applicant' : 'Applicants'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <span className="text-[11px] text-gray-400">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Expanded Applicants Drawer */}
                {isExpanded && (
                  <div className="bg-gray-50 p-4 border-t border-gray-200">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                      Candidates Applied ({jobApps.length})
                    </h4>

                    {jobApps.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2">
                        No workers have applied yet. Workers in your area will see this on the live feed.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {jobApps.map((app) => {
                          const cleanWorkerPhone = app.workerPhone?.replace(/\D/g, '') || '';
                          const workerWa = `https://wa.me/${
                            cleanWorkerPhone.length === 10 ? `91${cleanWorkerPhone}` : cleanWorkerPhone
                          }?text=${encodeURIComponent(
                            `Hi ${app.workerName}, this is ${job.companyName} regarding your application for "${job.title}". We would like to confirm your shift!`
                          )}`;

                          return (
                            <div
                              key={app.applicationId}
                              className="bg-white rounded-xl p-3 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#00A651] font-bold text-sm flex items-center justify-center shrink-0">
                                  {app.workerName ? app.workerName.charAt(0).toUpperCase() : 'W'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-black text-gray-900">{app.workerName}</h5>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                                        app.status === 'accepted'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : app.status === 'rejected'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {app.status}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                    <span>Phone: {app.workerPhone || 'Provided in chat'}</span>
                                    <span>•</span>
                                    <span>Applied {new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Candidate Actions */}
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <a
                                  href={workerWa}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 transition flex items-center gap-1 text-xs font-bold"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4 fill-[#25D366]" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </a>

                                {app.status === 'accepted' && onRateWorker && (
                                  <button
                                    type="button"
                                    onClick={() => onRateWorker(job, app)}
                                    className="p-1.5 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1 transition"
                                    title="Rate and Review Worker"
                                  >
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>Rate</span>
                                  </button>
                                )}

                                {app.status !== 'accepted' && (
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.applicationId, 'accepted')}
                                    className="p-1.5 px-2.5 rounded-lg bg-[#00A651] hover:bg-[#008f45] text-white text-xs font-bold flex items-center gap-1 transition"
                                    title="Accept Worker"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                )}

                                {app.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(app.applicationId, 'rejected')}
                                    className="p-1.5 px-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition"
                                    title="Reject Worker"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
