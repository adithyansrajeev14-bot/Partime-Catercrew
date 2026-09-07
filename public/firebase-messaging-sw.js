// Firebase Cloud Messaging Service Worker for CaterCrew
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: 'gen-lang-client-0609619606',
  appId: '1:864728268765:web:8317689b2c45bbaf654034',
  apiKey: 'AIzaSyDAA2mpyw3YKJ8HRixNqmbQ-EbHHf1adSE',
  messagingSenderId: '864728268765'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'CaterCrew Alert';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'New catering shift update on CaterCrew!',
    icon: '/chef-hat.png',
    badge: '/chef-hat.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
