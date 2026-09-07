'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Trash2,
  Settings,
  Briefcase,
  Users,
  Building2,
  FileText,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Save,
  Flame,
  Sparkles
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CateringJob, JobApplication, WorkerProfile, CompanyProfile, WebsiteSettings } from '../lib/types';
import { seedInitialDataIfNeeded } from '../lib/seedData';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: WebsiteSettings | null;
  onSettingsUpdated: (settings: WebsiteSettings) => void;
}

export function AdminModal({
  isOpen,
  onClose,
  siteSettings,
  onSettingsUpdated,
}: AdminModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'apps' | 'workers' | 'companies' | 'settings'>('jobs');

  // Data states
  const [jobs, setJobs] = useState<CateringJob[]>([]);
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Settings form
  const [logoUrl, setLogoUrl] = useState(siteSettings?.logoUrl || '');
  const [logoText, setLogoText] = useState(siteSettings?.logoText || 'CaterCREW');
  const [fontFamily, setFontFamily] = useState(siteSettings?.fontFamily || 'Plus Jakarta Sans');
  const [faviconUrl, setFaviconUrl] = useState(siteSettings?.faviconUrl || '');
  const [announcement, setAnnouncement] = useState(siteSettings?.announcement || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Load all collections for admin inspection
  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      const [jobsSnap, appsSnap, workersSnap, compSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'jobs')),
        getDocs(collection(db, 'applications')),
        getDocs(collection(db, 'workers')),
        getDocs(collection(db, 'companies')),
        getDoc(doc(db, 'settings', 'general')),
      ]);

      const jobsList: CateringJob[] = [];
      jobsSnap.forEach((d) => jobsList.push(d.data() as CateringJob));
      setJobs(jobsList);

      const appsList: JobApplication[] = [];
      appsSnap.forEach((d) => appsList.push(d.data() as JobApplication));
      setApps(appsList);

      const workersList: WorkerProfile[] = [];
      workersSnap.forEach((d) => workersList.push(d.data() as WorkerProfile));
      setWorkers(workersList);

      const compList: CompanyProfile[] = [];
      compSnap.forEach((d) => compList.push(d.data() as CompanyProfile));
      setCompanies(compList);

      if (settingsSnap.exists()) {
        const s = settingsSnap.data() as WebsiteSettings;
        setLogoUrl(s.logoUrl || '');
        setLogoText(s.logoText || 'CaterCREW');
        setFontFamily(s.fontFamily || 'Plus Jakarta Sans');
        setFaviconUrl(s.faviconUrl || '');
        setAnnouncement(s.announcement || '');
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin code is 'crew777' or 'admin123' or 'partime'
    if (['crew777', 'admin123', 'partime', 'admin'].includes(adminPasscode.trim().toLowerCase())) {
      setIsAuthenticated(true);
      setPasscodeError(false);
      loadAdminData();
    } else {
      setPasscodeError(true);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Admin: Delete this job permanently?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Admin: Delete this application record?')) return;
    try {
      await deleteDoc(doc(db, 'applications', appId));
      setApps((prev) => prev.filter((a) => a.applicationId !== appId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorker = async (uid: string) => {
    if (!confirm('Admin: Remove this worker profile?')) return;
    try {
      await deleteDoc(doc(db, 'workers', uid));
      setWorkers((prev) => prev.filter((w) => w.uid !== uid));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCompany = async (uid: string) => {
    if (!confirm('Admin: Remove this company profile?')) return;
    try {
      await deleteDoc(doc(db, 'companies', uid));
      setCompanies((prev) => prev.filter((c) => c.uid !== uid));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUrgent = async (job: CateringJob) => {
    try {
      const nextUrgent = !job.isUrgent;
      const nextTotal = nextUrgent ? job.normalWage + 300 : job.normalWage;
      await updateDoc(doc(db, 'jobs', job.jobId), {
        isUrgent: nextUrgent,
        bonusWage: nextUrgent ? 300 : 0,
        totalWage: nextTotal,
      });
      setJobs((prev) =>
        prev.map((j) =>
          j.jobId === job.jobId ? { ...j, isUrgent: nextUrgent, bonusWage: nextUrgent ? 300 : 0, totalWage: nextTotal } : j
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const newSettings: WebsiteSettings = {
        logoUrl: logoUrl.trim(),
        logoText: logoText.trim() || 'CaterCREW',
        fontFamily: fontFamily.trim() || 'Plus Jakarta Sans',
        faviconUrl: faviconUrl.trim(),
        announcement: announcement.trim(),
      };
      await setDoc(doc(db, 'settings', 'general'), newSettings);
      onSettingsUpdated(newSettings);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSeedDefaults = async () => {
    setLoadingData(true);
    try {
      await seedInitialDataIfNeeded();
      await loadAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Not authenticated state: Passcode screen */}
        {!isAuthenticated ? (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-3 shadow-md">
              <ShieldCheck className="w-8 h-8 text-[#00A651]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Secret Trigger Activated (7 Clicks)</span>
            </div>

            <h2 className="text-xl font-black text-[#1A1A1A]">CaterCrew Admin Portal</h2>
            <p className="text-xs text-gray-500 max-w-xs mt-1 mb-5">
              Enter the administrator security passcode to manage live jobs, applications, workers, and branding settings.
            </p>

            <form onSubmit={handlePasscodeSubmit} className="w-full max-w-xs space-y-3">
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="admin-passcode-input"
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter Passcode (e.g. crew777)"
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    setPasscodeError(false);
                  }}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-none transition ${
                    passcodeError
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:border-[#00A651]'
                  }`}
                />
              </div>

              {passcodeError && (
                <p className="text-[11px] font-bold text-red-600">
                  Incorrect passcode. Hint: Use <span className="underline">crew777</span>
                </p>
              )}

              <button
                id="admin-login-submit"
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-md transition active:scale-[0.99]"
              >
                Access Admin Portal
              </button>

              <p className="text-[10px] text-gray-400">
                Default Master Key: <code className="text-gray-700 font-mono font-bold">crew777</code>
              </p>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div>
            {/* Header and Stats */}
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#00A651]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1A1A1A]">Master Admin Control</h2>
                  <span className="text-[10px] font-semibold text-gray-400">
                    Live Firestore Real-time Collections
                  </span>
                </div>
              </div>

              <button
                onClick={handleSeedDefaults}
                className="text-[11px] font-bold text-[#00A651] bg-[#00A651]/10 px-2.5 py-1.5 rounded-lg hover:bg-[#00A651]/20 transition flex items-center gap-1"
                title="Populate default sample gigs if empty"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Seed Sample Data</span>
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Jobs</span>
                <span className="text-base font-black text-[#1A1A1A]">{jobs.length}</span>
              </div>
              <div className="bg-red-50 rounded-xl p-2 text-center border border-red-100">
                <span className="text-[10px] font-bold text-red-500 uppercase block">Urgent</span>
                <span className="text-base font-black text-[#FF3B30]">
                  {jobs.filter((j) => j.isUrgent).length}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Workers</span>
                <span className="text-base font-black text-[#1A1A1A]">{workers.length}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Apps</span>
                <span className="text-base font-black text-[#1A1A1A]">{apps.length}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-4 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'jobs' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Jobs ({jobs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('apps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'apps' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Applications ({apps.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('workers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'workers' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Workers ({workers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('companies')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'companies' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Companies ({companies.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'settings' ? 'bg-[#00A651] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Site Settings</span>
              </button>
            </div>

            {/* TAB CONTENT: JOBS */}
            {activeTab === 'jobs' && (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {jobs.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No jobs found.</p>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.jobId}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {job.isUrgent && (
                            <span className="text-[9px] font-black bg-[#FF3B30] text-white px-1.5 py-0.2 rounded-full uppercase">
                              Urgent
                            </span>
                          )}
                          <span className="font-bold text-gray-900 truncate">{job.title}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                          <span>{job.companyName}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#00A651]">₹{job.totalWage}/day</span>
                          <span>•</span>
                          <span>{job.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleUrgent(job)}
                          title="Toggle Urgent Status"
                          className={`p-1.5 rounded-lg border text-[11px] font-bold transition ${
                            job.isUrgent
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.jobId)}
                          title="Delete Job"
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: APPLICATIONS */}
            {activeTab === 'apps' && (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {apps.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No applications found.</p>
                ) : (
                  apps.map((app) => (
                    <div
                      key={app.applicationId}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-gray-900">{app.workerName}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
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
                        <div className="text-[11px] text-gray-500">
                          Job: <span className="font-mono text-gray-700">{app.jobId}</span> | Phone:{' '}
                          {app.workerPhone || 'N/A'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteApplication(app.applicationId)}
                        title="Delete Record"
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: WORKERS */}
            {activeTab === 'workers' && (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {workers.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No workers registered.</p>
                ) : (
                  workers.map((w) => (
                    <div
                      key={w.uid}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900">
                          {w.name} ({w.age} yrs) - ₹{w.expectedWage}/day
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {w.location} | Phone: {w.phone} | Exp: {w.experience}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteWorker(w.uid)}
                        title="Delete Worker"
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: COMPANIES */}
            {activeTab === 'companies' && (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {companies.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No companies registered.</p>
                ) : (
                  companies.map((c) => (
                    <div
                      key={c.uid}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{c.companyName}</div>
                        <div className="text-[11px] text-gray-500">
                          Contact: {c.contactPerson} ({c.phone}) | {c.location}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCompany(c.uid)}
                        title="Delete Company"
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: WEBSITE SETTINGS */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                  <div>
                    <strong>Header Branding Customization</strong>: Change website top-left logo and typography in real time.
                  </div>
                </div>

                {settingsSuccess && (
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle className="w-4 h-4" />
                    <span>Branding settings updated successfully and saved to Firestore!</span>
                  </div>
                )}

                {/* Live Preview of Header Top-Left Branding */}
                <div className="p-3 bg-gray-100/80 rounded-2xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Live Top-Left Corner Preview
                  </span>
                  <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="w-8 h-8 rounded-xl object-contain border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-[#00A651] text-white flex items-center justify-center shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div
                          className="text-base font-black tracking-tight"
                          style={{ fontFamily: fontFamily || 'sans-serif' }}
                        >
                          {logoText || 'CaterCREW'}
                        </div>
                        <span className="text-[9px] font-bold tracking-wider uppercase text-gray-400 block -mt-1">
                          from PARTIME
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Font: {fontFamily}
                    </span>
                  </div>
                </div>

                {/* Font Selector */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Website Top-Left Brand Font
                  </label>
                  <select
                    id="settings-font-family"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] font-semibold outline-none"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Clean App - Default)</option>
                    <option value="Playfair Display">Playfair Display (Luxury & High-End Banquet Serif)</option>
                    <option value="Poppins">Poppins (Friendly & Rounded Geometric)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech & Contemporary)</option>
                    <option value="Montserrat">Montserrat (Bold Architectural)</option>
                    <option value="Syne">Syne (Creative Avant-Garde)</option>
                    <option value="Cinzel">Cinzel (Royal Classical Catering)</option>
                    <option value="Oswald">Oswald (Bold Impact Condensed)</option>
                  </select>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Instantly changes the typography of CaterCrew in the top navigation bar.
                  </span>
                </div>

                {/* Logo Text Customization */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Brand Name / Logo Text
                  </label>
                  <input
                    id="settings-logo-text"
                    type="text"
                    placeholder="e.g. CaterCREW or CaterCrew Pro"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none"
                  />
                </div>

                {/* Logo URL Customization */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Dynamic Logo Icon / Image URL
                  </label>
                  <input
                    id="settings-logo-url"
                    type="url"
                    placeholder="https://example.com/catercrew-logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-gray-400">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                    >
                      Default Chef Hat
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoUrl('https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&h=120&q=80')}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                    >
                      Chef Cloche Photo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Favicon URL
                  </label>
                  <input
                    id="settings-favicon-url"
                    type="url"
                    placeholder="https://example.com/favicon.ico"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Top Announcement Banner Text (Optional)
                  </label>
                  <input
                    id="settings-announcement"
                    type="text"
                    placeholder="e.g. Welcome to CaterCrew - The Fast Job Marketplace for Catering Staff"
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#00A651] hover:bg-[#008f45] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving...' : 'Save Settings to Firestore'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
