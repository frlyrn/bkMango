const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const predictClassification = require('../services/inferenceService');
const { createUser, getUserByEmail, storeData, getHistoryByUserId } = require('../services/storeData');

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
            message: 'Email sudah digunakan.',
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

  const { label, suggestion } = await predictClassification(model, image);
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
    postRegistHandler, 
    postLoginHandler, 
    postPredictHandler, 
    getHistoryHandler 
  };