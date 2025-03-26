const { admin } = require('../firebaseAdminConfig');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(403).json({ message: 'Unauthorized: No token' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // user info now available in routes
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
