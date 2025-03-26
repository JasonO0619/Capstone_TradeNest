
const { db, auth } = require('./firebaseAdminConfig');


const addPost = async (postType, postData) => {
  try {
    const validPostTypes = ['selling', 'trading', 'lending', 'found-items'];
    if (!validPostTypes.includes(postType)) {
      throw new Error('Invalid post type. Please choose from "selling", "trading", "lending", or "found-items".');
    }

    const subcollection = postType;

    const docRef = await db
      .collection('posts')           
      .doc(subcollection)            
      .collection('items')           
      .add(postData);                

    return docRef.id;
  } catch (error) {
    throw new Error(`Error adding post: ${error.message}`);
  }
};


const getPostById = async (postType, postId) => {
  try {
    const validPostTypes = ['selling', 'trading', 'lending', 'found-items'];
    if (!validPostTypes.includes(postType)) {
      throw new Error('Invalid post type.');
    }

    const doc = await db
      .collection('posts')
      .doc(postType)
      .collection('items')
      .doc(postId)
      .get();

    if (doc.exists) {
      return doc.data();
    } else {
      throw new Error('Post not found');
    }
  } catch (error) {
    throw new Error(`Error fetching post: ${error.message}`);
  }
};

const updatePost = async (postType, postId, updatedData) => {
  try {
    const validPostTypes = ['selling', 'trading', 'lending', 'found-items'];
    if (!validPostTypes.includes(postType)) {
      throw new Error('Invalid post type.');
    }

    await db
      .collection('posts')
      .doc(postType)
      .collection('items')
      .doc(postId)
      .update(updatedData);

    return 'Post updated successfully';
  } catch (error) {
    throw new Error(`Error updating post: ${error.message}`);
  }
};

const deletePost = async (postType, postId) => {
  try {
    const validPostTypes = ['selling', 'trading', 'lending', 'found-items'];

    if (!validPostTypes.includes(postType)) {
      throw new Error('Invalid post type.');
    }

    await db
      .collection('posts')
      .doc(postType)
      .collection('items')
      .doc(postId)
      .delete();

    return 'Post deleted successfully';
  } catch (error) {
    throw new Error(`Error deleting post: ${error.message}`);
  }
};

module.exports = { addPost, getPostById, updatePost };
