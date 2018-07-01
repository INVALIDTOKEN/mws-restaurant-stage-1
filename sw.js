console.log("Service Worker File Starts Executing!");

self.addEventListener("install", (event)=>{
  event.waitUntil(
    caches.open("restaurant-cache-v1")
    .then((cache)=>{
      return cache.add("/css/myStyles.css");
    })
    .catch((error)=>{
      return error;
    })
  );
});

self.addEventListener("fetch", (event)=>{
  if(event.request.url === "http://localhost:8000/css/myStyles.css"){
    event.respondWith(
      caches.open("restaurant-cache-v1")
      .then((cache)=>{
        return cache.match("/css/myStyles.css").then((response)=>{
          console.log("Giving custom response");
          return response;
        });
      })
    );  
  }
});


console.log("Service Worker File Ended Executing");


