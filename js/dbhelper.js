/**
 * Common database helper functions.
 */

let syncRestaurantReview = [];
let syncRestaurantRating = [];

window.addEventListener("online", ()=>{
  if(syncRestaurantRating.length > 0){
    syncRatings();
  }

  if(syncRestaurantReview.length > 0){
    syncReviews();
  }
});

function syncReviews(){
  console.log("We are again online.");
  console.log("Length of array is = " + syncRestaurantReview.length);
  let promiseArr = [];
  syncRestaurantReview.forEach((eachReq)=>{
    fetch(eachReq.url, {
      method : eachReq.method,
      body : eachReq.body
    })
  });
  Promise.all(promiseArr)
  .then((values)=>{
    syncRestaurantRating = [];
    alert("All the Reviews are synced with the data base.");
  });
}

function syncRatings(){
  console.log("We are again online.");
  console.log("Length of array is = " + syncRestaurantRating.length);
  let promiseArr = [];
  syncRestaurantRating.forEach((eachReq)=>{
    promiseArr.push(fetch(eachReq.url, {
      method : eachReq.method
    }));
  });
  Promise.all(promiseArr)
  .then((values)=>{
    syncRestaurantRating = [];
    alert("All the favourites are synced with the data base.");
  });
}


class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static getIDB(){
    // returns a promise
    return idb.open("restaurant-app", 1, (upgradeDB)=>{
      switch (upgradeDB.oldVersion) {
        case 0:
          upgradeDB.createObjectStore('allRestaurants');
        case 1:
          upgradeDB.createObjectStore('reviews');
      }
    });
  }

  /**
  * Fetch reviews by restaurant ID using cache first or network first strategies with fallback.
  */
  static getReviewsByRestaurantFromDb(dbPromise, restaurantId) {
    console.log("getReviewsByRestaurantFromDb called with restaurantId " + restaurantId);
    return dbPromise.then((db) => {
      if (!db) return;
      let tx = db.transaction('reviews');
      let reviewsStore = tx.objectStore('reviews');
      return reviewsStore.get((restaurantId));
    });
  }

  /**
  * Update reviews to reviews db.
  */
  static updateReviewsByRestaurantInDb(dbPromise, restaurantId, reviews) {
    return dbPromise.then((db) => {
      if (!db) return;
      let tx = db.transaction('reviews', 'readwrite');
      let reviewsStore = tx.objectStore('reviews');
      reviewsStore.put(reviews, restaurantId);
      tx.complete;
    });
  }

  /**
  * Update IndexedDB with latest review before going online.
  */
  static postReviewToDB(review) {
    console.log("postReviewToDB called");
    const dbPromise = DBHelper.getIDB();

    DBHelper.getReviewsByRestaurantFromDb(dbPromise, review.restaurant_id)
      .then(reviews => {
        console.log("The reviews are ...");
        console.log(reviews);
        if (!reviews){
          return;
        };
        reviews.push(review);
        DBHelper.updateReviewsByRestaurantInDb(dbPromise, (review.restaurant_id), reviews);
      });
  }

  /**
  * Fetch all reviews of a particular restaurant.
  */
  static fetchRestaurantReviewsById(restaurantId) {
    const reviewsUrl = `http://localhost:1337/reviews/?restaurant_id=${restaurantId}`;
    const dbPromise = DBHelper.getIDB();

    // Network then cache strategy - reviews.
    return DBHelper.getReviewsByRestaurantFromDb(dbPromise, restaurantId)
      .then(reviews => {
        if (reviews && reviews.length > 0) {
          
          // Reviews present in the index db
          return reviews;

        } else {

          // Fetch reviews from network.
          return fetch(reviewsUrl)
            .then(response => response.json())
            .then(reviews => {
              if (!reviews || (reviews && reviews.length === 0)) return;
              DBHelper.updateReviewsByRestaurantInDb(dbPromise, restaurantId, reviews);
              return reviews;
            });

        }
      }).catch((error) => {
        // Oops!. Got an error from server or some error while operations!
        console.log(`Request failed with error: ${error}`);
      });

  }

  /**
   * Fetch all restaurants.
   */

  static restaurantFromIDB(dbPromise){
    return dbPromise.then((db)=>{
      let tx = db.transaction("allRestaurants");
      var keyValStore = tx.objectStore("allRestaurants");
      return keyValStore.get("restaurantArray");
    });
  }

  static updateIDB(restaurantArray, dbPromise) {
    return dbPromise.then(function (db) {
      let tx = db.transaction('allRestaurants', 'readwrite');
      let restaurantsStore = tx.objectStore('allRestaurants');
      restaurantsStore.put(restaurantArray, 'restaurantArray');
      tx.complete;
    });
  }


  static fetchRestaurants(callback) {
    let IDBPromise = DBHelper.getIDB();
    DBHelper.restaurantFromIDB(IDBPromise)
    .then((restaurantArr)=>{
      console.log("[IDB] THE VALUE OF 'restaurantArr' : ");
      console.log(restaurantArr);


      if(!restaurantArr){
        
        console.log("[FETCH] RESPONSE MADE FROM SERVER");
        return fetch(DBHelper.DATABASE_URL);

      }else if(restaurantArr && restaurantArr.length > 0){

        console.log("[IDB] RESPONSE MADE FROM INDEXDB");
        callback(null, restaurantArr);
        return;

      }

    })
    .then((response)=>{
      console.log(response);

      if(typeof response == "undefined"){
        return;
      }else if(response.status != 200){
        return;
      }else{
        return response.json();
      }

    })
    .then((restaurantArr)=>{

      if(typeof restaurantArr == "undefined"){
        return;
      }else{
        console.log("[IDB] UPDATING RESPONSE IN THE DATABASE");
        let lastObj = restaurantArr[restaurantArr.length - 1];
        lastObj.photograph = "" + lastObj.id; 


        DBHelper.updateIDB(restaurantArr, IDBPromise);
        callback(null, restaurantArr);
        return;
      }

    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

