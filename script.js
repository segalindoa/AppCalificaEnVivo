var map; // Variable global para almacenar la referencia al mapa
var selectedPlaceGraphic; // Variable glolbal para almacenar el gráfico del lugar seleccionado
var categorySelectedPlace;
var latitudeSelectedPlace;
var longitudeSelectedPlace;

// Espera a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    // Obtener la ubicación actual del dispositivo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    }
  
    // Éxito al obtener la ubicación
    function successCallback(position) {
      var latitudeDevice = position.coords.latitude;
      var longitudeDevice = position.coords.longitude;
  
      // Rellenar el control de texto con las coordenadas
      //document.getElementById('locationInput').value = 'Estás aquí: [Lon: ' + redondear(longitudeDevice, 6) + ', Lat: ' + redondear(latitudeDevice, 6) + ']';
      document.getElementById('locationInput').value = 'Estás aquí: [' + convertToDms(longitudeDevice, true) + ', ' + convertToDms(latitudeDevice, false) + ']';
  
      // Configurar el encabezado de autorización
      var authorizationHeader = 'fsq3ptbOnWLpFI+MY9AZsRi23Pii8GW7tA4ht/1Y8zd01E4='; // Reemplaza con tu token de acceso de Foursquare
  
      // Invocar API de Foursquare para obtener lugares cercanos
      var apiUrl = 'https://api.foursquare.com/v3/places/nearby?ll=' + latitudeDevice + ',' + longitudeDevice + '&limit=50';
  
      // Realizar la solicitud AJAX
      var places;
      var xhr = new XMLHttpRequest();
      
      xhr.open('GET', apiUrl, true);
      xhr.setRequestHeader('Authorization', authorizationHeader); // Agregar el encabezado de autorización
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var response = JSON.parse(xhr.responseText);
          places = desordenar(response.results);
  
          // Poblar la lista desplegable con los lugares cercanos
          var selectElement = document.getElementById('placesSelect');
          places.forEach(function(place) {
            var option = document.createElement('option');
            option.value = place.name;
            option.innerHTML = place.name;
            selectElement.appendChild(option);
          });
  
        require([
            'esri/Map',
            'esri/views/MapView',
            'esri/geometry/Point',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/symbols/PictureMarkerSymbol',
            'esri/Graphic'
          ], function(Map, MapView, Point, SimpleMarkerSymbol, PictureMarkerSymbol, Graphic) {
            // Crear el mapa
            map = new Map({
              //basemap: 'streets-night-vector'
              basemap: 'gray-vector'
            });
            var view = new MapView({
              container: 'mapContainer',
              map: map,
              center: [longitudeDevice, latitudeDevice],
              zoom: 15
            });

            // Crear el punto con la ubicación del dispositivo
            var pointDeviceLocation = new Point({
                longitude: longitudeDevice,
                latitude: latitudeDevice
            });

            // Crear el símbolo para la ubicación del dispositivo
            let pictureSymbolDeviceLocation = {
                type: 'picture-marker',
                url: '/imagenes/deviceLocation3.gif',
                width: '32px',
                height: '32px'
            };

            // Crear el gráfico de la ubicación del dispositivo y agregarlo al mapa
            deviceLocationGraphic = new Graphic({
                geometry: pointDeviceLocation,
                symbol: pictureSymbolDeviceLocation
            });
            view.graphics.add(deviceLocationGraphic);
              
            // Agregar la etiqueta "Estás aquí" en la ubicación actual del dospositivo
            const textEstasAqui = {
                type: "text",
                haloColor: "#D0CCD0",
                haloSize: "1px",
                //text: "Estás aquí:\n[" + redondear(longitudeDevice,3) + ", " + redondear(latitudeDevice,3) + "]",
                text: "Estás aquí:\n[" + convertToDms(longitudeDevice,true) + ", " + convertToDms(latitudeDevice,false) + "]",
                xoffset: 0,
                yoffset: -30,
                font: {
                  size: 12
                }
              };

              const pointEstasAqui = {
                type: "point",
                longitude: pointDeviceLocation.longitude,
                latitude: pointDeviceLocation.latitude
              };

              const graphicEstasAqui = new Graphic({
                geometry: pointEstasAqui,
                symbol: textEstasAqui
              });

              view.graphics.add(graphicEstasAqui);

            // Manejar el evento de cambio en la selección de lugares
            document.getElementById('placesSelect').addEventListener('change', function() {
              var selectedPlace = document.getElementById('placesSelect').value;
              var selectedPlaceObj = places.find(o => o.name === selectedPlace)
              latitudeSelectedPlace = selectedPlaceObj['geocodes']['main']['latitude'];
              longitudeSelectedPlace = selectedPlaceObj['geocodes']['main']['longitude']
          
              // Eliminar el gráfico del lugar seleccionado anteriormente, si existe
              if (selectedPlaceGraphic) {
                view.graphics.remove(selectedPlaceGraphic);
              }
          
              // Crear el punto de ubicación del lugar seleccionado
              var pointSelectedPlace = new Point({
                longitude: longitudeSelectedPlace,
                latitude: latitudeSelectedPlace
              });
          
              // Crear el símbolo del marcador para la ubicación del lugar seleccionado
              let pictureSymbolSelectedPlace = {
                type: 'picture-marker',
                url: '/imagenes/placeLocation3.png',
                width: '40px',
                height: '40px'
            };
          
              // Crear el gráfico del marcador y agregarlo al mapa
              selectedPlaceGraphic = new Graphic({
                geometry: pointSelectedPlace,
                symbol: pictureSymbolSelectedPlace
              });
              view.graphics.add(selectedPlaceGraphic);
          
              // Centrar el mapa en la ubicación del lugar seleccionado
              view.goTo(pointSelectedPlace);
              view.zoom = 15;
          
              // Crear la ventana emergente con la información del lugar
              categorySelectedPlace = "No definida";
              if (selectedPlaceObj['categories'][0]['name']){
                categorySelectedPlace = selectedPlaceObj['categories'][0]['name'];
              }

              var distanceSelectedPlace = selectedPlaceObj['distance'];
              var popupTemplate = {
                title: selectedPlace,
                content: '<p style="font-size: 14px">❔ Categoría del lugar: ' + categorySelectedPlace + '<br>' +
                  '🚶‍♂ Distancia desde tu ubicación: ' + distanceSelectedPlace + 'm.</p>'
              };
          
              // Configurar la ventana emergente para el gráfico del marcador
              selectedPlaceGraphic.popupTemplate = popupTemplate;
          
              // Mostrar la ventana emergente al hacer clic en el marcador
              view.popup.popupEnabled = true;
              
              view.openPopup({
                features: [selectedPlaceGraphic],
                location: pointSelectedPlace,
              });
            });
          });
        }
      };
      xhr.send();
    }
  
    // Error al obtener la ubicación
    function errorCallback(error) {
      console.log(error);
    }
    
    // Manejar el evento de cambio en el nombre de usuario
    document.getElementById('nameInput').addEventListener('change', function(){
      updateSubmitButtonState();
    });

    // Manejar el evento de cambio en la selección de lugares
    document.getElementById('placesSelect').addEventListener('change', function() {
      updateSubmitButtonState();
    });
  
    // Manejar el evento de clic en una estrella de calificación
    var ratingStars = document.getElementById('ratingStars').querySelectorAll('span');
    ratingStars.forEach(function(star, index) {
      star.addEventListener('click', function() {
        clearRating();
        fillRating(index + 1);
        updateSubmitButtonState();
      });
    });
  
