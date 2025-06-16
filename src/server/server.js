require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const inputError = require('../exceptions/inputError');

(async () => {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: '0.0.0.0',
        routes: {
            cors: {
                origin: ['*'],
                headers: ['Accept', 'Content-Type', 'Authorization'], 
                exposedHeaders: ['Authorization'], 
                credentials: true,
            },
            payload: {
                maxBytes: 1000000,
            },
        },
    });

    server.route(routes);

    server.ext('onPreResponse', function (request, h) {
        const response = request.response;

        if (response instanceof inputError) {
            const newResponse = h.response({
                status: 'fail',
                message: `${response.message} Please use another photo.`
            });
            newResponse.code(response.statusCode);
            return newResponse;
        }

        if (response.isBoom) {
            if (response.output.statusCode === 413) {
                const newResponse = h.response({
                    status: 'fail',
                    message: 'Payload content length greater than maximum allowed: 1000000',
                });
                newResponse.code(413);
                return newResponse;
            }

            const newResponse = h.response({
                status: 'fail',
                message: response.message,
            });
            newResponse.code(response.output.statusCode);
            return newResponse;
        }

        return h.continue;
    });

    await server.start();
    console.log(`Server start at: ${server.info.uri}`);
})();