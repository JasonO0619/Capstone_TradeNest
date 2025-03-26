const express = require('express');
const router = express.Router();
const {
  addPost,
  getPostById,
  updatePost,
  deletePost,
  getPostsByCategory
} = require('../controllers/postController');

// Create Post
router.post('/', async (req, res) => {
  try {
    const postId = await addPost(req.body);
    res.status(201).json({ postId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Post
router.put('/:id', async (req, res) => {
  try {
    const msg = await updatePost(req.params.id, req.body);
    res.json({ message: msg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Post
router.delete('/:id', async (req, res) => {
  try {
    const msg = await deletePost(req.params.id);
    res.json({ message: msg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/type/:typeOfPost', async (req, res) => {
    try {
      const posts = await getPostsByCategory(req.params.typeOfPost);
      res.json({ posts });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/user/:userId', async (req, res) => {
    try {
      const posts = await getPostsByUser(req.params.userId);
      res.json(posts);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const post = await getPostById(req.params.id);
      res.json(post);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

module.exports = router;
