const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, ''),
  projectId: 'testskri' // dari file JSON atau Cloud Console
});

const bucket = storage.bucket('mango-detection-images');

const uploadImageToGCS = async (image) => {
  const fileName = `${Date.now()}_${image.hapi.filename}`;
  const file = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: {
        contentType: image.hapi.headers['content-type']
      },
      resumable: false
    });

    stream.on('error', (err) => reject(err));

    stream.on('finish', async () => {
      await file.makePublic(); // agar bisa diakses via URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      resolve(publicUrl);
    });

    stream.end(image._data);
  });
};

module.exports = { uploadImageToGCS };
