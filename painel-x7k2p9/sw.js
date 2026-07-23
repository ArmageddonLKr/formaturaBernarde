const CACHE_NAME = 'painel-bernard-v5';
const APP_SHELL = ['./', './index.html', './manifest.json', '../assets/icons/icon-192.png', '../assets/icons/icon-512.png'];

// Marca se já existia um service worker ativo antes deste — só nesse caso
// é uma ATUALIZAÇÃO de verdade. Numa instalação nova (primeira visita),
// self.registration.active ainda é nulo aqui.
let isUpdate = false;

self.addEventListener('install', (event) => {
  isUpdate = !!self.registration.active;
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

// Só força o recarregamento de janelas já abertas quando é uma atualização
// de verdade — numa instalação nova isso só atrapalharia (recarregaria a
// página bem no meio do primeiro carregamento, cancelando o que já estava
// em andamento, como buscar a lib do Supabase).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
      if(isUpdate){
        const openClients = await self.clients.matchAll({ type: 'window' });
        openClients.forEach((client) => client.navigate(client.url));
      }
    })()
  );
});

// App shell: busca sempre a versão mais nova na rede primeiro (e atualiza o
// cache com ela); só usa o cache se estiver offline. Assim quem já instalou
// o painel recebe as atualizações do site sozinho, sem precisar reinstalar.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !APP_SHELL.some((p) => req.url.endsWith(p.replace('./', '')))) {
    event.respondWith(fetch(req));
    return;
  }
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
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
