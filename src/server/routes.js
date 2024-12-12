const { postRegistHandler, postLoginHandler, postPredictHandler, getHistoryHandler } = require('../server/handler');
const { authenticate } = require ('../services/middleware')

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
            pre: [{ method: authenticate }],
            payload: {
                allow: 'multipart/form-data',
                multipart: true,
                maxBytes: 1000000,
            }
        }
    },
    {
        method: 'GET',
        path: '/history',
        handler: getHistoryHandler,
        options: {
            pre: [{ method: authenticate }], 
        }
    }
    
]

module.exports = routes;