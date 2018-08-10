console.log("Service Worker File Starts Executing!");

let cacheName = "restaurant-cache-v1";
let cacheVersion = cacheName.substr(-2, 2);

self.addEventListener("install", (event)=>{
  let cacheUrls = [
    `/`,
    `/restaurant.html`,
    "/js/main.js",
    "/js/restaurant_info.js",
    "/css/myStyles.css",
    "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js"

    // "/js/dbhelper.js",
    // "/js/idb.min.js",
    // "https://use.fontawesome.com/releases/v5.1.0/css/all.css",
    // `https://fonts.googleapis.com/css?family=Roboto`,
    // `https://fonts.googleapis.com/css?family=Quicksand`,
    // `https://fonts.googleapis.com/css?family=Montserrat`,
  ];
  event.waitUntil(
    caches.open(cacheName)
    .then((cache)=>{
      return cache.addAll(cacheUrls);
    })
    .catch((error)=>{
      console.log(error);
      return error;
    })
  );
});

self.addEventListener("fetch", (event)=>{
  if(event.request.url.startsWith("http://localhost:8000/restaurant.html?id=")){
    console.log(" [CUSTOM RESPONSE] Caching the page skeleton of restaurant");

    return event.respondWith(
      caches.open(cacheName)
      .then((cache)=>{
        return cache.match("/restaurant.html").then((response)=>{
          return response;
        });
      })
    );
    
  }

  event.respondWith(
    caches.open(cacheName)
    .then((cache)=>{
      return cache.match(event.request).then((response)=>{
        if(response){
          console.log("Response send by cache box version :", cacheVersion);
          return response;
        }

        return fetch(event.request);
      })
    })
  );
});


// When the service worker is activated 
// Delete all the cache that the website uses except the current cache
self.addEventListener("activate", (event)=>{
  event.waitUntil(
    caches.keys()
    .then((cachesNames)=>{
      console.log("Name of all cache boxes : ",cachesNames);
      let array = [];
      cachesNames.forEach((name)=>{
        if(name.startsWith("restaurant-cache-") &&  ! name.endsWith(cacheVersion)){
          array.push(name);
        }
      });
      console.log("Name of all cache boxes that are going to be deleted : ", array);
      return Promise.all(
        array.map((name)=>{
          return caches.delete(name);
        })
      );
    })
  );
});

console.log("Service Worker File Ended Executing!");


