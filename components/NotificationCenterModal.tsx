'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Flame,
  Briefcase,
  Star,
  CheckCircle2,
  CheckCheck,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppNotification } from '../lib/types';
import { requestNotificationPermission } from '../lib/fcm';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  role: 'worker' | 'company';
  onNavigateJob?: (jobId: string) => void;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  userId,
  role,
  onNavigateJob,
}: NotificationCenterModalProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'applications'>('all');
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [requestingPush, setRequestingPush] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Listen to notifications matching user's role or user ID
    const q = query(
      collection(db, 'notifications'),
      where('targetRole', 'in', [role, 'all'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as AppNotification;
          // Filter if specific target user
          if (!item.targetUserId || item.targetUserId === userId || !userId) {
            list.push(item);
          }
        });

        // Also fetch user specific notifications
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setNotifications(list);
      },
      (err) => console.warn('Notifications listener error:', err)
    );

    return () => unsubscribe();
  }, [isOpen, role, userId]);

  const handleEnablePush = async () => {
    setRequestingPush(true);
    try {
      const token = await requestNotificationPermission(userId, role);
      if (token || (typeof window !== 'undefined' && Notification.permission === 'granted')) {
        setPushEnabled(true);
      }
    } catch (err) {
      console.warn('Push request error:', err);
    } finally {
      setRequestingPush(false);
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
    } catch (e) {
      console.warn('Error marking notification as read:', e);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'urgent') return n.type === 'urgent_job';
    if (filter === 'applications') return n.type === 'job_application';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00A651] text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">CaterCrew Alerts</h3>
              <p className="text-[11px] text-gray-300">
                Live urgent vacancies, candidate applications & reviews
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Web Push Banner */}
        {!pushEnabled && (
          <div className="p-3 bg-emerald-50/90 border-b border-emerald-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00A651] shrink-0" />
              <span className="text-[11px] text-emerald-950 font-medium">
                Enable Instant Push Alerts for urgent event hiring
              </span>
            </div>
            <button
              type="button"
              disabled={requestingPush}
              onClick={handleEnablePush}
              className="px-2.5 py-1 bg-[#00A651] hover:bg-[#008f45] text-white text-[11px] font-bold rounded-lg shrink-0 transition"
            >
              {requestingPush ? 'Enabling...' : 'Enable FCM'}
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="p-3 border-b border-gray-100 flex items-center gap-1.5 bg-gray-50/50">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-[#1A1A1A] text-white shadow-2xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              filter === 'urgent'
                ? 'bg-[#FF3B30] text-white shadow-2xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Urgent Shifts
          </button>
          <button
            type="button"
            onClick={() => setFilter('applications')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              filter === 'applications'
                ? 'bg-[#00A651] text-white shadow-2xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Applications
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <Bell className="w-10 h-10 text-gray-300" />
              <p className="text-xs font-semibold text-gray-600">No notifications yet</p>
              <p className="text-[11px] text-gray-400 max-w-xs">
                When new urgent jobs are posted or workers apply, you will receive instant push notifications right here.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isUrgent = item.type === 'urgent_job';
              const isApp = item.type === 'job_application';
              const isReview = item.type === 'review_received';

              return (
                <div
                  key={item.notificationId}
                  onClick={() => {
                    handleMarkAsRead(item.notificationId);
                    if (item.jobId && onNavigateJob) {
                      onNavigateJob(item.jobId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    !item.isRead
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isUrgent
                          ? 'bg-red-100 text-[#FF3B30]'
                          : isApp
                          ? 'bg-emerald-100 text-[#00A651]'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {isUrgent ? (
                        <Flame className="w-4 h-4" />
                      ) : isApp ? (
                        <Briefcase className="w-4 h-4" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-gray-400">
            FCM Web Push Configured
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
