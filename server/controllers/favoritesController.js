const { db } = require('../firebaseAdminConfig');


const addFavorite = async (userId, postId) => {
  const snapshot = await db.collection('favorites')
    .where('userId', '==', userId)
    .where('postId', '==', postId)
    .get();

  if (!snapshot.empty) throw new Error("Already favorited");

  await db.collection('favorites').add({
    userId,
    postId,
    createdAt: new Date(),
  });

  return { success: true };
};


const removeFavorite = async (userId, postId) => {
  const snapshot = await db.collection('favorites')
    .where('userId', '==', userId)
    .where('postId', '==', postId)
    .get();

  if (snapshot.empty) throw new Error("Favorite not found");

  const batch = db.batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  return { success: true };
};


const getUserFavorites = async (userId) => {
  const snapshot = await db.collection('favorites')
    .where('userId', '==', userId)
    .get();

  return snapshot.docs.map(doc => doc.data().postId);
};


const getFavoriteCount = async (postId) => {
  const snapshot = await db.collection('favorites')
    .where('postId', '==', postId)
    .get();

  return snapshot.size;
};

module.exports = {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  getFavoriteCount,
};