const { Firestore } = require('@google-cloud/firestore');

async function createUser(id, data) {
  const db = new Firestore();
  
  const { email, password, salt, createdAt } = data;

  const usersCollection = db.collection('users');
  await usersCollection.doc(id).set({
    email: email,
    password: password,  
    salt: salt,          
    created_at: createdAt,
  });

  console.log('User successfully created in Firestore.');
}

async function getUserByEmail(email) {
    const db = new Firestore();
    const usersCollection = db.collection('users');

    const snapshot = await usersCollection.where('email', '==', email).get();

    if (snapshot.empty) {
        return null;  
    }

    const doc = snapshot.docs[0];
    const user = doc.data();
    user.id = doc.id;
    return user;
}

async function storeData(userId, data) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId. It must be a non-empty string.');
  }

  const db = new Firestore();
  const predictionsCollection = db.collection('predictions');
  
  await predictionsCollection.doc(userId).collection('history').add({
    timestamp: new Date(),
    ...data
  });

  console.log(`Prediction stored for user ${userId}`);
}

async function getHistoryByUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId. It must be a non-empty string.');
  }

  const db = new Firestore();
  const predictionsCollection = db.collection('predictions');

  const historySnapshot = await predictionsCollection.doc(userId).collection('history').orderBy('timestamp', 'desc').get();

  if (historySnapshot.empty) {
    return []; 
  }

  const history = historySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return history;
}

module.exports = { createUser, getUserByEmail, storeData, getHistoryByUserId };