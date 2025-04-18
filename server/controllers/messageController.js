const { db } = require('../firebaseAdminConfig');

const createTradeConversation = async (req, res) => {
  const { postId, posterId } = req.body;
  const senderId = req.user.uid;

  if (!postId || !posterId) {
    return res.status(400).json({ error: "Missing postId or posterId" });
  }

  if (senderId === posterId) {
    return res.status(400).json({ error: "Cannot create a conversation with yourself" });
  }

  try {

    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains', senderId)
      .get();

    let existingConvo = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.participants.includes(senderId) &&
        data.participants.includes(posterId) &&
        data.typeOfPost === 'trade' &&
        data.postId === postId
      ) {
        existingConvo = { id: doc.id, ...data };
      }
    });

    if (existingConvo) {
      return res.json(existingConvo);
    }
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: "Post not found" });
    }
    const postData = postDoc.data();

    const tradeItems = {
      [posterId]: {
        title: postData.title,
        imageUri: postData.images?.[0] || '',
        condition: postData.condition || 'N/A',
      },
      [senderId]: null, 
    };

    const convoData = {
      participants: [senderId, posterId],
      typeOfPost: 'trade',
      postId,
      posterId,
      tradeItems,
      finalized: {},
      lastMessage: '',
      lastMessageTimestamp: null,
      isRead: {
        [senderId]: true,
        [posterId]: false,
      },
      status: 'active',
      createdAt: new Date(),
    };

    const convoRef = await db.collection('conversations').add(convoData);

    res.status(201).json({ id: convoRef.id, ...convoData });
  } catch (err) {
    console.error("❌ Error in createTradeConversation:", err);
    res.status(500).json({ error: err.message });
  }
};


const createSellConversation = async (req, res) => {
  const { recipientId, postId, posterId } = req.body;
  const senderId = req.user.uid;
  if (senderId === recipientId) {
    return res.status(400).json({ error: "Sender and recipient cannot be the same" });
  }

  if (!postId || !posterId) {
    return res.status(400).json({ error: "Missing posterId or postId" });
  }
  if (senderId === posterId) {
    return res.status(400).json({ error: "Cannot create conversation with yourself" });
  }

  try {
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains-any', [senderId, posterId])
      .where('postId', '==', postId)
      .get();

    let existingConvo = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.participants.includes(senderId) &&
        data.participants.includes(posterId) &&
        data.typeOfPost === 'sell' &&
        data.postId === postId
      ) {
        existingConvo = { id: doc.id, ...data };
      }
    });

    if (existingConvo) return res.json(existingConvo);

    const convoRef = await db.collection('conversations').add({
      participants: [senderId, posterId],
      typeOfPost: 'sell',
      postId,
      posterId,
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
  const { recipientId, postId, posterId } = req.body;
  const senderId = req.user.uid;

  if (!postId || !posterId) {
    return res.status(400).json({ error: "Missing posterId or postId" });
  }
  

  try {
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains-any', [senderId, posterId])
      .where('postId', '==', postId)
      .get();

    let existingConvo = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.participants.includes(senderId) &&
        data.participants.includes(posterId) &&
        data.typeOfPost === 'lend' &&
        data.postId === postId
      ) {
        existingConvo = { id: doc.id, ...data };
      }
    });

    if (existingConvo) return res.json(existingConvo);

    const convoRef = await db.collection('conversations').add({
      participants: [senderId, posterId],
      typeOfPost: 'lend',
      postId,
      posterId,
      finalized: {},
      status: 'active',
      lastMessage: '',
      lastMessageTimestamp: null,
      isRead: {
        [senderId]: true,
        [posterId]: false,
      },
      createdAt: new Date(),
    });
    if (senderId === posterId) {
      return res.status(400).json({ error: "Cannot create conversation with yourself" });
    }

    res.status(201).json({ id: convoRef.id });
  } catch (err) {
    console.error("❌ Error in createLendConversation:", err);
    res.status(500).json({ error: err.message });
  }
};

