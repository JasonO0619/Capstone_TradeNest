const { db } = require('../firebaseAdminConfig');

const verifyPosterAccess = async (req, res, next) => {
  const convoId = req.params.id;
  const userId = req.user.uid;

  try {
    const convoDoc = await db.collection('conversations').doc(convoId).get();

    if (!convoDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const convoData = convoDoc.data();
    const postId = convoData.postId;

    const postDoc = await db.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postData = postDoc.data();

    if (postData.userId !== userId) {
      return res.status(403).json({ error: 'Only the post creator can perform this action' });
    }


    req.post = postData;
    req.conversation = convoData;

    next();
  } catch (err) {
    console.error("❌ verifyPosterAccess error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = verifyPosterAccess;