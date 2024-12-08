const bcrypt = require('bcrypt');

// Meng-hash password
const password = 'securepassword123';
bcrypt.hash(password, 10).then((hashedPassword) => {
    console.log('Hashed Password:', hashedPassword);

    // Verifikasi password
    bcrypt.compare('securepassword123', hashedPassword).then((isMatch) => {
        console.log('Password Match:', isMatch);
    }).catch((err) => console.error('Error:', err));
});
