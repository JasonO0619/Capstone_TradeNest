// storage.js
const { storage } = require('./firebaseAdminConfig');
const path = require('path');

// Function to upload a file to Firebase Storage and return its public URL
const uploadFile = async (filePath, bucketPath) => {
  try {
    const bucket = storage.bucket();
    await bucket.upload(filePath, { destination: bucketPath });

    const file = bucket.file(bucketPath);
    const publicUrl = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    });

    return publicUrl[0];
  } catch (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }
};

// Function to upload profile picture and return its URL
const uploadProfilePicture = async (userId, filePath) => {
  try {
    const bucketPath = `profile_pictures/${userId}/${path.basename(filePath)}`;
    const profilePicUrl = await uploadFile(filePath, bucketPath);
    return profilePicUrl;
  } catch (error) {
    throw new Error(`Error uploading profile picture: ${error.message}`);
  }
};

module.exports = { uploadFile, uploadProfilePicture };
