// আমার খাতা — Service Worker
const CACHE_NAME = 'khata-v2';
const URLS_TO_CACHE = ['./', './index.html'];

// ইনস্টল — নতুন ফাইল cache করো
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE).catch(()=>{}))
  );
});

// অ্যাক্টিভেট — পুরনো cache মুছে ফেলো
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

// Fetch — Network first, fallback to cache
// এতে সবসময় নতুন কোড আসবে, offline হলে cache থেকে
self.addEventListener('fetch', event => {
  const req = event.request;
  // শুধু GET request handle করি
  if (req.method !== 'GET') return;
  // Firebase request cache করব না
  if (req.url.includes('firestore') || req.url.includes('googleapis') || req.url.includes('gstatic')) return;

  event.respondWith(
    fetch(req).then(res => {
      // সফল হলে cache-এ কপি রাখি (নতুন version)
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone)).catch(()=>{});
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
