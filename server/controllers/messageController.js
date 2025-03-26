// 📁 controllers/messageController.js
const { db } = require('../firebaseAdminConfig');

// 🔹 Create or get a conversation between two users
const createConversation = async (req, res) => {
    const { recipientId } = req.body;
    const senderId = req.user.uid;
  
    try {
      // 1. Get all conversations with either user involved
      const snapshot = await db.collection('conversations')
        .where('participants', 'array-contains-any', [senderId, recipientId])
        .get();
  
      // 2. Check manually for exact match
      let existingConvo = null;
      snapshot.forEach(doc => {
        const participants = doc.data().participants;
        if (
          participants.includes(senderId) &&
          participants.includes(recipientId) &&
          participants.length === 2
        ) {
          existingConvo = { id: doc.id, ...doc.data() };
        }
      });
  
      if (existingConvo) {
        return res.json(existingConvo);
      }
  
      // 3. If not found, create a new one
      const convoRef = await db.collection('conversations').add({
        participants: [senderId, recipientId],
        lastMessage: '',
        lastMessageTimestamp: null,
        isRead: false,
        status: 'active',
      });
  
      res.status(201).json({ id: convoRef.id });
    } catch (err) {
      console.error("❌ Error in createConversation:", err);
      res.status(500).json({ error: err.message });
    }
  };
// 🔹 Get all conversations for current user
const getUserConversations = async (req, res) => {
  try {
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains', req.user.uid)
      .get();

    const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Get all messages in a conversation
const getConversationMessages = async (req, res) => {
  const convoId = req.params.id;

  try {
    const convoDoc = await db.collection('conversations').doc(convoId).get();
    if (!convoDoc.exists || !convoDoc.data().participants.includes(req.user.uid)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const snapshot = await db.collection('conversations')
      .doc(convoId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();

    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Send a message
const sendMessage = async (req, res) => {
  const convoId = req.params.id;
  const senderId = req.user.uid;
  const { message, type = 'text' } = req.body;

  try {
    const convoDoc = await db.collection('conversations').doc(convoId).get();
    if (!convoDoc.exists || !convoDoc.data().participants.includes(senderId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messageData = {
      senderId,
      message,
      timestamp: new Date(),
      type,
      status: 'sent'
    };

    await db.collection('conversations')
      .doc(convoId)
      .collection('messages')
      .add(messageData);

    await db.collection('conversations')
      .doc(convoId)
      .update({
        lastMessage: message,
        lastMessageTimestamp: new Date(),
        isRead: false
      });

    res.status(201).json({ message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Finalize conversation
const finalizeConversation = async (req, res) => {
  const convoId = req.params.id;
  const userId = req.user.uid;

  try {
    const convoRef = db.collection('conversations').doc(convoId);
    const convoDoc = await convoRef.get();

    if (!convoDoc.exists) return res.status(404).json({ error: "Conversation not found" });

    const currentFinalized = convoDoc.data().finalized || {};
    currentFinalized[userId] = true;

    await convoRef.update({ finalized: currentFinalized });

    res.json({ message: 'Finalized updated', finalized: currentFinalized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  finalizeConversation,
};
