const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a review
router.post('/', auth, [
  body('movieId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('reviewText').optional().isLength({ max: 1000 }),
  body('isWatched').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { movieId, rating, reviewText, photos, isWatched, mood, tags } = req.body;

    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({
      user: req.userId,
      movie: movieId
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this movie'
      });
    }

    const review = new Review({
      user: req.userId,
      movie: movieId,
      rating,
      reviewText,
      photos: photos || [],
      isWatched: isWatched !== false,
      mood,
      tags: tags || []
    });

    await review.save();

    // Update user's movie stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'movieStats.totalMoviesWatched': 1 },
      'movieStats.lastWatchDate': new Date()
    });

    // Populate the review for response
    await review.populate([
      { path: 'user', select: 'username profilePicture' },
      { path: 'movie', select: 'title posterPath releaseDate' }
    ]);

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
});

// Get reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ movie: movieId, isPublic: true })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ movie: movieId, isPublic: true });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get movie reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Get user's reviews
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: userId, isPublic: true })
      .populate('movie', 'title posterPath releaseDate genres')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ user: userId, isPublic: true });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Error fetching user reviews' });
  }
});

// Get current user's reviews
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: req.userId })
      .populate('movie', 'title posterPath releaseDate genres')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ user: req.userId });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Error fetching your reviews' });
  }
});

// Update a review
router.put('/:reviewId', auth, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('reviewText').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewId } = req.params;
    const updateData = req.body;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, user: req.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'user', select: 'username profilePicture' },
      { path: 'movie', select: 'title posterPath releaseDate' }
    ]);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: req.userId
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update user's movie stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'movieStats.totalMoviesWatched': -1 }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// Like/unlike a review
router.post('/:reviewId/like', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const isLiked = review.likes.includes(req.userId);

    if (isLiked) {
      review.likes.pull(req.userId);
    } else {
      review.likes.push(req.userId);
    }

    await review.save();

    res.json({
      isLiked: !isLiked,
      likeCount: review.likes.length
    });
  } catch (error) {
    console.error('Like review error:', error);
    res.status(500).json({ message: 'Error liking review' });
  }
});

// Add comment to review
router.post('/:reviewId/comments', auth, [
  body('text').isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewId } = req.params;
    const { text } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        $push: {
          comments: {
            user: req.userId,
            text
          }
        }
      },
      { new: true }
    ).populate('comments.user', 'username profilePicture');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review.comments[review.comments.length - 1]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

module.exports = router;
