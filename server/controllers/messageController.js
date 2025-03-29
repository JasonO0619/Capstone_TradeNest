
const { db } = require('../firebaseAdminConfig');

const createTradeConversation = async (req, res) => {
  const { recipientId, postId } = req.body;
  const senderId = req.user.uid;

  if (!recipientId || !postId) {
    return res.status(400).json({ error: "Missing recipientId or postId" });
  }

  try {
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains-any', [senderId, recipientId])
      .get();

    let existingConvo = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.participants.includes(senderId) &&
        data.participants.includes(recipientId) &&
        data.typeOfPost === 'trade' &&
        data.postId === postId &&
        data.participants.length === 2
      ) {
        existingConvo = { id: doc.id, ...data };
      }
    });

    if (existingConvo) return res.json(existingConvo);

    const convoData = {
      participants: [senderId, recipientId],
      typeOfPost: 'trade',
      postId,
      tradeItems: { [senderId]: postId, [recipientId]: null },
      finalized: {},
      lastMessage: '',
      lastMessageTimestamp: null,
      isRead: {
        [senderId]: true,
        [recipientId]: false,
      },
      status: 'active',
      createdAt: new Date(),
    };

    const convoRef = await db.collection('conversations').add(convoData);
    res.status(201).json({ id: convoRef.id });
  } catch (err) {
    console.error("❌ Error in createTradeConversation:", err);
    res.status(500).json({ error: err.message });
  }
};



const createSellConversation = async (req, res) => {
  const { recipientId, postId } = req.body;
  const senderId = req.user.uid;

  if (!recipientId || !postId) {
    return res.status(400).json({ error: "Missing recipientId or postId" });
  }

  try {
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains-any', [senderId, recipientId])
      .get();

    let existingConvo = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.participants.includes(senderId) &&
        data.participants.includes(recipientId) &&
        data.typeOfPost === 'sell' &&
        data.postId === postId &&
        data.participants.length === 2
      ) {
        existingConvo = { id: doc.id, ...data };
      }
    });

    if (existingConvo) return res.json(existingConvo);

    const convoRef = await db.collection('conversations').add({
      participants: [senderId, recipientId],
      typeOfPost: 'sell',
      postId,
      finalized: {},
      status: 'active',
      lastMessage: '',
      lastMessageTimestamp: null,
      isRead: {
        [senderId]: true,
        [recipientId]: false,
      },
      createdAt: new Date(),
    });

    res.status(201).json({ id: convoRef.id });
  } catch (err) {
    console.error("❌ Error in createSellConversation:", err);
    res.status(500).json({ error: err.message });
  }
};


const createLendConversation = async (req, res) => {
  const { recipientId, postId } = req.body;
  const senderId = req.user.uid;

  if (!recipientId || !postId) {
    return res.status(400).json({ error: "Missing recipientId or postId" });
  }

  try {
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains-any', [senderId, recipientId])
      .get();

    let existingConvo = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.participants.includes(senderId) &&
        data.participants.includes(recipientId) &&
        data.typeOfPost === 'lend' &&
        data.postId === postId &&
        data.participants.length === 2
      ) {
        existingConvo = { id: doc.id, ...data };
      }
    });

    if (existingConvo) return res.json(existingConvo);

    const convoRef = await db.collection('conversations').add({
      participants: [senderId, recipientId],
      typeOfPost: 'lend',
      postId,
      finalized: {},
      status: 'active',
      lastMessage: '',
      lastMessageTimestamp: null,
      isRead: {
        [senderId]: true,
        [recipientId]: false,
      },
      createdAt: new Date(),
    });

    res.status(201).json({ id: convoRef.id });
  } catch (err) {
    console.error("❌ Error in createLendConversation:", err);
    res.status(500).json({ error: err.message });
  }
};


