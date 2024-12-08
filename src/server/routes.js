const { postRegistHandler, postLoginHandler } = require('../server/handler');

const routes = [
    {
        path: '/regist',
        method: 'POST',
        handler: postRegistHandler,
    },
    {
        method: 'POST',
        path: '/login',
        handler: postLoginHandler
    },
]

module.exports = routes;