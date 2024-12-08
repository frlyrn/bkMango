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

    const user = snapshot.docs[0].data();
    return user;
}


module.exports = { createUser, getUserByEmail };