const createLostConversation = async (req, res) => {
  const { recipientId, postId } = req.body;
  const senderId = req.user.uid;

  if (!recipientId || !postId) {
    return res.status(400).json({ error: "Missing recipientId or postId" });
  }

  try {
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains-any', [senderId, recipientId])
      .get();

    let existingConvo = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.participants.includes(senderId) &&
        data.participants.includes(recipientId) &&
        data.typeOfPost === 'lost' &&
        data.postId === postId &&
        data.participants.length === 2
      ) {
        existingConvo = { id: doc.id, ...data };
      }
    });

    if (existingConvo) return res.json(existingConvo);

    const convoRef = await db.collection('conversations').add({
      participants: [senderId, recipientId],
      typeOfPost: 'lost',
      postId,
      finalized: {},
      status: 'active',
      lastMessage: '',
      lastMessageTimestamp: null,
      isRead: {
        [senderId]: true,
        [recipientId]: false,
      },
      createdAt: new Date(),
      claimFormSubmitted: false,
    });

    res.status(201).json({ id: convoRef.id });
  } catch (err) {
    console.error("❌ Error in createLostConversation:", err);
    res.status(500).json({ error: err.message });
  }
};


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
      status: 'sent',
    };

    await db.collection('conversations')
      .doc(convoId)
      .collection('messages')
      .add(messageData);

    const convoData = convoDoc.data();
    const receiverId = convoData.participants.find(id => id !== senderId);

    await db.collection('conversations')
      .doc(convoId)
      .update({
        lastMessage: message,
        lastMessageTimestamp: new Date(),
        isRead: {
          [senderId]: true,
          [receiverId]: false,
        },
        lastMessageSenderId: senderId,
      });

    res.status(201).json({ message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const finalizeConversation = async (req, res) => {
  const convoId = req.params.id;
  const userId = req.user.uid;

  try {
    const convoRef = db.collection('conversations').doc(convoId);
    const convoDoc = await convoRef.get();

    if (!convoDoc.exists) return res.status(404).json({ error: 'Conversation not found' });

    const convoData = convoDoc.data();
    const currentFinalized = convoData.finalized || {};
    currentFinalized[userId] = true;

    await convoRef.update({ finalized: currentFinalized });

    const allFinalized = convoData.participants.every(uid => currentFinalized[uid]);
    if (allFinalized) {
      await db.collection('posts').doc(convoData.postId).update({
        status: 'pending',
        dateUpdated: new Date(),
      });
    }

    res.json({ message: 'Finalized updated', finalized: currentFinalized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const confirmFinalTrade = async (req, res) => {
  const convoId = req.params.id;
  const userId = req.user.uid;

  try {
    const convoRef = db.collection('conversations').doc(convoId);
    const convoDoc = await convoRef.get();
    if (!convoDoc.exists) return res.status(404).json({ error: "Conversation not found" });

    const convoData = convoDoc.data();
    const posterId = convoData.participants[0];
    if (userId !== posterId) {
      return res.status(403).json({ error: "Only poster can finalize the trade." });
    }

    const postRef = db.collection('posts').doc(convoData.postId);
    await postRef.update({
      status: 'unavailable',
      dateUpdated: new Date()
    });

    await convoRef.update({ status: 'completed', finalizedAt: new Date() });

    res.json({ message: 'Trade finalized successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const submitClaimForm = async (req, res) => {
  const convoId = req.params.id;
  const userId = req.user.uid;
  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Invalid form submission' });
  }

  try {
    const convoRef = db.collection('conversations').doc(convoId);
    const convoDoc = await convoRef.get();

    if (!convoDoc.exists || !convoDoc.data().participants.includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await convoRef.update({
      claimForm: {
        userId,
        answers,
        submittedAt: new Date()
      }
    });

    res.json({ message: 'Claim form submitted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTradeConversation,
  createSellConversation,
  createLendConversation,
  createLostConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  finalizeConversation,
  confirmFinalTrade,
  submitClaimForm
};
