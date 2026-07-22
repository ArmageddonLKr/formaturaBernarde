const CACHE_NAME = 'painel-bernard-v2';
const APP_SHELL = ['./', './index.html', './manifest.json', '../assets/icons/icon-192.png', '../assets/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// App shell em cache para abrir instantaneamente; dados do Supabase sempre vêm da rede.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !APP_SHELL.some((p) => req.url.endsWith(p.replace('./', '')))) {
    event.respondWith(fetch(req));
    return;
  }
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});

self.addEventListener('push', (event) => {
  let data = { title: 'Nova confirmação', body: 'Alguém confirmou presença na formatura.' };
  try{ if(event.data) data = event.data.json(); }catch(e){}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '../assets/icons/icon-192.png',
      badge: '../assets/icons/icon-192.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for(const client of clientList){
        if(client.url.includes('painel-x7k2p9') && 'focus' in client) return client.focus();
      }
      if(clients.openWindow) return clients.openWindow('./');
    })
  );
});