const createLostConversation = async (req, res) => {
  const { postId, posterId } = req.body;
  const senderId = req.user.uid;

  if (!postId || !posterId) {
    return res.status(400).json({ error: "Missing posterId or postId" });
  }

  if (senderId === posterId) {
    return res.status(400).json({ error: "Cannot create conversation with yourself" });
  }

  try {
    
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains-any', [senderId, posterId])
      .where('postId', '==', postId)
      .where('typeOfPost', '==', 'found')
      .get();

    let existingConvo = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.participants.includes(senderId) &&
        data.participants.includes(posterId)
      ) {
        existingConvo = { id: doc.id, ...doc.data() };
      }
    });

    if (existingConvo) {
      const docRef = await db.collection('conversations').doc(existingConvo.id).get();
      return res.status(200).json({ id: docRef.id, ...docRef.data() });
    }

    const newConvo = {
      participants: [senderId, posterId],
      typeOfPost: 'found',
      postId,
      posterId,
      finalized: {},
      status: 'active',
      lastMessage: '',
      lastMessageTimestamp: null,
      isRead: {
        [senderId]: true,
        [posterId]: false,
      },
      createdAt: new Date(),
      claimFormSubmitted: false,
      canChat: false,
      approvedClaimUserId: null,
    };

    const convoRef = await db.collection('conversations').add(newConvo);

    res.status(201).json({ id: convoRef.id, ...newConvo });

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
    const posterId = convoData.posterId;
    if (userId !== posterId) {
      return res.status(403).json({ error: "Only poster can finalize the trade." });
    }

    const postRef = db.collection('posts').doc(convoData.postId);
    await postRef.update({
      status: 'Traded',
      dateUpdated: new Date()
    });

    await convoRef.update({ status: 'completed', finalizedAt: new Date() });

    res.json({ message: 'Trade finalized successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const submitClaimForm = async (req, res) => {
  const { answers, postId, recipientId } = req.body;
  const userId = req.user.uid;

  if (!answers || typeof answers !== 'object' || !postId || !recipientId) {
    return res.status(400).json({ error: 'Missing form answers, postId, or recipientId' });
  }

  try {
    const dbRef = db.collection('conversations');

    let convoRef;
    let existingConvoDoc = null;

    const snapshot = await dbRef
      .where('participants', 'array-contains-any', [userId, recipientId])
      .where('postId', '==', postId)
      .where('typeOfPost', '==', 'found')
      .get();

    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(userId) && data.participants.includes(recipientId)) {
          existingConvoDoc = doc;
        }
      });
    }

    if (existingConvoDoc) {
      convoRef = existingConvoDoc.ref;
    } else {
      convoRef = await dbRef.add({
        participants: [userId, recipientId],
        typeOfPost: 'found',
        postId,
        posterId: recipientId,
        finalized: {},
        status: 'active',
        lastMessage: '',
        lastMessageTimestamp: null,
        isRead: {
          [userId]: true,
          [recipientId]: false,
        },
        createdAt: new Date(),
        claimFormSubmitted: false,
        canChat: false,
        approvedClaimUserId: null,
      });
    }

    const claimsRef = convoRef.collection('claims');
    const existing = await claimsRef.where('userId', '==', userId).get();
    if (!existing.empty) {
      return res.status(400).json({ message: 'You already submitted a claim' });
    }

    await claimsRef.add({
      userId,
      answers,
      isApproved: null,
      submittedAt: new Date(),
    });

    await convoRef.update({ claimFormSubmitted: true });

    const convoDoc = await convoRef.get();
    const convoData = convoDoc.data();

    return res.status(200).json({
      message: 'Claim submitted successfully',
      convoId: convoRef.id,
      ...convoData 
    });
  } catch (err) {
    console.error('❌ Error submitting claim:', err);
    return res.status(500).json({ error: err.message });
  }
};


const getClaimForm = async (req, res) => {
  const convoId = req.params.id;  
  const userId = req.user.uid;

  if (!convoId) {
    console.error("Convo ID is missing");
    return res.status(400).json({ error: 'Convo ID is required' });
  }

  try {

    const convoRef = db.collection('conversations').doc(convoId);
    const convoDoc = await convoRef.get();

    if (!convoDoc.exists || !convoDoc.data().participants.includes(userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const claimForm = convoDoc.data().claimForm;
    if (!claimForm) {
      return res.status(404).json({ error: 'Claim form not found' });
    }

    return res.json(claimForm);
  } catch (err) {
    console.error("Error getting claim form:", err);
    return res.status(500).json({ error: err.message });
  }
};

const getClaimsForConversation = async (req, res) => {
  const convoId = req.params.id;
  const userId = req.user.uid;

  try {
    const convoRef = db.collection('conversations').doc(convoId);
    const convoDoc = await convoRef.get();

    if (!convoDoc.exists) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const convoData = convoDoc.data();
    const posterId = convoData.posterId; 

    if (userId !== posterId) {
      return res.status(403).json({ error: "Only the poster can view claims" });
    }

    const claimsSnapshot = await convoRef.collection('claims').get();
    const claims = claimsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.json(claims);
  } catch (err) {
    console.error("❌ Error getting claims:", err);
    return res.status(500).json({ error: err.message });
  }
};


const approveClaimForm = async (req, res) => {
  const { convoId, claimId } = req.params;
  const userId = req.user.uid;

  try {
    const convoRef = db.collection('conversations').doc(convoId);
    const convoDoc = await convoRef.get();

    if (!convoDoc.exists) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const convoData = convoDoc.data();
    const posterId = convoData.posterId; 

    if (userId !== posterId) {
      return res.status(403).json({ error: "Only the poster can approve claims" });
    }

    const claimsRef = convoRef.collection('claims');
    const claimsSnapshot = await claimsRef.get();

    await claimsRef.doc(claimId).update({
      isApproved: true,
      approvedAt: new Date(),
    });

    const batch = db.batch();
    claimsSnapshot.docs.forEach(doc => {
      if (doc.id !== claimId) {
        batch.update(claimsRef.doc(doc.id), { isApproved: false });
      }
    });
    await batch.commit();

    const approvedClaim = (await claimsRef.doc(claimId).get()).data();

    await convoRef.update({
      canChat: true,
      approvedClaimUserId: approvedClaim.userId,
      lastMessage: '✅ Claim approved! You may now chat.',
      lastMessageTimestamp: new Date(),
      lastMessageSenderId: userId,
    });

    return res.json({ message: "Claim approved successfully" });
  } catch (err) {
    console.error("❌ Error approving claim:", err);
    return res.status(500).json({ error: err.message });
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
  submitClaimForm,
  getClaimForm,
  approveClaimForm,
  getClaimsForConversation
};
