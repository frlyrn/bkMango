const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, '../../service-account.json'),
  projectId: 'testskri' 
});

const bucket = storage.bucket('mango-detection-images');

/**
 * Upload image ke GCS dan kembalikan URL publik
 * @param {Object} image - objek file dari request (Hapi multipart)
 * @returns {Promise<string>} - URL publik dari file
 */

const uploadImageToGCS = async (image) => {
  const fileName = `${Date.now()}_${image.hapi.filename}`;
  const file = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: {
        contentType: image.hapi.headers['content-type']
      },
      resumable: false,
    });

    stream.on('error', (err) => reject(err));

    stream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      resolve(publicUrl);
    });

    stream.end(image._data);
  });
};

module.exports = { uploadImageToGCS };
