const { postRegistHandler, postLoginHandler, postPredictHandler } = require('../server/handler');

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
    {
        path: '/predict',
        method: 'POST',
        handler: postPredictHandler,
        options: {
          payload: {
            allow: 'multipart/form-data',
            multipart: true,
            maxBytes: 1000000, 
          }
        }
      },
]

module.exports = routes;