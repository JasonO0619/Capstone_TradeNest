// firestore.js
const { db, auth } = require('./firebaseAdminConfig');

// Function to add a new post document to the appropriate subcollection
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

// Function to get a post by its ID
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

// Function to update a post by its ID
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

// Function to create a new user and save their details in Firestore
const createUser = async (email, password, firstName, lastName, username, profilePictureUrl) => {
  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
    });

    const userData = {
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      profilePicture: profilePictureUrl || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userRef = await db.collection('users').doc(userRecord.uid).set(userData);

    return { userRecord, userRef };
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};

module.exports = { addPost, getPostById, updatePost, createUser };
