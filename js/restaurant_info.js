let restaurant;
var newMap;
let reviewList = undefined;
/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = "Restaurant Name : " + restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const ul = document.getElementById('reviews-list');
  reviewList = ul;
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);


  DBHelper.fetchRestaurantReviewsById(self.restaurant.id)
  .then((reviews)=>{
    console.log(reviews);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }else{
      reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
      });
      container.appendChild(ul);
    }
  });
}

let submitReviewForm = document.getElementsByClassName("submitReviewForm")[0];
let reviewerName = document.getElementById("reviewerName");
let reviewerRating = document.getElementById("reviewerRating");
let reviewerReview = document.getElementById("reviewerReview");

reviewerRating.addEventListener("input", (event)=>{
  let intValue = parseInt(reviewerRating.value);
  if(intValue > 5){
    reviewerRating.value = 5;
  }else if(intValue < 0){
    reviewerRating.value = 0;
  }
});

submitReviewForm.addEventListener("submit", (event)=>{
  event.preventDefault();
  if(reviewerName.value != "" && reviewerReview.value != "" && reviewerRating.value != ""){
    let rating = reviewerRating.value;
    let name = reviewerName.value;
    let comments = reviewerReview.value;

    let params = (new URL(document.location)).searchParams;
    let currentId = params.get("id");
    let restaurantId = parseInt(currentId);
    let date = new Date();
    let finalObj = {"restaurant_id" : restaurantId, name, rating, comments, createdAt : date.getTime()};
    saveAllData(finalObj);
    console.log(finalObj);
    reviewerRating.value = "";
    reviewerName.value = "";
    reviewerReview.value = "";
  }else{
    alert("Please fill the complete form with current name and review.");
  }
  
});

function saveAllData(finalObj){
  let url = `http://localhost:1337/reviews/`;
  if(navigator.onLine){
    console.log("We are online.");
    fetch(url, {
      method : "POST",
      body : JSON.stringify(finalObj)
    })
    .then((response)=>{
      if(response.ok){
        console.log("Review saved to the server.");
        console.log(response);
      }else{
        syncRestaurantReview.push({
          url : url,
          method : "POST",
          body : JSON.stringify(finalObj)
        });
      }
    })
    .catch((erro)=>{
      console.log("[ERROR] Error in fetch request.");
      syncRestaurantReview.push({
        url : url,
        method : "POST",
        body : JSON.stringify(finalObj)
      });
    });
  }else{

    console.log("We are offline.");
    syncRestaurantReview.push({
      url : url,
      method : "POST",
      body : JSON.stringify(finalObj)
    });

    alert("You are currently offline, the review is synced as soon as you are online.");
  }

  // update current database
  DBHelper.postReviewToDB(finalObj);
  // append to list
  reviewList.appendChild(createReviewHTML(finalObj));

}
console.log(submitReviewForm);

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.createdAt;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  // [ADDED] 
  const fontAwesomeElement = document.createElement("i");
  fontAwesomeElement.className = "fas fa-check";
  name.appendChild(fontAwesomeElement);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
