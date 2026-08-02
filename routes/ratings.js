const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const List = require('../models/List');
const { sortListMoviesByRanking, orderChanged } = require('../utils/listRanking');

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

/** Keep every list's movie order in sync with the user's global ranking. */
const syncListsToRatings = async (userId, ratings) => {
  const lists = await List.find({ user: userId });
  await Promise.all(
    lists.map(async (list) => {
      const sorted = sortListMoviesByRanking(list.movies, ratings);
      if (!orderChanged(list.movies, sorted)) return;
      list.movies = sorted;
      await list.save();
    })
  );
};

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

    // Remove duplicates by movie ID (keep first occurrence); preserve ranking metadata
    const seenIds = new Set();
    const uniqueRatings = [];
    for (const r of ratings) {
      const movieId = r.id?.toString();
      if (movieId && !seenIds.has(movieId)) {
        seenIds.add(movieId);
        uniqueRatings.push({
          id: r.id,
          title: r.title,
          posterUrl: r.posterUrl || null,
          releaseDate: r.releaseDate || null,
          genres: r.genres || null,
          ratedAt: r.ratedAt ? new Date(r.ratedAt) : new Date(),
        });
      }
    }

    user.ratings = uniqueRatings;
    await user.save();
    console.log(`[RATINGS PUT] Successfully saved ${user.ratings.length} unique ratings for user ${userId}`);

    try {
      await syncListsToRatings(userId, user.ratings);
    } catch (syncErr) {
      console.error('[RATINGS PUT] List sync error:', syncErr);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[RATINGS PUT] Error:', err);
    return res.status(500).json({ message: 'Error saving ratings' });
  }
});

module.exports = router;
