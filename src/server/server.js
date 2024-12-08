require('dotenv').config();
 
const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');

(async () => {
    const server = Hapi.server({
        port: 8080,
        host: '0.0.0.0',
        routes: {
            cors: {
              origin: ['*'],
            },
        },
    })
 
    server.route(routes);
 
    server.ext('onPreResponse', function (request, h) {
        const response = request.response;
    
        if (response.isBoom) {
            console.error('Error occurred:', response.message); // Tambahkan ini untuk log error
            if (response.output.statusCode === 413) {
                const newResponse = h.response({
                    status: 'fail',
                    message: 'Payload content length greater than maximum allowed: 1000000',
                });
                newResponse.code(413);
                return newResponse;
            }
    
            const newResponse = h.response({
                status: 'error',
                message: 'Internal server error',
            });
            newResponse.code(response.output.statusCode);
            return newResponse;
        }
    
        return h.continue;
    });
    
    await server.start();
    console.log(`Server start at: ${server.info.uri}`);
})();
