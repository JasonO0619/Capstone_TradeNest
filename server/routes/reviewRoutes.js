const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { 
    createReview, 
    getReviewsByUserId 
} = require('../controllers/reviewsController');



router.post('/', verifyToken, createReview);
router.get('/:userId', getReviewsByUserId);

module.exports = router;
