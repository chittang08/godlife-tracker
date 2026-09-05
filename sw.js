// 갓생 루틴 트래커 서비스워커 - cache first
// 캐시 갱신이 필요하면 아래 버전 문자열만 올리면 됨 (예: godlife-v2)
var CACHE_NAME = 'godlife-v1';

var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // 개별 실패가 설치 전체를 막지 않도록 하나씩 처리
      return Promise.all(CORE_ASSETS.map(function(url){
        return cache.add(new Request(url, {cache:'reload'})).catch(function(){});
      }));
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(res){
        if(res && (res.status === 200 || res.type === 'opaque')){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(c){
            c.put(e.request, copy);
          }).catch(function(){});
        }
        return res;
      }).catch(function(){
        // 오프라인이고 캐시에도 없을 때: 화면 이동 요청은 앱 화면으로 폴백
        if(e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
