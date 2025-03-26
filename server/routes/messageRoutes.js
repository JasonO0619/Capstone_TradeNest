const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  createConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  finalizeConversation,
} = require('../controllers/messageController');

router.use(verifyToken);

router.post('/conversations', createConversation);
router.get('/conversations', getUserConversations);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/conversations/:id/messages', sendMessage);
router.post('/conversations/:id/finalize', finalizeConversation);

module.exports = router;
