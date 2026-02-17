const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's watchlist
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('watchlist');
    res.json({ watchlist: user.watchlist || [] });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ message: 'Error fetching watchlist' });
  }
});

// Add movie to watchlist
router.post('/', auth, async (req, res) => {
  try {
    const { movieId, tmdbId, title, posterPath, releaseDate } = req.body;

    if (!movieId || !tmdbId || !title) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findById(req.userId);
    
    // Check if already in watchlist
    const exists = user.watchlist.some(m => m.movieId === movieId || m.tmdbId === tmdbId);
    if (exists) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }

    user.watchlist.push({
      movieId,
      tmdbId,
      title,
      posterPath: posterPath || '',
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      addedAt: new Date()
    });

    await user.save();
    res.json({ message: 'Movie added to watchlist', watchlist: user.watchlist });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ message: 'Error adding to watchlist' });
  }
});

// Remove movie from watchlist
router.delete('/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.userId);

    user.watchlist = user.watchlist.filter(
      m => m.movieId !== movieId && m.tmdbId?.toString() !== movieId
    );

    await user.save();
    res.json({ message: 'Movie removed from watchlist', watchlist: user.watchlist });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ message: 'Error removing from watchlist' });
  }
});

// Check if movie is in watchlist
router.get('/check/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.userId).select('watchlist');
    
    const inWatchlist = user.watchlist.some(
      m => m.movieId === movieId || m.tmdbId?.toString() === movieId
    );
    
    res.json({ inWatchlist });
  } catch (error) {
    console.error('Check watchlist error:', error);
    res.status(500).json({ message: 'Error checking watchlist' });
  }
});

module.exports = router;

