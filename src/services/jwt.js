const jwt = require('jsonwebtoken');

const SECRET_KEY = 'secretPassword';

function generateToken(payload) {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); 
}

function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (err) {
        console.error('Token verification failed:', err);
        return null;
    }
}

module.exports = { generateToken, verifyToken };
