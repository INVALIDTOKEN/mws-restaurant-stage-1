console.log("Service Worker File Starts Executing! [changed]");

self.addEventListener("fetch", (event)=>{
  event.respondWith(
    fetch(event.request)
    .then((response)=>{
      console.log(response.status);
      if(response.status === 404){
        return new Response("Woop not found");
      }else{
        
        return response;

      }
    })
    .catch((error)=>{return new Response("Woop error in fetching something.")})
  );
});


console.log("Service Worker File Ended Executing [changed]");


