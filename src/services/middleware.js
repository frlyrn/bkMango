const jwt = require('jsonwebtoken');

const authenticate = (request, h) => {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw Boom.unauthorized('Token is missing or invalid.');
    }

    const token = authorizationHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        request.auth = { credentials: { userId: decoded.userId } };

        return h.continue;
    } catch (err) {
        throw Boom.unauthorized('Invalid or expired token.');
    }
};

module.exports = { authenticate };
