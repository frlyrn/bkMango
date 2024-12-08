const { postRegistHandler} = require('../server/handler');

const routes = [
    {
        path: '/regist',
        method: 'POST',
        handler: postRegistHandler,
    },
]

module.exports = routes;