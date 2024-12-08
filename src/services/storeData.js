const { Firestore } = require('@google-cloud/firestore');
const bcrypt = require('bcrypt');

async function createUser(id, email, password) {
  const db = new Firestore();
  const hashedPassword = await bcrypt.hash(password, 10); // Hash password

  const usersCollection = db.collection('users');
  await usersCollection.doc(id).set({
    email: email,
    password: hashedPassword,
    created_at: new Date().toISOString(),
  });

  console.log('User successfully created in Firestore.');
}

async function addDetection(userId, imageUrl, result) {
    const db = new Firestore();
  
    const detectionsCollection = db.collection('users').doc(userId).collection('detections');
    await detectionsCollection.add({
      image_url: imageUrl,
      result: result,
      detected_at: new Date().toISOString(),
    });
  
    console.log('Detection result successfully added to Firestore.');
  }

module.exports = {createUser, addDetection};
