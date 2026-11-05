process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app } = require("@azure/functions");

app.http("EnviarCalificacionVelocity", {
  methods: ["POST"],
  authLevel: "anonymous",

  handler: async (request, context) => {
    try {
      const evento = await request.json();

      const camposRequeridos = [
        "usuarioReporta",
        "lugarCalificado",
        "lon",
        "lat",
        "categoriaLugarCalificado",
        "calificacionLugar",
        "timestampReporte"
      ];

      const camposFaltantes = camposRequeridos.filter(
        (campo) =>
          evento[campo] === undefined ||
          evento[campo] === null ||
          evento[campo] === ""
      );

      if (camposFaltantes.length > 0) {
        return {
          status: 400,
          jsonBody: {
            ok: false,
            mensaje: "El evento no contiene todos los campos requeridos.",
            camposFaltantes
          }
        };
      }

      const velocityUrl = process.env.VELOCITY_RECEIVER_URL;

      if (!velocityUrl) {
        context.error(
          "No está configurada la variable VELOCITY_RECEIVER_URL."
        );

        return {
          status: 500,
          jsonBody: {
            ok: false,
            mensaje: "El endpoint de ArcGIS Velocity no está configurado."
          }
        };
      }

      const responseVelocity = await fetch(velocityUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        },
        body: JSON.stringify(evento)
      });

      const respuestaVelocity = await responseVelocity.text();

      context.log(
        `ArcGIS Velocity respondió ${responseVelocity.status}: ` +
        respuestaVelocity
      );

      if (!responseVelocity.ok) {
        return {
          status: 502,
          jsonBody: {
            ok: false,
            mensaje: "ArcGIS Velocity rechazó el evento.",
            statusVelocity: responseVelocity.status,
            respuestaVelocity
          }
        };
      }

      return {
        status: 200,
        jsonBody: {
          ok: true,
          mensaje: "Evento aceptado por ArcGIS Velocity.",
          statusVelocity: responseVelocity.status,
          respuestaVelocity
        }
      };
    } catch (error) {
      context.error("Error enviando el evento a ArcGIS Velocity:", error);

      return {
        status: 500,
        jsonBody: {
          ok: false,
          mensaje: "No fue posible enviar el evento a ArcGIS Velocity.",
          detalle: error.message
        }
      };
    }
  }
});