// Función para vaciar todas las estrellas de calificación
function clearRating() {
    ratingStars.forEach(function(star) {
      star.classList.remove('selected');
    });
  }
  
// Función para rellenar las primeras 'count' estrellas de calificación
function fillRating(count) {
    for (var i = 0; i < count; i++) {
      ratingStars[i].classList.add('selected');
    }
  }
  
// Función para actualizar el estado del botón de comando
function updateSubmitButtonState() {
    var nameInput = document.getElementById('nameInput').value;
    var placeSelect = document.getElementById('placesSelect').value;
    var rating = getSelectedRating();
    var submitButton = document.getElementById('submitButton');
  
    if (nameInput !== '' && placeSelect !== '' && rating > 0) {
      submitButton.disabled = false;
    } else {
      submitButton.disabled = true;
    }
  }
  
  
  // Función para obtener la calificación seleccionada
  function getSelectedRating() {
    var selectedRating = 0;
    ratingStars.forEach(function(star, index) {
      if (star.classList.contains('selected')) {
        selectedRating = index + 1;
      }
    });
    return selectedRating;
  }

  // Función para redondear un número a n decimales
  function redondear(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
  }

  // Función para ordenar aleatoriamente un arreglo
  function desordenar(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }

  /**
   * Converts decimal degrees to degrees minutes seconds.
   * 
   * @param dd the decimal degrees value.
   * @param isLng specifies whether the decimal degrees value is a longitude.
   * @return degrees minutes seconds string in the format 49°15'51.35"N
   */
  function convertToDms(dd, isLng) {
    var dir = dd < 0
      ? isLng ? 'W' : 'S'
      : isLng ? 'E' : 'N';

    var absDd = Math.abs(dd);
    var deg = absDd | 0;
    var frac = absDd - deg;
    var min = (frac * 60) | 0;
    var sec = frac * 3600 - min * 60;
    // Round it to 2 decimal points.
    sec = Math.round(sec * 100) / 100;
    return deg + "°" + min + "'" + sec + '"' + dir;
  }

  // Manejar el evento del botón de comando
  document.getElementById('submitButton').addEventListener('click', function() {
    var userName = document.getElementById('nameInput').value;
    var nameSelectedPlace = document.getElementById('placesSelect').value;
    var ratingSelectedPlace = getSelectedRating();
    
    let eventoCalificacion = [
      {
        "usuarioReporta": userName, 
        "lugarCalificado": nameSelectedPlace, 
        "lon": longitudeSelectedPlace, 
        "lat": latitudeSelectedPlace, 
        "categoriaLugarCalificado": categorySelectedPlace, 
        "calificacionLugar": ratingSelectedPlace,
        "timestampReporte": Date.now()
      }
    ];

    // Url feed http receiver ArcGIS Velocity:
    // https://us-iot.arcgis.com/usadvanced00/idz676tz2hybp5tg/receiver/5ee4de90a29a462a862bba2e26e85f5b

    console.log(JSON.stringify(eventoCalificacion, null, 2));
    
    // Mostrar ventana de texto con la información
    alert(JSON.stringify(eventoCalificacion, null, 2));
  });
});
  