const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const verifyPosterAccess = require('../middleware/verifyPosterAccess');
const {
  createTradeConversation,
  createSellConversation,
  createLendConversation,
  createLostConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  finalizeConversation,
  confirmFinalTrade,
  submitClaimForm,
  getClaimForm,
  approveClaimForm, 
  getClaimsForConversation,
} = require('../controllers/messageController');

router.use(verifyToken);

router.post('/conversations/trade', createTradeConversation);
router.post('/conversations/sell', createSellConversation);
router.post('/conversations/lend', createLendConversation);
router.post('/conversations/found', createLostConversation);
router.get('/conversations', getUserConversations);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/conversations/:id/messages', sendMessage);
router.post('/conversations/:id/finalize', finalizeConversation);
router.post('/conversations/:id/confirm-trade', verifyPosterAccess, confirmFinalTrade);
router.post('/conversations/submit-claim', submitClaimForm);
router.get('/conversations/found/:id/claim', getClaimForm);
router.patch('/conversations/:convoId/claims/:claimId/approve', approveClaimForm);
router.get('/conversations/:convoId/claims', getClaimsForConversation);

module.exports = router;
