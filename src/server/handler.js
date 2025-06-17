const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();
const { createUser, getUserByEmail, storeData } = require('../services/storeData');
const { uploadImageToGCS } = require('../services/utils');

async function postRegistHandler(request, h) {
    const { name, email, password } = request.payload;

    if (!name || !email || !password) {
        return h.response({
            status: 'fail',
            message: 'Semua field harus diisi.',
        }).code(400);
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        return h.response({
            status: 'fail',
            message: 'Email sudah digunakan, silahkan gunakan email lain',
        }).code(409);
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.scryptSync(password, salt, 64).toString('hex');

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
        name,
        email,
        password: hashedPassword,
        salt: salt,
        createdAt
    };

    await createUser(id, data);

    const response = h.response({
        status: 'success',
        message: 'User successfully registered',
        data
    });

    response.code(201);
    return response;
}

async function postLoginHandler(request, h) {
    const { email, password } = request.payload;

    if (!email || !password) {
        return h.response({
            status: 'fail',
            message: 'Email dan password harus diisi.',
        }).code(400);
    }

    const user = await getUserByEmail(email);

    if (!user) {
        return h.response({
            status: 'fail',
            message: 'Email atau password salah.',
        }).code(401);
    }

    const { password: hashedPassword, salt } = user;
    const hashedInputPassword = crypto.scryptSync(password, salt, 64).toString('hex');

    if (hashedInputPassword !== hashedPassword) {
        return h.response({
            status: 'fail',
            message: 'Email atau password salah.',
        }).code(401);
    }

    const token = jwt.sign(
        { userId: user.id, email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const response = h.response({
        status: 'success',
        message: 'Login berhasil.',
        data: { token }
    });

    response.code(200);
    return response;
}

async function predictClassification(model, image) {
    const form = new FormData();
    form.append('image', Buffer.from(image._data), {
        filename: image.hapi.filename,
        contentType: image.hapi.headers['content-type'],
    });

    try {
        const response = await axios.post(
            'https://mangodetect-947755240619.asia-southeast2.run.app/predict',
            form,
            {
                headers: form.getHeaders()
            }
        );

        const result = response.data;
        console.log('Flask prediction result:', result); // debug

        if (!result || !result.result || !result.suggestion) {
            throw new Error('Invalid response from prediction service');
        }

        return {
            label: result.result,
            suggestion: result.suggestion,
            maturity_score: result.maturity_score,
        };

    } catch (error) {
        console.error('Prediction failed:', error.message);
        throw new Error('Prediction service error');
    }
}

async function postPredictHandler(request, h) {
    const { image } = request.payload;

    if (!image || !image.path) {
        return h.response({
            status: 'fail',
            message: 'Image is required.',
        }).code(400);
    }

    const userId = request.auth.credentials?.userId;
    if (!userId) {
        return h.response({
            status: 'fail',
            message: 'Unauthorized. User ID is missing.',
        }).code(401);
    }

    let imageUrl;
    try {
        imageUrl = await uploadImageToGCS(image);
    } catch (err) {
        console.error('Upload error:', err);
        return h.response({
            status: 'error',
            message: 'Image upload failed.',
        }).code(500);
    }

    let label, suggestion, maturity_score;
    try {
        ({ label, suggestion, maturity_score } = await predictClassification(null, image));
    } catch (err) {
        return h.response({
            status: 'error',
            message: 'Failed to connect to prediction service.',
        }).code(500);
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
        id,
        imageUrl, // ← added image URL here
        maturity_score,
        result: label,
        suggestion,
        createdAt
    };

    console.log('Storing data to Firestore:', data);

    await storeData(userId, data);

    const response = h.response({
        status: 'success',
        message: 'Model is predicted successfully',
        data
    });

    response.code(201);
    return response;
}

async function getHistoryHandler(request, h) {
    const userId = request.auth.credentials?.userId;

    if (!userId) {
        return h.response({
            status: 'fail',
            message: 'Unauthorized. User ID is missing.',
        }).code(401);
    }

    try {
        const historyRef = db.collection('predictions').doc(userId).collection('history');
        const snapshot = await historyRef.orderBy('timestamp', 'desc').get();

        const history = [];
        snapshot.forEach(doc => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return h.response({
            status: 'success',
            data: history
        }).code(200);

    } catch (err) {
        console.error('Failed to fetch history:', err);
        return h.response({
            status: 'error',
            message: 'Failed to fetch history data.'
        }).code(500);
    }
}

module.exports = {
    postRegistHandler,
    postLoginHandler,
    predictClassification,
    postPredictHandler,
    getHistoryHandler,
};