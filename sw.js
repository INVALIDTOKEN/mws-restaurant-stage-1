
const staticAssets = 'restaurant-cache-v1',
imagesCache = 'restaurant-images-v1',
htmlCache = 'restaurant-html-v1',
restCache = 'restaurant-maps-v1';


self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(staticAssets)
    .then((cache) => {
      cache.addAll([
        '/',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
        '/css/myStyles.min.css',
        '/js/dbhelper.min.js',
        '/js/main.min.js',
        '/js/restaurant_info.min.js',
        '/js/idb.min.js'
      ]);
    }).catch(() => {
      console.log('[SW] ERROR IN CACHING STATIC ASSETS');
    })
  );
});

self.addEventListener('activate', (event) => {

  if (self.clients && clients.claim) {
    clients.claim();
  }
  
  event.waitUntil(

    caches.keys().then((cacheNames) => {

      // returning a promise
      return Promise.all(

        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('restaurant-cache-') && cacheName !== staticAssets;
        })
        .map((cacheName) => {
          return caches.delete(cacheName);
        })

      ).catch((error) => {

        console.log('[SW] [ERROR] SOME ERROR OCCURED WHILE REMOVING CACHE.',  error);

      });

    }).catch((error) => {
      console.log('[SW] [ERROR] SOME ERROR OCCURED WHILE REMOVING CACHE.' , error);
    })

  );


});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {

      if(response){

        return response

      }else{


        return fetch(event.request)
        .then((response) => {
          if (event.request.url.endsWith('.jpg')) {

            return cacheReturnResponse(imagesCache, event.request.url, response.clone());

          } else if (event.request.url.includes('.html')) {

            return cacheReturnResponse(htmlCache, event.request.url, response.clone());

          } else {

            return cacheReturnResponse(restCache, event.request.url, response.clone());

          }
        }).catch((error) => {

          console.log('[SW] [ERROR] ERROR IN FETCHING REQUEST FROM THE SERVER.');

        });

      }
    })
  );
});


// [HELPER FUNCTIONS] ======================================================================================================================
function cacheReturnResponse(restaurantCacheName, url, response) {
  // Open cache with the given restaurantCacheName
  return caches.open(restaurantCacheName)
    .then((cache) => {
      // Put data with the corrent key
      cache.put(url, response.clone());


      // return response
      return response;
    }).catch((error) => {
      console.log(`[SW] [ERRO] ERROR OCCURED WHILE STORING RESPONSE IN THE CACHE : ${restaurantCacheName}!`);
    });
}