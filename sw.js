/* Çevrimdışı önbellek + "uygulama olarak yükle" için servis işçisi */
const CACHE = 'osd-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(a => c.add(a).catch(()=>{}))))
      .then(()=> self.skipWaiting())
  );
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;       // Google Fonts vb. doğrudan ağdan
  if(req.mode === 'navigate'){
    // Sayfa: önce ağ (güncel sürüm), ağ yoksa önbellek
    e.respondWith(
      fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put('./index.html', copy)).catch(()=>{});
        return res;
      }).catch(()=> caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // Diğer dosyalar: önce önbellek, yoksa ağ
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
      return res;
    }))
  );
});
