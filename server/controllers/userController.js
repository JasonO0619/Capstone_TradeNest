const { db } = require('../firebaseAdminConfig');

const createUserProfile = async (uid, email, extraData) => {
  const userDoc = {
    username: extraData.username || '',
    email,
    firstName: extraData.firstName || '',
    lastName: extraData.lastName || '',
    phoneNumber: extraData.phoneNumber || '',
    profilePicture: extraData.profilePicture || '',
    trustScore: 0,
    ratingCount: 0,
    postsCount: 0,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('users').doc(uid).set(userDoc);
  return { uid, ...userDoc };
};

const getUserById = async (userId) => {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) throw new Error("User not found");
  return { id: doc.id, ...doc.data() };
};

module.exports = { createUserProfile, getUserById };
