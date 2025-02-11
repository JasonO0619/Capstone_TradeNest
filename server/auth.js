// auth.js

const { auth } = require('./firebaseAdminConfig');

// Function to create a new user
const createUser = async (email, password) => {
  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
    });
    return userRecord;
  } catch (error) {
    throw new Error(`Error creating new user: ${error.message}`);
  }
};

// Function to authenticate an existing user with email and password
const signInUser = async (email) => {
  try {
    const userRecord = await auth.getUserByEmail(email);
    if (userRecord) {
      // Implement your custom password check or token validation logic here
      return userRecord;
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// Function to verify ID token from Firebase authentication
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(`Error verifying ID token: ${error.message}`);
  }
};

module.exports = { createUser, signInUser, verifyIdToken };
