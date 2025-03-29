const { admin } = require('../firebaseAdminConfig');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ message: 'Unauthorized: Invalid token format' });
    }

    const token = authHeader.split(' ')[1]; // safely split at the space


    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;


    console.log('✅ Token verified for UID:', decoded.uid);

    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(403).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = verifyToken;