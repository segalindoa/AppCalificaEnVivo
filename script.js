var map; // Variable global para almacenar la referencia al mapa
var graphicLugarSeleccionado; // Variable glolbal para almacenar el gráfico del lugar seleccionado
var graphicTextoLugarSeleccionado;
var categoriaLugarSeleccionado;
var latitudLugarSeleccionado;
var longitudLugarSeleccionado;
var lugaresCercanos;

// Espera a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
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
    document.getElementById("locationInput").value =
      "Estás aquí: [" +
      convertToDms(longitudeDevice, true) +
      ", " +
      convertToDms(latitudeDevice, false) +
      "]";

    // Configurar el encabezado de autorización
    var token4square =
      "fsq3ptbOnWLpFI+MY9AZsRi23Pii8GW7tA4ht/1Y8zd01E4="; // Token de acceso a Foursquare
      //"XNSF0T40YW41D2TDHVU5ABCHEEUP2AII4OTBJHOMNYKMGZLU";

    var apiUrl =
      "https://places-api.foursquare.com/places/search?ll=" +
      latitudeDevice +
      "," +
      longitudeDevice +
      "&radius=1500&limit=50";      

    // Realizar la solicitud AJAX
    //var lugares;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", apiUrl, true);

    xhr.setRequestHeader("Authorization", "Bearer " + token4square);
    xhr.setRequestHeader("X-Places-Api-Version", "2025-06-17");
    xhr.setRequestHeader("Accept", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 ) {
        if (xhr.status === 200) {
          var response = JSON.parse(xhr.responseText);
          //places = desordenar(response.results);
          lugaresCercanos = ordenarAbc(response.results);

          // Poblar la lista desplegable con los lugares cercanos
          var selectElement = document.getElementById("placesSelect");
          lugaresCercanos.forEach(function (place) {
            var option = document.createElement("option");
            option.value = place.fsq_place_id;

            // Construir dirección si existe
            var direccion = place.formatted_address || "";
            option.innerHTML = place.name + (direccion ? " [" + direccion + "]" : "");

            selectElement.appendChild(option);
          });

          require([
            "esri/Map",
            "esri/views/MapView",
            "esri/geometry/Point",
            "esri/symbols/SimpleMarkerSymbol",
            "esri/symbols/PictureMarkerSymbol",
            "esri/Graphic",
          ], function (
            Map,
            MapView,
            Point,
            SimpleMarkerSymbol,
            PictureMarkerSymbol,
            Graphic
          ) {
            // Crear el mapa
            map = new Map({
              //basemap: 'streets-night-vector'
              basemap: "gray-vector",
            });
            var view = new MapView({
              container: "mapContainer",
              map: map,
              center: [longitudeDevice, latitudeDevice],
              zoom: 13,
            });

            // Crear el punto con la ubicación del dispositivo
            var pointUbicacionDispositivo = new Point({
              longitude: longitudeDevice,
              latitude: latitudeDevice,
            });

            // Crear el símbolo para la ubicación del dispositivo
            let pictureSymbolDeviceLocation = {
              type: "picture-marker",
              url: "/imagenes/deviceLocation4.png",
              width: "24px",
              height: "42px",
            };

            // Crear el gráfico de la ubicación del dispositivo y agregarlo al mapa
            deviceLocationGraphic = new Graphic({
              geometry: pointUbicacionDispositivo,
              symbol: pictureSymbolDeviceLocation,
            });
            view.graphics.add(deviceLocationGraphic);

            // Agregar la etiqueta "Estás aquí" en la ubicación actual del dispositivo
            const textEstasAqui = {
              type: "text",
              haloColor: "#D0CCD0",
              haloSize: "1px",
              text:
                "Estás aquí:\n[" +
                convertToDms(longitudeDevice, true) +
                ", " +
                convertToDms(latitudeDevice, false) +
                "]",
              xoffset: 0,
              yoffset: -30,
              font: {
                size: 11,
              },
            };

            const pointEstasAqui = {
              type: "point",
              longitude: pointUbicacionDispositivo.longitude,
              latitude: pointUbicacionDispositivo.latitude,
            };

            const graphicTextoEstasAqui = new Graphic({
              geometry: pointEstasAqui,
              symbol: textEstasAqui,
            });

            view.graphics.add(graphicTextoEstasAqui);

            graphicTextoLugarSeleccionado = null
            // Manejar el evento de cambio en la selección de lugares
            document
              .getElementById("placesSelect")
              .addEventListener("change", function () {
                var fsqIdLugarSeleccionado = document.getElementById("placesSelect").value;
                var lugarSeleccionadoObj = lugaresCercanos.find(
                  (o) => o.fsq_id === fsqIdLugarSeleccionado
                );
                latitudLugarSeleccionado =
                  lugarSeleccionadoObj["geocodes"]["main"]["latitude"];
                longitudLugarSeleccionado =
                  lugarSeleccionadoObj["geocodes"]["main"]["longitude"];

                // Eliminar el gráfico del lugar seleccionado anteriormente, si existe
                if (graphicLugarSeleccionado) {
                  view.graphics.remove(graphicLugarSeleccionado);
                }
                
                // Eliminar el gráfico del texto del lugar seleccionado anteriormente, si existe
                if (graphicTextoLugarSeleccionado) {
                  view.graphics.remove(graphicTextoLugarSeleccionado);
                }

                // Crear el punto de ubicación del lugar seleccionado
                var pointLugarSeleccionado = new Point({
                  longitude: longitudLugarSeleccionado,
                  latitude: latitudLugarSeleccionado,
                });

                // Crear el símbolo del marcador para la ubicación del lugar seleccionado
                let pictureSymbolLugarSeleccionado = {
                  type: "picture-marker",
                  url: "/imagenes/placeLocation3.png",
                  width: "40px",
                  height: "40px",
                };

                // Crear el gráfico del marcador y agregarlo al mapa
                graphicLugarSeleccionado = new Graphic({
                  geometry: pointLugarSeleccionado,
                  symbol: pictureSymbolLugarSeleccionado,
                });
                view.graphics.add(graphicLugarSeleccionado);

                // Centrar el mapa en la ubicación del lugar seleccionado
                view.goTo(pointLugarSeleccionado);
                view.zoom = 13;

                // Crear la ventana emergente con la información del lugar
                categoriaLugarSeleccionado = "No definida";
                if (lugarSeleccionadoObj["categories"].length > 0) {
                  categoriaLugarSeleccionado = lugarSeleccionadoObj["categories"][0]["name"];
                }

                var distanciaLugarSeleccionado = lugarSeleccionadoObj["distance"];
                // var popupTemplate = {
                //   title: lugarSeleccionadoObj.name,
                //   content:
                //     '<p style="font-size: 14px">❔ Categoría del lugar: ' +
                //     categoriaLugarSeleccionado +
                //     "<br>" +
                //     "🚶‍♂ Distancia desde tu ubicación: " +
                //     distanciaLugarSeleccionado +
                //     "m.</p>",
                // };

                // Agregar la etiqueta del lugar seleccionado
                const textoLugarSeleccionado = {
                  type: "text",
                  haloColor: "#D0CCD0",
                  haloSize: "1px",
                  text:
                    lugarSeleccionadoObj.name + " [Distancia: " + distanciaLugarSeleccionado + "m.]",
                  xoffset: 0,
                  yoffset: -30,
                  font: {
                    size: 10,
                  },
                };

                graphicTextoLugarSeleccionado = new Graphic({
                  geometry: pointLugarSeleccionado,
                  symbol: textoLugarSeleccionado,
                });
      
                view.graphics.add(graphicTextoLugarSeleccionado);

                // Configurar la ventana emergente para el gráfico del marcador
                //selectedPlaceGraphic.popupTemplate = popupTemplate;

                // Mostrar la ventana emergente al hacer clic en el marcador
                //view.popup.popupEnabled = true;

                //view.openPopup({
                //  features: [selectedPlaceGraphic],
                //  location: pointSelectedPlace,
                //});
              });
          });
        } else {
        console.error("Error:", xhr.status, xhr.responseText);
        }
      }
    };
    xhr.send();
  }

  // Error al obtener la ubicación
  function errorCallback(error) {
    console.log(error);
  }

  // Manejar el evento de cambio en el nombre de usuario
  document.getElementById("nameInput").addEventListener("change", function () {
    updateSubmitButtonState();
  });

  // Manejar el evento de cambio en la selección de lugares
  document
    .getElementById("placesSelect")
    .addEventListener("change", function () {
      updateSubmitButtonState();
    });

  // Manejar el evento de clic en una estrella de calificación
  var ratingStars = document
    .getElementById("ratingStars")
    .querySelectorAll("span");
  ratingStars.forEach(function (star, index) {
    star.addEventListener("click", function () {
      clearRating();
      fillRating(index + 1);
      updateSubmitButtonState();
    });
  });

  // Función para vaciar todas las estrellas de calificación
  function clearRating() {
    ratingStars.forEach(function (star) {
      star.classList.remove("selected");
    });
  }

  // Función para rellenar las primeras 'count' estrellas de calificación
  function fillRating(count) {
    for (var i = 0; i < count; i++) {
      ratingStars[i].classList.add("selected");
    }
  }

  // Función para actualizar el estado del botón de comando
  function updateSubmitButtonState() {
    var emailUsuario = document.getElementById("nameInput").value;
    var fsqIdLugarSeleccionado = document.getElementById("placesSelect").value;
    
    //var lugarSeleccionado = document.getElementById("placesSelect").value;
    var lugarSeleccionado = lugaresCercanos.find(
      (o) => o.fsq_id === fsqIdLugarSeleccionado
    );

    var calificacion = getSelectedRating();
    var submitButton = document.getElementById("submitButton");

    if (emailUsuario !== "" && lugarSeleccionado !== "" && calificacion > 0) {
      submitButton.disabled = false;
    } else {
      submitButton.disabled = true;
    }
  }

  // Función para obtener la calificación seleccionada
  function getSelectedRating() {
    var selectedRating = 0;
    ratingStars.forEach(function (star, index) {
      if (star.classList.contains("selected")) {
        selectedRating = index + 1;
      }
    });
    return selectedRating;
  }

  // Función para redondear un número a n decimales
  function redondear(value, decimals) {
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
  }

  // Ordenar aleatoriamente un arreglo
  function desordenar(array) {
    let currentIndex = array.length,
      randomIndex;

    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }


  // Ordenar un arreglo alfabéticamente
  function ordenarAbc(array){
    return array.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Eliminar elementos repetidos de un arreglo
  function eliminarRepetidos(array){
    return array.filter((item,
      index) => array.indexOf(item) === index);
  }

  /**
   * Converts decimal degrees to degrees minutes seconds.
   *
   * @param dd the decimal degrees value.
   * @param isLng specifies whether the decimal degrees value is a longitude.
   * @return degrees minutes seconds string in the format 49°15'51.35"N
   */
  function convertToDms(dd, isLng) {
    var dir = dd < 0 ? (isLng ? "W" : "S") : isLng ? "E" : "N";

    var absDd = Math.abs(dd);
    var deg = absDd | 0;
    var frac = absDd - deg;
    var min = (frac * 60) | 0;
    var sec = frac * 3600 - min * 60;
    // Round it to 2 decimal points.
    sec = Math.round(sec * 100) / 100;
    return deg + "°" + min + "'" + sec + '"' + dir;
  }

  // Manejar el evento del botón de enviar datos a ArcGIS
  document
    .getElementById("submitButton")
    .addEventListener("click", function () {
      var usuario = document.getElementById("nameInput").value;
      var fsqIdLugarSeleccionado = document.getElementById("placesSelect").value;
      var lugarSeleccionadoObj = lugaresCercanos.find(
        (o) => o.fsq_id === fsqIdLugarSeleccionado
      );
      var calificacionLugarSeleccionado = getSelectedRating();

      let eventoCalificacion = [
        {
          usuarioReporta: usuario,
          lugarCalificado: lugarSeleccionadoObj.name,
          lon: longitudLugarSeleccionado,
          lat: latitudLugarSeleccionado,
          categoriaLugarCalificado: categoriaLugarSeleccionado,
          calificacionLugar: calificacionLugarSeleccionado,
          timestampReporte: Date.now(),
        },
      ];

      // Url feed http receiver ArcGIS Velocity:
      var urlFeedVelocity = "https://us-iot.arcgis.com/usadvanced00/idz676tz2hybp5tg/receiver/5ee4de90a29a462a862bba2e26e85f5b"
      var urlInputGeoEvent = "https://ge.esri.co:6143/geoevent/rest/receiver/rest-json-in-calificaciones-en-vivo"

      const datosEventoCalificacion = JSON.stringify(eventoCalificacion, null, 2);
      console.log(datosEventoCalificacion);

      // Enviar datos al feed HTTP receiver de ArcGIS Velocity
      var requestArcGISVelocity = new XMLHttpRequest();
      requestArcGISVelocity.open('POST', urlFeedVelocity, true);
      requestArcGISVelocity.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
      requestArcGISVelocity.setRequestHeader("Accept", "*/*");
      //requestArcGISVelocity.setRequestHeader("Host", "us-iot.arcgis.com");
      //requestArcGISVelocity.setRequestHeader("Connection", "keep-alive");

      // Enviar los datos al input de GeoEvent
      var requestGeoEvent = new XMLHttpRequest();
      requestGeoEvent.open('POST', urlInputGeoEvent, true)
      requestGeoEvent.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
      requestGeoEvent.setRequestHeader("Accept", "*/*");
      //requestGeoEvent.setRequestHeader("Connection", "keep-alive");

      const textoEnviadoToVelocity = document.getElementById('textoEnviadoVelocity');
      const textoEnviadoGeoEvent = document.getElementById('textoEnviadoGeoEvent')

      // callback ArcGIS Velocity
      requestArcGISVelocity.onreadystatechange = function() {
        if (requestArcGISVelocity.readyState == 4 && 
          (requestArcGISVelocity.status != 404 && 
            requestArcGISVelocity.status != 403 && 
            requestArcGISVelocity.status != 500)) {
              console.log("Evento de calificación enviado exitosamente a ArcGIS Velocity | Estado de la petición: " + requestArcGISVelocity.status + " | Respuesta: " + requestArcGISVelocity.responseText)
              textoEnviadoToVelocity.style.visibility = "visible"
              textoEnviadoToVelocity.innerHTML = "Calificación enviada exitosamente a ArcGIS Velocity ✅"
              setTimeout(() => {
                textoEnviadoToVelocity.style.visibility = 'hidden';
              }, 3000);
        } else {

          console.log("El evento no de calificación no pudo ser enviado a ArcGIS Velocity.\nEstado de respuesta a la petición: " + requestArcGISVelocity.status + 
          " | readyState: " + requestArcGISVelocity.readyState + 
          "| responseText: " + requestArcGISVelocity.responseText)

          textoEnviadoToVelocity.style.visibility = "visible"
          textoEnviadoToVelocity.innerHTML = "Error al enviar la calificación a ArcGIS Velocity. Inténtelo nuevamente ⚠️"
          setTimeout(() => {
            textoEnviadoToVelocity.style.visibility = 'hidden';
          }, 4500);
        }
      };
      
      // callback GeoEvent
      requestGeoEvent.onreadystatechange = function() {
        if (requestGeoEvent.readyState == 4 && 
          (requestGeoEvent.status != 404 && 
            requestGeoEvent.status != 403 && 
            requestGeoEvent.status != 500)) {
              console.log("Evento de calificación enviado exitosamente a GeoEvent | Estado de la petición: " + requestGeoEvent.status + " | Respuesta: " + requestGeoEvent.responseText)
              textoEnviadoGeoEvent.style.visibility = "visible"
              textoEnviadoGeoEvent.innerHTML = "Calificación enviada exitosamente a GeoEvent✅"
              setTimeout(() => {
                textoEnviadoGeoEvent.style.visibility = 'hidden';
              }, 3000);
        } else {

          console.log("El evento no de calificación no pudo ser enviado a GeoEvent.\nEstado de respuesta a la petición: " + requestGeoEvent.status + 
          " | readyState: " + requestGeoEvent.readyState + 
          "| responseText: " + requestGeoEvent.responseText)

          textoEnviadoGeoEvent.style.visibility = "visible"
          textoEnviadoGeoEvent.innerHTML = "Error al enviar la calificación a GeoEvent. Inténtelo nuevamente ⚠️"
          setTimeout(() => {
            textoEnviadoGeoEvent.style.visibility = 'hidden';
          }, 4500);
        }
      };

      requestArcGISVelocity.send(datosEventoCalificacion);
      requestGeoEvent.send(datosEventoCalificacion);
  });
});
