require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const inputError = require('../exceptions/inputError');

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 8080, 
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

    server.ext('onPreResponse', (request, h) => {
        const response = request.response;

        if (response instanceof inputError) {
            return h.response({
                status: 'fail',
                message: `${response.message} Please use another photo.`
            }).code(response.statusCode);
        }

        if (response.isBoom) {
            if (response.output.statusCode === 413) {
                return h.response({
                    status: 'fail',
                    message: 'Payload content length greater than maximum allowed: 1000000',
                }).code(413);
            }

            return h.response({
                status: 'fail',
                message: response.message,
            }).code(response.output.statusCode);
        }

        return h.continue;
    });

    await server.start();
    console.log(`✅ Server running at ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err);
    process.exit(1);
});

init();
