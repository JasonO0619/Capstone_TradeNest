const { db } = require('../firebaseAdminConfig');
const admin = require('firebase-admin');


const addPost = async (postData) => {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const enriched = {
    ...postData,
    posterId: postData.posterId,  
    typeOfPost: postData.typeOfPost,       
    itemCategory: postData.itemCategory,
    images: postData.images || [],
    dateCreated: now,
    dateUpdated: now,
    status: getDefaultStatus(postData.typeOfPost),
    price: postData.price || null,
    desiredItem: postData.desiredItem || null,
    lendStartDate: postData.lendStartDate || null,
    lendEndDate: postData.lendEndDate || null,
  };

  const postRef = await db.collection('posts').add(enriched);
  if (postData.posterId) {
    const userRef = db.collection('users').doc(postData.posterId);
    await userRef.update({
      postsCount: admin.firestore.FieldValue.increment(1)
    });
  }
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
  const postRef = db.collection('posts').doc(postId);
  const postSnap = await postRef.get();

  if (!postSnap.exists) {
    throw new Error('Post not found');
  }

  const postData = postSnap.data();
  const posterId = postData.posterId;

  await postRef.delete();

  const userRef = db.collection('users').doc(posterId);
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists) return;

    const currentCount = userSnap.data().postsCount || 0;
    const newCount = Math.max(0, currentCount - 1); 
    transaction.update(userRef, { postsCount: newCount });
  });

  return 'Post deleted and user post count updated';
};

const getPostsByCategory = async (typeOfPost) => {
    const snapshot = await db.collection('posts').where('typeOfPost', '==', typeOfPost).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getPostsByUser = async (posterId) => {
    const snapshot = await db.collection('posts').where('posterId', '==', posterId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


const getDefaultStatus = (typeOfPost) => {
  switch (typeOfPost) {
    case 'sell': return 'For Sale';
    case 'lend': return 'Available';
    case 'trade': return 'Available';
    case 'found': return 'Waiting To Be Claimed';
    default: return 'active';
  }
};

module.exports = { addPost, getPostById, updatePost, deletePost, getPostsByCategory, getPostsByUser};
