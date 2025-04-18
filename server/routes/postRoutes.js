const express = require('express');
const router = express.Router();
const {
  addPost,
  getPostById,
  updatePost,
  deletePost,
  getPostsByCategory,
  getPostsByUser
} = require('../controllers/postController');
const verifyToken = require('../middleware/verifyToken');


router.post('/', async (req, res) => {
  try {
    const postId = await addPost(req.body);
    res.status(201).json({ postId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const msg = await updatePost(req.params.id, req.body);
    res.json({ message: msg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


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
  router.patch('/status/:postId', verifyToken, async (req, res) => {
    try {
      const { postId } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Missing status' });
  
      const postRef = db.collection('posts').doc(postId);
      const postDoc = await postRef.get();
      const postData = postDoc.data();
  
      let updatedStatus = status;
  
      if (postData.typeOfPost === 'sell') {
        if (status === 'Pending') updatedStatus = 'Pending';  
        if (status === 'Sold') updatedStatus = 'Sold';      
      }
  
      if (postData.typeOfPost === 'trade') {
        if (status === 'Pending') updatedStatus = 'Pending';  
        if (status === 'Traded') updatedStatus = 'Traded';  
      }
  
      if (postData.typeOfPost === 'lend') {
        if (status === 'Pending') updatedStatus = 'Pending';
        if (status === 'Borrowed') updatedStatus = 'Borrowed'; 
      }

      if (postData.typeOfPost === 'found') {
        if (status === 'Pending') updatedStatus = 'Pending';
        if (status === 'Returned') updatedStatus = 'Returned'; 
      }
  
  
      await postRef.update({
        status: updatedStatus,
        dateUpdated: new Date(),
      });
  
      res.json({ message: 'Post status updated', status: updatedStatus });
    } catch (err) {
      console.error('[Update Status Error]', err);
      res.status(500).json({ error: 'Failed to update post status' });
    }
  });
  

module.exports = router;
