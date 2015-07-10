/*jslint browser: true, node: true */
/*global google, calcRoute, GetLatLong, GetVille, place, delMarker, poseMarker, handleNoGeolocation, toggleBounce, createMarkers */

var afficheDirections = new google.maps.DirectionsRenderer(),
    directionsService = new google.maps.DirectionsService();
var map;
var allMarker = [];
var ville;
var mapapi = document.getElementById("map-canvas");
var pos;
var geocoder;
var marker;
var waypts = [];

//ITINERAIRE AVEC VILLE
document.getElementById("iti").addEventListener("click", calcRoute, false);
document.getElementById("iti").addEventListener("click", GetLatLong, false);

//document.getElementById("lat_iti").addEventListener("click", calcRoute, false);
document.getElementById("lat_iti").addEventListener("click", GetVille, false);
document.getElementById("lat_iti").addEventListener("click", calcRoute, false);

//Place un marker dans lendroit recherche
document.getElementById("btn_place_lat").addEventListener("click", GetVille, false);
document.getElementById("btn_place").addEventListener("click", GetLatLong, false);

//Supprimer les markeurs
document.getElementById("delMarker").addEventListener("click", delMarker, false);

function initialize() {
    "use strict";
    var paris = new google.maps.LatLng(48.856614, 2.3522219000000177), //Affichage de la carte a paris par defaut
    //Option de la map par defaut
        mapOptions = {
            zoom : 7,
            center : paris
        };
    map = new google.maps.Map(mapapi, mapOptions);  //charge la map avec les options par defaut
    afficheDirections.setMap(map);
    if (navigator.geolocation) { //Si le navigateur permet la geolocalisation
      //recupere la position en lat et long 
        navigator.geolocation.getCurrentPosition(function (position) {
            pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);//recup la position en lat long
            geocoder = new google.maps.Geocoder(); //Nouvelle instance de geocoder
            geocoder.geocode({'latLng': pos}, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) { // si tout est ok
                    if (results[0]) { //si result existe
                        ville = results[0].formatted_address; //Nom de la ville
                        poseMarker(); // créer un nouveau marker
                        //Assigne les valeurs dans les input
                        document.getElementById('start').value = ville;
                        document.getElementById('place').value = ville;
                        document.getElementById('lat').value = position.coords.latitude;
                        document.getElementById('long').value = position.coords.longitude;
                        document.getElementById('lat_place').value = position.coords.latitude;
                        document.getElementById('long_place').value = position.coords.longitude;
                    }
                }
            });
        }, function () {
            handleNoGeolocation(true); //Si ça a pas marché
        });
    } else {
        handleNoGeolocation(false);
    }
    google.maps.event.addListener(map, 'click', function (event) { //Lors d'un click sur la map
        geocoder = new google.maps.Geocoder();
        pos = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng());
        marker = new google.maps.Marker({ // creation d'un nouveau marker
            map : map,
            draggable : true,
            animation : google.maps.Animation.DROP,
            position : pos
        });
        allMarker.push(marker);
        google.maps.event.addListener(marker, 'click', toggleBounce);
        geocoder.geocode({'latLng': pos}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    ville = results[0].formatted_address;
                }
            }
        });
    });
}

function callback(results, status) {
    'use strict';
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        return true;
    } else {
        createMarkers(results);
    }
}

function createMarkers(places) {
    'use strict';
    var bounds = new google.maps.LatLngBounds(),
        i = 0,
        image,
        marker;

    for (i = 0, place; place = places[i]; i++) {
        image = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
        };

        marker = new google.maps.Marker({
            map: map,
            icon: image,
            title: place.name,
            position: place.geometry.location
        });
        bounds.extend(place.geometry.location);
    }
}

