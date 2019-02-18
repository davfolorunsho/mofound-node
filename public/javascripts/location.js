
// Location details.
// Library
// Long: 7.51773
// Lat: 4.52636

// Adekunle+Fajuyi+Hall+Of+Residence,7.5181652,4.5172549

// Awo Hall
// 7.5189066,4.515465

// PG Hall
// 7.51962, 4.5138624

// Mozambique Hall
// Ife
// 7.5204692,4.5138365

// Angola Hall Ife
// Ife
// 7.5233498,4.5124696

// ETF Hall
// 7.5176173,4.5126022

// Faculty of Agriculture
// 7.522068,4.5263077

locationInititiate = function() {
    var startPos;
    var nudge = document.getElementById("nudge");
  
    var showNudgeBanner = function() {
      nudge.style.display = "block";
    };
  
    var hideNudgeBanner = function() {
      nudge.style.display = "none";
    };
  
    var nudgeTimeoutId = setTimeout(showNudgeBanner, 5000);
  
    var geoSuccess = function(position) {
      hideNudgeBanner();
      // We have the location, don't display banner
      clearTimeout(nudgeTimeoutId);
  
      // Do magic with location
      startPos = position;
      document.getElementById('startLat').innerHTML = startPos.coords.latitude;
      document.getElementById('startLon').innerHTML = startPos.coords.longitude;
    };
    var geoError = function(error) {
      switch(error.code) {
        case error.TIMEOUT:
          // The user didn't accept the callout
          showNudgeBanner();
          break;
      }
    };
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  x.innerHTML = "Latitude: " + position.coords.latitude + 
  "<br>Longitude: " + position.coords.longitude;
}