'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { seedInitialDataIfNeeded } from '../lib/seedData';
import {
  UserRole,
  CateringJob,
  JobApplication,
  WorkerProfile,
  CompanyProfile,
  WebsiteSettings,
  AppNotification
} from '../lib/types';
import { dispatchApplicationNotification, requestNotificationPermission } from '../lib/fcm';
import { Header } from '../components/Header';
import { OnboardingModal } from '../components/OnboardingModal';
import { AuthModal } from '../components/AuthModal';
import { JobFeed } from '../components/JobFeed';
import { PostJobModal } from '../components/PostJobModal';
import { CompanyJobsView } from '../components/CompanyJobsView';
import { WorkersDirectory } from '../components/WorkersDirectory';
import { WorkerApplicationsView } from '../components/WorkerApplicationsView';
import { WorkerProfileModal } from '../components/WorkerProfileModal';
import { CompanyProfileModal } from '../components/CompanyProfileModal';
import { AdminModal } from '../components/AdminModal';
import { MapsAgentModal } from '../components/MapsAgentModal';
import { RatingReviewModal } from '../components/RatingReviewModal';
import { NotificationCenterModal } from '../components/NotificationCenterModal';
import confetti from 'canvas-confetti';
import {
  Search,
  Briefcase,
  Users,
  PlusCircle,
  User,
  Building2,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  // Core State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('catercrew_role') as UserRole;
      if (saved) return saved;
    }
    return 'worker';
  });
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [siteSettings, setSiteSettings] = useState<WebsiteSettings | null>(null);

  // Realtime Jobs & Applications
  const [jobs, setJobs] = useState<CateringJob[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // Realtime Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Maps Route Agent Modal
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [mapsVenue, setMapsVenue] = useState('');
  const [mapsLocation, setMapsLocation] = useState('');

  // Rating & Review Modal
  const [ratingModalData, setRatingModalData] = useState<{
    isOpen: boolean;
    jobId: string;
    jobTitle: string;
    targetUserId: string;
    targetUserName: string;
    targetUserRole: 'worker' | 'company';
  } | null>(null);

  // Active View Tabs
  // Worker: 'feed' | 'applications'
  // Company: 'feed' | 'my_postings' | 'find_workers'
  const [activeTab, setActiveTab] = useState<string>('feed');

  // Modals
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('catercrew_role');
    }
    return false;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showWorkerProfileModal, setShowWorkerProfileModal] = useState(false);
  const [showCompanyProfileModal, setShowCompanyProfileModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Setup: Seed default data if needed
  useEffect(() => {
    seedInitialDataIfNeeded();
  }, []);

  // 2. Realtime listener for Settings
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          setSiteSettings(snap.data() as WebsiteSettings);
        }
      },
      (err) => console.warn('Settings listener error:', err)
    );
    return () => unsubSettings();
  }, []);

  // 3. Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user account info to sync role
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role as UserRole;
            if (role) {
              setCurrentRole(role);
              localStorage.setItem('catercrew_role', role);
            }
          }

          // Fetch profiles
          const [wSnap, cSnap] = await Promise.all([
            getDoc(doc(db, 'workers', user.uid)),
            getDoc(doc(db, 'companies', user.uid)),
          ]);
          if (wSnap.exists()) setWorkerProfile(wSnap.data() as WorkerProfile);
          if (cSnap.exists()) setCompanyProfile(cSnap.data() as CompanyProfile);

          // Request FCM push notification permission
          requestNotificationPermission(user.uid, currentRole).catch(() => {});
        } catch (e) {
          console.error('Error loading user profile:', e);
        }
      } else {
        setWorkerProfile(null);
        setCompanyProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, [currentRole]);

  // 4. Realtime listener for Jobs
  useEffect(() => {
    const unsubJobs = onSnapshot(
      collection(db, 'jobs'),
      (snapshot) => {
        const list: CateringJob[] = [];
        snapshot.forEach((d) => list.push(d.data() as CateringJob));
        setJobs(list);
        setLoadingJobs(false);
      },
      (err) => {
        console.warn('Jobs snapshot error:', err);
        setLoadingJobs(false);
      }
    );
    return () => unsubJobs();
  }, []);

  // 5. Realtime listener for user's applications (if worker)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'applications'), where('workerId', '==', currentUser.uid));
    const unsubApps = onSnapshot(q, (snapshot) => {
      const ids = new Set<string>();
      snapshot.forEach((d) => {
        const app = d.data() as JobApplication;
        if (app.jobId) ids.add(app.jobId);
      });
      setAppliedJobIds(ids);
    });

    return () => {
      unsubApps();
      setAppliedJobIds(new Set());
    };
  }, [currentUser]);

  // 6. Realtime listener for Notifications
  useEffect(() => {
    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((d) => {
          const n = d.data() as AppNotification;
          // Filter to notifications relevant to current user / role
          const isForMe =
            (currentUser && n.targetUserId === currentUser.uid) ||
            n.targetRole === currentRole ||
            n.targetRole === 'all' ||
            !n.targetRole;

          if (isForMe) {
            list.push(n);
          }
        });
        setNotifications(
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        );
      },
      (err) => {
        console.warn('Notifications listener warning:', err);
      }
    );

    return () => unsubNotifs();
  }, [currentUser, currentRole]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Handle Role Change
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('catercrew_role', newRole);
    setActiveTab('feed');
    showToast(`Switched to ${newRole === 'worker' ? 'Worker' : 'Company'} Mode`);
    if (currentUser) {
      requestNotificationPermission(currentUser.uid, newRole).catch(() => {});
    }
  };

  // Handle 1-Tap Job Application
  const handleApplyToJob = async (job: CateringJob) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setApplyingJobId(job.jobId);
    try {
      const applicationId = 'app_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const application: JobApplication = {
        applicationId,
        jobId: job.jobId,
        workerId: currentUser.uid,
        workerName: workerProfile?.name || currentUser.displayName || 'Catering Steward',
        workerPhone: workerProfile?.phone || '9876543210',
        workerExperience: workerProfile?.experience || '2 Years',
        workerWage: workerProfile?.expectedWage || job.totalWage,
        companyId: job.companyId,
        jobTitle: job.title,
        jobDate: job.date,
        totalWage: job.totalWage,
        status: 'pending',
        appliedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'applications', applicationId), application);

      // Trigger push notification to the company!
      dispatchApplicationNotification(application, job).catch((e) =>
        console.warn('Application notification warning:', e)
      );

      // Trigger Confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}

      showToast(`Applied to ${job.title}!`);
    } catch (err) {
      console.error('Apply error:', err);
      showToast('Could not submit application. Please check your connection.');
    } finally {
      setApplyingJobId(null);
    }
  };

  // Open Maps Agent helper
  const handleOpenMapsAgent = (venue?: string, location?: string) => {
    setMapsVenue(venue || '');
    setMapsLocation(location || '');
    setShowMapsModal(true);
  };

  // Open Rating Review modal handlers
  const handleRateWorker = (job: CateringJob, app: JobApplication) => {
    setRatingModalData({
      isOpen: true,
      jobId: job.jobId,
      jobTitle: job.title,
      targetUserId: app.workerId,
      targetUserName: app.workerName,
      targetUserRole: 'worker',
    });
  };

  const handleRateCompany = (job: CateringJob, app: JobApplication) => {
    setRatingModalData({
      isOpen: true,
      jobId: job.jobId,
      jobTitle: job.title,
      targetUserId: job.companyId,
      targetUserName: job.companyName,
      targetUserRole: 'company',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eafaf1] via-white to-[#f5fbf7] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#00A651] selection:text-white pb-20 sm:pb-10">
      {/* Dynamic Announcement Banner if configured */}
      {siteSettings?.announcement && (
        <div className="bg-[#1A1A1A] text-white text-[11px] font-bold py-1.5 px-4 text-center">
          <span>{siteSettings.announcement}</span>
        </div>
      )}

      {/* Main App Header with Dynamic Logo, Font, Role & Notifications */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenProfile={() => {
          if (!currentUser) {
            setShowAuthModal(true);
          } else if (currentRole === 'worker') {
            setShowWorkerProfileModal(true);
          } else {
            setShowCompanyProfileModal(true);
          }
        }}
        onOpenAdmin={() => setShowAdminModal(true)}
        siteSettings={siteSettings}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenMapsAgent={() => handleOpenMapsAgent()}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl border border-gray-700 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-[#00A651]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6">
        {/* Mobile View Switcher Tabs (Top Bar) */}
        <div className="flex items-center justify-between gap-2 mb-4 bg-white/80 backdrop-blur-xs p-1.5 rounded-2xl border border-gray-200/80 shadow-2xs">
          {currentRole === 'worker' ? (
            <>
              <button
                id="worker-tab-feed"
                type="button"
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'feed'
                    ? 'bg-[#00A651] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find a Job</span>
              </button>

              <button
                id="worker-tab-applications"
                type="button"
                onClick={() => {
                  if (!currentUser) setShowAuthModal(true);
                  else setActiveTab('applications');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'applications'
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>My Shifts</span>
                {appliedJobIds.size > 0 && (
                  <span className="bg-[#00A651] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {appliedJobIds.size}
                  </span>
                )}
              </button>

              <button
                id="worker-tab-profile"
                type="button"
                onClick={() => {
                  if (!currentUser) setShowAuthModal(true);
                  else setShowWorkerProfileModal(true);
                }}
                className="py-2 px-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Profile</span>
              </button>
            </>
          ) : (
            /* Company Tabs */
            <>
              <button
                id="company-tab-feed"
                type="button"
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'feed'
                    ? 'bg-[#00A651] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Live Feed</span>
              </button>

              <button
                id="company-tab-postings"
                type="button"
                onClick={() => {
                  if (!currentUser) setShowAuthModal(true);
                  else setActiveTab('my_postings');
                }}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'my_postings'
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>My Jobs</span>
              </button>

              <button
                id="company-tab-workers"
                type="button"
                onClick={() => setActiveTab('find_workers')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'find_workers'
                    ? 'bg-[#00A651] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Find Workers</span>
              </button>

              <button
                id="company-tab-post-action"
                type="button"
                onClick={() => {
                  if (!currentUser) setShowAuthModal(true);
                  else setShowPostJobModal(true);
                }}
                className="py-2 px-3 rounded-xl text-xs font-black bg-[#00A651] text-white hover:bg-[#008f45] transition flex items-center justify-center gap-1 shadow-xs shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Post Job</span>
              </button>
            </>
          )}
        </div>

        {/* Tab View Container */}
        {activeTab === 'feed' && (
          <JobFeed
            jobs={jobs}
            appliedJobIds={appliedJobIds}
            onApply={handleApplyToJob}
            isWorker={currentRole === 'worker'}
            onRequireAuth={() => setShowAuthModal(true)}
            applyingJobId={applyingJobId}
            loading={loadingJobs}
            onOpenMapsAgent={handleOpenMapsAgent}
          />
        )}

        {activeTab === 'applications' && (
          <WorkerApplicationsView
            workerId={currentUser?.uid || ''}
            onBrowseJobs={() => setActiveTab('feed')}
            onRateCompany={handleRateCompany}
          />
        )}

        {activeTab === 'my_postings' && (
          <CompanyJobsView
            companyId={currentUser?.uid || ''}
            onOpenPostJob={() => setShowPostJobModal(true)}
            onRateWorker={handleRateWorker}
          />
        )}

        {activeTab === 'find_workers' && <WorkersDirectory />}
      </main>

      {/* Floating Bottom Quick Bar for Mobile */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 py-2 px-4 flex items-center justify-around sm:hidden z-30 shadow-lg">
        {currentRole === 'worker' ? (
          <>
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                activeTab === 'feed' ? 'text-[#00A651]' : 'text-gray-500'
              }`}
            >
              <Search className="w-5 h-5" />
              <span>Find a Job</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) setShowAuthModal(true);
                else setActiveTab('applications');
              }}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold relative ${
                activeTab === 'applications' ? 'text-[#00A651]' : 'text-gray-500'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>My Shifts</span>
              {appliedJobIds.size > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#FF3B30] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {appliedJobIds.size}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                if (!currentUser) setShowAuthModal(true);
                else setShowWorkerProfileModal(true);
              }}
              className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-gray-500"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                activeTab === 'feed' ? 'text-[#00A651]' : 'text-gray-500'
              }`}
            >
              <Search className="w-5 h-5" />
              <span>Job Feed</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) setShowAuthModal(true);
                else setShowPostJobModal(true);
              }}
              className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-[#00A651]"
            >
              <div className="w-8 h-8 rounded-full bg-[#00A651] text-white flex items-center justify-center -mt-3 shadow-md">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span>Post Job</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) setShowAuthModal(true);
                else setActiveTab('my_postings');
              }}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                activeTab === 'my_postings' ? 'text-[#00A651]' : 'text-gray-500'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>My Jobs</span>
            </button>
            <button
              onClick={() => setActiveTab('find_workers')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                activeTab === 'find_workers' ? 'text-[#00A651]' : 'text-gray-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Workers</span>
            </button>
          </>
        )}
      </div>

      {/* Footer / Branding */}
      <footer className="mt-auto py-6 border-t border-gray-200/80 bg-white/50 text-center text-xs text-gray-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1A1A1A]">
              {siteSettings?.logoText || 'CaterCREW'}
            </span>
            <span>•</span>
            <span className="font-semibold tracking-wider uppercase text-[11px]">
              from PARTIME
            </span>
          </div>
          <p className="text-[11px] text-gray-400 max-w-sm">
            Simple catering job marketplace connecting event companies with verified catering stewards, servers & bartenders.
          </p>
          <div className="text-[10px] text-gray-400 mt-1">
            Tip: Tap the {siteSettings?.logoText || 'CaterCREW'} logo 7 times consecutively for the Secret Admin portal.
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Onboarding Screen */}
      <OnboardingModal
        isOpen={showOnboarding}
        onSelectRole={handleRoleChange}
        onClose={() => setShowOnboarding(false)}
      />

      {/* 2. Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        preferredRole={currentRole}
        onAuthSuccess={(role) => {
          handleRoleChange(role);
          showToast('Signed in successfully!');
        }}
      />

      {/* 3. Post a Job Modal */}
      <PostJobModal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
        companyProfile={companyProfile}
        companyId={currentUser?.uid || 'comp_guest'}
        onSuccess={() => {
          showToast('Catering job posted live to workers!');
          setActiveTab('my_postings');
        }}
      />

      {/* 4. Worker Profile Modal */}
      <WorkerProfileModal
        isOpen={showWorkerProfileModal}
        onClose={() => setShowWorkerProfileModal(false)}
        uid={currentUser?.uid || ''}
        onSaved={() => showToast('Worker profile updated!')}
      />

      {/* 5. Company Profile Modal */}
      <CompanyProfileModal
        isOpen={showCompanyProfileModal}
        onClose={() => setShowCompanyProfileModal(false)}
        uid={currentUser?.uid || ''}
        onSaved={() => showToast('Company profile updated!')}
      />

      {/* 6. Secret Admin Portal (7 Clicks Trigger) */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        siteSettings={siteSettings}
        onSettingsUpdated={(settings) => {
          setSiteSettings(settings);
          showToast('Website settings saved to Firestore!');
        }}
      />

      {/* 7. Real-Time Google Maps Transit & Venue Agent */}
      <MapsAgentModal
        isOpen={showMapsModal}
        onClose={() => setShowMapsModal(false)}
        initialVenue={mapsVenue}
        initialLocation={mapsLocation}
      />

      {/* 8. Star Rating & Verified Review Modal */}
      {ratingModalData && (
        <RatingReviewModal
          isOpen={ratingModalData.isOpen}
          onClose={() => setRatingModalData(null)}
          jobId={ratingModalData.jobId}
          jobTitle={ratingModalData.jobTitle}
          targetUserId={ratingModalData.targetUserId}
          targetUserName={ratingModalData.targetUserName}
          targetUserRole={ratingModalData.targetUserRole}
          fromUserId={currentUser?.uid || 'guest'}
          fromUserName={
            currentUser?.displayName ||
            (currentRole === 'worker'
              ? workerProfile?.name || 'Catering Worker'
              : companyProfile?.companyName || 'Catering Company')
          }
          fromUserRole={currentRole === 'company' ? 'company' : 'worker'}
          onSuccess={() => {
            showToast('Rating and review published successfully!');
            setRatingModalData(null);
          }}
        />
      )}

      {/* 9. Push Notifications Center Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        userId={currentUser?.uid}
        role={currentRole === 'company' ? 'company' : 'worker'}
        onNavigateJob={(jobId) => {
          setActiveTab('feed');
          setShowNotificationsModal(false);
        }}
      />
    </div>
  );
}
