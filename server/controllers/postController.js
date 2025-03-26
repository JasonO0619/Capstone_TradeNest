const { db } = require('../firebaseAdminConfig');

// Add a new post to the flat 'posts' collection
const addPost = async (postData) => {
  const now = new Date();

  const enriched = {
    ...postData,
    typeOfPost: postData.typeOfPost,        // sell, trade, lend, found
    itemCategory: postData.itemCategory,
    images: postData.images || [],
    dateCreated: now,
    dateUpdated: now,
    isVerified: false,
    reported: false,
    status: getDefaultStatus(postData.typeOfPost),
    price: postData.price || null,
    desiredItem: postData.desiredItem || null,
    isFree: postData.isFree || false,
    lendStartDate: postData.lendStartDate || null,
    lendEndDate: postData.lendEndDate || null,
  };

  const postRef = await db.collection('posts').add(enriched);
  return postRef.id;
};

const getPostById = async (postId) => {
  const doc = await db.collection('posts').doc(postId).get();
  if (!doc.exists) throw new Error("Post not found");
  return { id: doc.id, ...doc.data() };
};

const updatePost = async (postId, updatedData) => {
  const updated = {
    ...updatedData,
    dateUpdated: new Date()
  };

  if (updatedData.typeOfPost) {
    updated.status = getDefaultStatus(updatedData.typeOfPost);
  }

  await db.collection('posts').doc(postId).update(updated);
  return "Post updated";
};

const deletePost = async (postId) => {
  await db.collection('posts').doc(postId).delete();
  return "Post deleted";
};

const getPostsByCategory = async (typeOfPost) => {
    const snapshot = await db.collection('posts').where('typeOfPost', '==', typeOfPost).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getPostsByUser = async (userId) => {
    const snapshot = await db.collection('posts').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


const getDefaultStatus = (typeOfPost) => {
  switch (typeOfPost) {
    case 'sell': return 'For Sale';
    case 'lend': return 'Available';
    case 'trade': return 'Available';
    case 'lost': return 'waiting to be claimed';
    default: return 'active';
  }
};

module.exports = { addPost, getPostById, updatePost, deletePost, getPostsByCategory, getPostsByUser};
