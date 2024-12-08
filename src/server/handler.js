const crypto = require('crypto');

async function postRegistHandler(request, h) {
    try {
        const { name, email, password } = request.payload;

        if (!name || !email || !password) {
            return h.response({
                status: 'fail',
                message: 'Semua field harus diisi.',
            }).code(400); 
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const db = new Firestore();
        const usersCollection = db.collection('users');
        await usersCollection.doc(id).set({
            name,
            email,
            password: hashedPassword,
            created_at: createdAt,
        });

        return h.response({
            status: 'success',
            message: 'Pengguna berhasil diregistrasi.',
            data: { id, name, email, created_at: createdAt },
        }).code(201); 
    } catch (error) {
        console.error('Error during registration:', error);

        return h.response({
            status: 'error',
            message: 'Terjadi kesalahan pada server.',
        }).code(500);
    }
}

module.exports = { postRegistHandler };
