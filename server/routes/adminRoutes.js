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

    res.set('Content-Range', `users 0-${users.length - 1}/${users.length}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    res.status(200).json(users);

    // res.json(users);
  } catch (error) {
    console.error("🔥 /api/admin/users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all posts (admin only)
router.get('/posts', async (req, res) => {
  try {
    const snapshot = await db.collection('posts').get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.set('Content-Range', `users 0-${posts.length - 1}/${posts.length}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    res.status(200).json(posts);
  
    // res.json(posts);
  } catch (error) {
    console.error("🔥 /api/admin/posts error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
