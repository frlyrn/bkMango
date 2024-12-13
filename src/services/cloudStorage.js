const { Storage } = require('@google-cloud/storage');

const bucketName = 'mango-buckets'; 

async function uploadImageToStorage(fileBuffer, fileName) {
  const folder = 'user-detections';
  const fullPath = `${folder}/${fileName}`; 

  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(fullPath);
  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: 'image/jpeg', 
  });

  return new Promise((resolve, reject) => {
    blobStream
      .on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fullPath}`;
        resolve(publicUrl);
      })
      .on('error', (err) => {
        reject(err);
      })
      .end(fileBuffer);
  });
}

module.exports = { uploadImageToStorage };
