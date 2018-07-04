console.log("main.js Started Running.");
let restaurants,
  neighborhoods,
  cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'sk.eyJ1IjoiY29kZWl0c2FoaWwiLCJhIjoiY2ppdXBva3RtMXp1ejNscGViNHA5MWNrNyJ9.-ZuC8eg9e5vvncdh9BGXZA',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = "Restaurant Name : " + restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute("role", "To see Restaurant Details"); 
  more.setAttribute("aria-label", "Read more about the " + restaurant.name);
  li.append(more);

  // [ADDED]
  const fontAwesomeIcon = document.createElement("i");
  fontAwesomeIcon.className = "fas fa-arrow-right";
  fontAwesomeIcon.style.color = "#079642";
  more.appendChild(fontAwesomeIcon);
  // Event listeners for the more anker element more
  more.addEventListener("mouseenter", (event)=>{
    fontAwesomeIcon.style.color = "white";
  });
  more.addEventListener("mouseleave", (event)=>{
    fontAwesomeIcon.style.color = "#079642";
  });

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

// Registering a service worker
if(navigator.serviceWorker){
  navigator.serviceWorker.register("/sw.js", { scope : "/"})
  .then((reg)=>{
    // The service worker is registered.
    console.log("[SW] Service worker is registered!");
  })
  .catch((error)=>{
    console.log("[SW] Error in registering the service worker : ", error);
  });
}

// Adding a UI element for notificying the user that an update is available.
// Not used for Project-1
let notifyUserHTML = function (){
  let body = document.getElementsByTagName("body")[0];

  let outerDiv = document.createElement("div");
  outerDiv.id = "notifyUser";

  let h2 = document.createElement("h2");
  h2.textContent = "Update Available";
  h2.id = "notifyMsg"

  outerDiv.appendChild(h2);

  let ignoreButton = document.createElement("button");
  ignoreButton.type = "button";
  ignoreButton.id = "ignoreUpdate";
  ignoreButton.textContent = "Ignore";

  let installButton = document.createElement("button");
  installButton.type = "button";
  installButton.id = "installUpdate";
  installButton.textContent = "Install";

  let innerDiv = document.createElement("div");
  innerDiv.id = "notifyButtons"
  innerDiv.appendChild(ignoreButton);
  innerDiv.appendChild(installButton);

  outerDiv.appendChild(innerDiv);

  body.appendChild(outerDiv);
}

let installServiceWorker = function(reg){
  document.getElementById("installUpdate").addEventListener("click", (event)=>{
    reg.installing.postMessage({install : true});
  });
}

let ignoreServieWorker = function(){
  document.getElementById("ignoreUpdate").addEventListener("click", (event)=>{
    document.getElementById("notifyUser").style.display = "none";
  });
}

let showNotification = function(){
  document.getElementById("notifyUser").style.display = "";
  installServiceWorker();
  ignoreServieWorker();
}

