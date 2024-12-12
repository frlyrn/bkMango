const { verifyToken } = require('./jwt');

async function authenticate(request, h) {
    const authorization = request.headers.authorization;

    if (!authorization) {
        return h.response({
            status: 'fail',
            message: 'Missing authentication token.',
        }).code(401).takeover();
    }

    const token = authorization.split(' ')[1]; 
    const decoded = verifyToken(token);

    if (!decoded) {
        return h.response({
            status: 'fail',
            message: 'Invalid or expired token.',
        }).code(401).takeover();
    }

    request.auth = { credentials: decoded };
    return h.continue;
}

module.exports = { authenticate };
