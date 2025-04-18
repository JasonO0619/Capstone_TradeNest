const { db } = require('../firebaseAdminConfig');
const admin = require('firebase-admin');

const createReview = async (req, res) => {
  try {
    const { revieweeId, rating, text, postId, convoId } = req.body;
    const reviewerId = req.user.uid;

    const existing = await db.collection('reviews')
      .where('reviewerId', '==', reviewerId)
      .where('convoId', '==', convoId)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'You have already reviewed this user for this deal.' });
    }

    const newReview = {
      reviewerId,
      revieweeId,
      rating,
      text,
      postId,
      convoId,
      timestamp: new Date(),
    };

    const docRef = await db.collection('reviews').add(newReview);


    const allReviewsSnap = await db.collection('reviews')
      .where('revieweeId', '==', revieweeId)
      .get();

    const totalReviews = allReviewsSnap.size;
    let totalRating = 0;

    allReviewsSnap.forEach(doc => {
      const data = doc.data();
      totalRating += data.rating || 0;
    });

    const trustScore = totalReviews > 0 ? totalRating / totalReviews : 0;


    await db.collection('users').doc(revieweeId).update({
      trustScore: parseFloat(trustScore.toFixed(2)), 
      ratingCount: totalReviews,
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

const getReviewsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('reviews')
      .where('revieweeId', '==', userId)
      .get();

    let totalRating = 0;

    const reviews = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const review = docSnap.data();
        totalRating += review.rating;

        const reviewerSnap = await db.collection('users').doc(review.reviewerId).get();
        const reviewerData = reviewerSnap.exists ? reviewerSnap.data() : null;

        return {
          id: docSnap.id,
          ...review,
          reviewerName: reviewerData ? `${reviewerData.firstName} ${reviewerData.lastName}` : 'Unknown User',
          reviewerPic: reviewerData?.profilePicture || null,
        };
      })
    );

    reviews.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? parseFloat((totalRating / totalReviews).toFixed(1)) : null;

    res.status(200).json({
      reviews,
      averageRating,
      totalReviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};


module.exports = {
  createReview,
  getReviewsByUserId,
};
