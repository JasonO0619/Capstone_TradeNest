
const { storage } = require('./firebaseAdminConfig');
const path = require('path');


const uploadFile = async (filePath, postType, fileName) => {
  try {

    const validPostTypes = ['sell', 'trade', 'lend', 'found'];
    if (!validPostTypes.includes(postType)) {
      throw new Error('Invalid post type. Must be "sell", "trade", "lend", or "found".');
    }

    const bucketPath = `posts/${postType}/${fileName}`; 
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
