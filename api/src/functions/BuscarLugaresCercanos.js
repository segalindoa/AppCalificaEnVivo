process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { app } = require('@azure/functions');

app.http('BuscarLugaresCercanos', {
    methods: ['GET'],
    authLevel: 'anonymous',

    handler: async (request, context) => {

        try {

            const lat = request.query.get('lat');
            const lon = request.query.get('lon');
            
            const url = 
                `${process.env.FOURSQUARE_URL}` +
                `?ll=${lat},${lon}` +
                `&radius=1500` +
                `&limit=50`;

            const response = await fetch(
                url,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.FOURSQUARE_TOKEN}`,
                        'X-Places-Api-Version': `${process.env.FOURSQUARE_API_VERSION}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const data = await response.json();

            return {
                status: response.status,
                jsonBody: data
            };

        } catch (error) {

            context.error(error);

            return {
                status: 500,
                body: error.message
            };
        }
    }
});

/*const { app } = require('@azure/functions');

app.http('BuscarLugaresCercanos', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const name = request.query.get('name') || await request.text() || 'world';

        return { body: `Hello, ${name}!` };
    }
});*/
