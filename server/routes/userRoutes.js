const express = require('express');
const router = express.Router();
const { createUserProfile } = require('../controllers/userController');
const { getUserById } = require('../controllers/userController');
const verifyToken  = require('../middleware/verifyToken'); 

router.post('/register', verifyToken, async (req, res) => {
    try {
      const uid = req.user.uid;
      const { email, ...extraData } = req.body;
  
      if (!uid || !email || !extraData.username) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      const user = await createUserProfile(uid, email, extraData);
      res.status(201).json({ message: "User profile created", user });
    } catch (err) {
      console.error("❌ Error creating user profile:", err);
      res.status(500).json({ error: err.message });
    }
  });


router.get('/myProfile', verifyToken, async (req, res) => {
    try {
      const user = await getUserById(req.user.uid);
      res.json({ uid: req.user.uid, ...user });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  router.get('/:userId', async (req, res) => {
    try {
      const user = await getUserById(req.params.userId);
      res.json(user);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });


module.exports = router;