function poseMarker() {
    'use strict';
    map.setCenter(pos); //centre la map
    marker = new google.maps.Marker({ // creation d'un nouveau marker
      map:map,
      draggable:true,
      animation: google.maps.Animation.DROP,
      position: pos
    });
    google.maps.event.addListener(marker, 'click', toggleBounce);
}
function calcRoute() {
    'use strict';
  if(this.id == 'lat_iti' || this.id == 'iti') {
    var start = document.getElementById('start').value;
    var end = document.getElementById('end').value;  
      if(allMarker.length == 0){
        var request = {
            origin:start,
            destination:end,
            travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, function(response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            afficheDirections.setDirections(response);
          } else {
            alert("La requête a échouée.");
          }
          afficheDirections.setPanel(document.getElementById("map-panel")); //Affiche les etapes      
        });
      } else {
        for(var a = 0; a < allMarker.length; a++){
          waypts.push({
            location: allMarker[a]['position']['k']+' '+allMarker[a]['position']['D'],
            stopover:true
            });
          }
          var request = {
              origin:start,
              destination:end,
              waypoints: waypts,
              optimizeWaypoints: true,            
              travelMode: google.maps.TravelMode.DRIVING
          };
        directionsService.route(request, function(response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            afficheDirections.setDirections(response);
          } else {
            alert("La requête a échouée.");
          }   
          for(var l= 0; l < allMarker.length; l++){
            request ={
                  location: new google.maps.LatLng(allMarker[l]['position']['k'], allMarker[l]['position']['D']),
                  radius: 5000,
                  types: ['cafe', 'art_gallery', 'museum']
            }
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, callback);
          }
          afficheDirections.setPanel(document.getElementById("map-panel"));
        });
      }
    }
}
function handleNoGeolocation(errorFlag) {
  'use strict';
  if (errorFlag) {
    alert("La geolocalisation n'a pas été pris en charge par le navigateur");
    var content = 'Paris, France';
    document.getElementById('start').value = content;
  } else {
    alert("Votre navigateur ne supporte pas la geolocalisation");
    var content = 'Paris, France';
    document.getElementById('start').value = content;
  }

  var options = {
    map: map,
    position: new google.maps.LatLng(48.856614, 2.3522219000000177), //Se retrouve donc à paris
    content: content
  };

  var infowindow = new google.maps.InfoWindow(options);
  map.setCenter(options.position);
}

function GetLatLong() {
  'use strict';
  geocoder = new google.maps.Geocoder();
  if(this.id == 'iti'){
      var address = document.getElementById("start").value;
      var address2 = document.getElementById("end").value;
      geocoder.geocode({ 'address': address }, function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
              var latitude = results[0].geometry.location.lat();
              var longitude = results[0].geometry.location.lng();
              document.getElementById('lat').value = latitude;
              document.getElementById('long').value = longitude;
          } else {
              alert("La requête a échouée.");
          }
      });
      geocoder.geocode({ 'address': address2 }, function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
              var latitude2 = results[0].geometry.location.lat();
              var longitude2 = results[0].geometry.location.lng();
              document.getElementById('lat2').value = latitude2;
              document.getElementById('long2').value = longitude2;
          } else {
              alert("La requête a échouée.");
          }
      });    
  }
  else if(this.id == 'btn_place'){
      var address = document.getElementById("place").value;
      geocoder.geocode({ 'address': address }, function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var latitude = results[0].geometry.location.lat(); //recupere la latitude
            var longitude = results[0].geometry.location.lng(); //recupere la longitude
            pos = new google.maps.LatLng(latitude, longitude); //definit une nouvelle position
            document.getElementById('lat_place').value = latitude;
            document.getElementById('long_place').value = longitude;
            document.getElementById('end').value = address;
            map.setZoom(7);
            poseMarker();
          } else {
              alert("La requête a échouée.");
          }
      });
  }
};

function GetVille() {
  'use strict';
  geocoder = new google.maps.Geocoder();
  if(this.id == 'lat_iti'){
    var lat = document.getElementById("lat").value;
    var lng = document.getElementById("long").value;
    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[0]) {
          ville  = results[0].formatted_address;
          document.getElementById('start').value = ville;
        }
      }
    });
    var lat2 = document.getElementById("lat2").value;
    var lng2 = document.getElementById("long2").value;
    var latlng2 = new google.maps.LatLng(lat2, lng2);
    geocoder.geocode({'latLng': latlng2}, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[0]) {
          ville = results[0].formatted_address;
          document.getElementById('end').value = ville;
        }
      }
    });
  }  
  else if(this.id == 'btn_place_lat'){
    var lat = document.getElementById("lat_place").value;
    var lng = document.getElementById("long_place").value;
    pos = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': pos}, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[0]) {
          poseMarker();
          ville = results[0].formatted_address;
          document.getElementById('place').value = ville;
        }
      }
    });
  }
}
function toggleBounce() {
  'use strict';
  if (marker.getAnimation() != null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

//Fonction fullscreen
//Full screen
document.getElementById("full").addEventListener("click", full, false);
function full(){
    'use strict';
    if(mapapi.requestFullscreen) {
      mapapi.requestFullscreen();
    }
    else if(mapapi.msRequestFullscreen) {
      mapapi.msRequestFullscreen();
    }
    else if(mapapi.mozRequestFullScreen) {
      mapapi.mozRequestFullScreen();
    }
    else if(mapapi.webkitRequestFullScreen) {
      mapapi.webkitRequestFullScreen();
    }
}

function delMarker(){
    'use strict';
    if(allMarker.length !== 0){    
      for(var i = 0; i < allMarker.length; i++){
        allMarker[i].setMap(null);
      }
    } else {
      alert('il n\'y a aucun markeur a supprimer');
    }
  }
google.maps.event.addDomListener(window, 'load', initialize); //appelle la fonction initialize
