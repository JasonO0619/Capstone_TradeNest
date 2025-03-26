const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdminConfig');
const verifyAdmin = require('../middleware/verifyAdmin');

// Protect all admin routes
router.use(verifyAdmin);

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all posts (admin only)
router.get('/posts', async (req, res) => {
  try {
    const snapshot = await db.collection('posts').get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
