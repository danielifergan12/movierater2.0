const express = require('express');
const Review = require('../models/Review');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get personalized feed for logged-in user
router.get('/personal', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = req.user;

    // Get reviews from users that the current user follows
    const reviews = await Review.find({
      user: { $in: user.following },
      isPublic: true
    })
    .populate('user', 'username profilePicture')
    .populate('movie', 'title posterPath releaseDate genres')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      user: { $in: user.following },
      isPublic: true
    });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get personal feed error:', error);
    res.status(500).json({ message: 'Error fetching personal feed' });
  }
});

// Get trending reviews
router.get('/trending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const reviews = await Review.find({
      isPublic: true,
      createdAt: { $gte: oneWeekAgo }
    })
    .populate('user', 'username profilePicture')
    .populate('movie', 'title posterPath releaseDate genres')
    .sort({ likes: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      isPublic: true,
      createdAt: { $gte: oneWeekAgo }
    });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get trending feed error:', error);
    res.status(500).json({ message: 'Error fetching trending feed' });
  }
});

// Get recent reviews (general feed)
router.get('/recent', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find({ isPublic: true })
      .populate('user', 'username profilePicture')
      .populate('movie', 'title posterPath releaseDate genres')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ isPublic: true });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get recent feed error:', error);
    res.status(500).json({ message: 'Error fetching recent feed' });
  }
});

// Get reviews by genre
router.get('/genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find({ isPublic: true })
      .populate({
        path: 'movie',
        match: { 'genres.name': { $regex: genre, $options: 'i' } },
        select: 'title posterPath releaseDate genres'
      })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out reviews where movie doesn't match genre
    const filteredReviews = reviews.filter(review => review.movie);

    res.json({
      reviews: filteredReviews,
      totalPages: Math.ceil(filteredReviews.length / limit),
      currentPage: page,
      total: filteredReviews.length
    });
  } catch (error) {
    console.error('Get genre feed error:', error);
    res.status(500).json({ message: 'Error fetching genre feed' });
  }
});

// Get reviews by rating
router.get('/rating/:rating', async (req, res) => {
  try {
    const { rating } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find({
      isPublic: true,
      rating: parseInt(rating)
    })
    .populate('user', 'username profilePicture')
    .populate('movie', 'title posterPath releaseDate genres')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      isPublic: true,
      rating: parseInt(rating)
    });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get rating feed error:', error);
    res.status(500).json({ message: 'Error fetching rating feed' });
  }
});

// Get feed for new users (no following yet)
router.get('/discover', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = req.user;

    // If user has no following, show popular reviews
    if (user.following.length === 0) {
      const reviews = await Review.find({ isPublic: true })
        .populate('user', 'username profilePicture')
        .populate('movie', 'title posterPath releaseDate genres')
        .sort({ likes: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Review.countDocuments({ isPublic: true });

      return res.json({
        reviews,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    }

    // Otherwise, get personal feed
    return router.get('/personal')(req, res);
  } catch (error) {
    console.error('Get discover feed error:', error);
    res.status(500).json({ message: 'Error fetching discover feed' });
  }
});

module.exports = router;
