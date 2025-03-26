const { db } = require('../firebaseAdminConfig');
const verifyToken = require('./verifyToken');

const verifyAdmin = async (req, res, next) => {
  try {
    await verifyToken(req, res, async () => {
      const userId = req.user.uid;
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists || !userDoc.data().isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      next();
    });
  } catch (err) {
    return res.status(403).json({ message: 'Admin check failed' });
  }
};

module.exports = verifyAdmin;
