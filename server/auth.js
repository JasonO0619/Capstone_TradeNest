
const { auth } = require('./firebaseAdminConfig');


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


const signInUser = async (email) => {
  try {
    const userRecord = await auth.getUserByEmail(email);
    if (userRecord) {
      
      return userRecord;
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};


const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(`Error verifying ID token: ${error.message}`);
  }
};

module.exports = { createUser, signInUser, verifyIdToken };
