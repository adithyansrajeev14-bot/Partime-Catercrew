'use client';

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../firebase-applet-config.json';
import { AppNotification, CateringJob, JobApplication, UserRole } from './types';

let messagingInstance: Messaging | null = null;

export function getFCMClient(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  try {
    if (!messagingInstance) {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (err) {
    console.warn('Firebase Messaging not supported or blocked in this environment:', err);
    return null;
  }
}

/**
 * Requests Notification permission and registers FCM token in Firestore.
 */
export async function requestNotificationPermission(userId?: string, role?: UserRole): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swErr) {
        console.warn('Service Worker registration warning:', swErr);
      }
    }

    const messaging = getFCMClient();
    if (!messaging) return null;

    // Use default VAPID key or project messaging sender ID
    const token = await getToken(messaging, {
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    }).catch((e) => {
      console.warn('Could not retrieve FCM registration token directly:', e);
      return null;
    });

    if (token) {
      // Save token to Firestore
      try {
        await setDoc(doc(db, 'fcm_tokens', token.substring(0, 32)), {
          token,
          userId: userId || 'anonymous',
          role: role || 'worker',
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (userId) {
          await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
        }
      } catch (saveErr) {
        console.warn('Error saving FCM token to Firestore:', saveErr);
      }
    }

    return token;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return null;
  }
}

/**
 * Dispatch notification for Urgent Job Posting (to all available workers)
 */
export async function dispatchUrgentJobNotification(job: CateringJob) {
  try {
    const notifId = 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const notification: AppNotification = {
      notificationId: notifId,
      type: 'urgent_job',
      title: `🔥 URGENT SHIFT: ${job.title} (+₹${job.bonusWage} Bonus)`,
      body: `${job.companyName} needs ${job.workersNeeded} staff on ${job.date} at ${job.location}. Pay: ₹${job.totalWage}/day!`,
      jobId: job.jobId,
      targetRole: 'worker',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: `/?jobId=${job.jobId}`
    };

    // Store in Firestore notifications collection
    await setDoc(doc(db, 'notifications', notifId), notification);

    // Call server route to trigger push notification
    fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'urgent_job',
        title: notification.title,
        body: notification.body,
        jobId: job.jobId,
        targetRole: 'worker'
      })
    }).catch((e) => console.warn('Push API call error:', e));

    // Show native notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/chef-hat.png'
        });
      } catch {}
    }
  } catch (err) {
    console.error('Error dispatching urgent job notification:', err);
  }
}

/**
 * Dispatch notification for Job Application (to the Company)
 */
export async function dispatchApplicationNotification(application: JobApplication, job: CateringJob) {
  try {
    const notifId = 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const notification: AppNotification = {
      notificationId: notifId,
      type: 'job_application',
      title: `📩 New Worker Applied: ${application.workerName}`,
      body: `${application.workerName} applied for "${job.title}" (${job.date}). Tap to review candidate profile.`,
      jobId: job.jobId,
      targetUserId: job.companyId,
      targetRole: 'company',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/?tab=my_postings'
    };

    // Store in Firestore
    await setDoc(doc(db, 'notifications', notifId), notification);

    // Call server route to trigger push notification
    fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'job_application',
        title: notification.title,
        body: notification.body,
        jobId: job.jobId,
        targetUserId: job.companyId,
        targetRole: 'company'
      })
    }).catch((e) => console.warn('Push API call error:', e));

    // Show native notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/chef-hat.png'
        });
      } catch {}
    }
  } catch (err) {
    console.error('Error dispatching application notification:', err);
  }
}
