const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  getFavoriteCount,
} = require('../controllers/favoritesController');

router.get('/', verifyToken, async (req, res) => {
  try {
    const postIds = await getUserFavorites(req.user.uid);
    res.json(postIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:postId', verifyToken, async (req, res) => {
  const { postId } = req.body;
  if (!postId) return res.status(400).json({ error: 'postId required' });

  try {
    await addFavorite(req.user.uid, postId);
    res.status(201).json({ message: 'Post favorited' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:postId', verifyToken, async (req, res) => {
  try {
    await removeFavorite(req.user.uid, req.params.postId);
    res.json({ message: 'Favorite removed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/count/:postId', async (req, res) => {
  try {
    const count = await getFavoriteCount(req.params.postId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;