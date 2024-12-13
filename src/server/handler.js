const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const predictClassification = require('../services/inferenceService');
const { createUser, getUserByEmail, storeData, getHistoryByUserId } = require('../services/storeData');
const { generateToken } = require('../services/jwt')

async function postRegistHandler(request, h) {
    const { name, email, password } = request.payload;

    if (!name || !email || !password) {
        return h.response({
            status: 'fail',
            message: 'Semua field harus diisi.',
        }).code(400);
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

async function predictWithFlask(image) {
    const url = 'https://flask-mango-predictor-900275146000.asia-southeast2.run.app/predict';
    
    const response = await axios.post(url, {
      image: image,  
    });
  
    if (response.status === 200) {
      return response.data;  
    } else {
      throw new Error('Error predicting image');
    }
  }
  
  async function postPredictHandler(request, h) {
    const { image } = request.payload;
    const { model } = request.server.app;
  
    if (!image) {
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
  
    try {
      const { label, suggestion } = await predictWithFlask(image);
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
  
      const data = {
        id,
        result: label,
        suggestion,
        createdAt
      };
      await storeData(userId, data);
  
      const response = h.response({
        status: 'success',
        message: 'Model is predicted successfully',
        data
      });
  
      response.code(201);
      return response;
    } catch (error) {
      return h.response({
        status: 'fail',
        message: `Prediction failed: ${error.message}`,
      }).code(500);
    }
  }

const getHistoryHandler = async (request, h) => {
    const userId = request.auth.credentials.userId;  
  
    const history = await getHistoryByUserId(userId);
  
    if (!history || history.length === 0) {
      return h.response({
        status: 'fail',
        message: 'No history found for this user.',
      }).code(404);
    }
  
    return h.response({
      status: 'success',
      message: 'History retrieved successfully.',
      data: history,
    }).code(200);
  };  

  module.exports = { 
    predictWithFlask,  
    postRegistHandler, 
    postLoginHandler, 
    postPredictHandler, 
    getHistoryHandler 
  };