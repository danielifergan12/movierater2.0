const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get current user's ratings
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    console.log(`[RATINGS GET] User ID: ${userId}`);
    const user = await User.findById(userId).select('ratings');
    const ratingsCount = user?.ratings?.length || 0;
    console.log(`[RATINGS GET] Found ${ratingsCount} ratings for user ${userId}`);
    return res.json({ ratings: user?.ratings || [] });
  } catch (err) {
    console.error('[RATINGS GET] Error:', err);
    return res.status(500).json({ message: 'Error fetching ratings' });
  }
});

// Replace ratings array
router.put('/', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { ratings } = req.body;
    console.log(`[RATINGS PUT] User ID: ${userId}, Saving ${ratings?.length || 0} ratings`);
    
    if (!Array.isArray(ratings)) {
      console.error(`[RATINGS PUT] Invalid request: ratings is not an array`);
      return res.status(400).json({ message: 'ratings must be an array' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[RATINGS PUT] User not found: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove duplicates by movie ID (keep first occurrence)
    const seenIds = new Set();
    const uniqueRatings = [];
    for (const r of ratings) {
      const movieId = r.id?.toString();
      if (movieId && !seenIds.has(movieId)) {
        seenIds.add(movieId);
        uniqueRatings.push({ id: r.id, title: r.title, posterUrl: r.posterUrl });
      }
    }
    
    user.ratings = uniqueRatings;
    await user.save();
    console.log(`[RATINGS PUT] Successfully saved ${user.ratings.length} unique ratings for user ${userId}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[RATINGS PUT] Error:', err);
    return res.status(500).json({ message: 'Error saving ratings' });
  }
});

module.exports = router;


