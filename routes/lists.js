const express = require('express');
const { body, validationResult } = require('express-validator');
const List = require('../models/List');
const auth = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Get user's lists
router.get('/my', auth, async (req, res) => {
  try {
    const lists = await List.find({ user: req.userId })
      .sort({ updatedAt: -1 });
    res.json({ lists });
  } catch (error) {
    console.error('Get my lists error:', error);
    res.status(500).json({ message: 'Error fetching lists' });
  }
});

// Get public lists
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const lists = await List.find({ isPublic: true })
      .populate('user', 'username profilePicture')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await List.countDocuments({ isPublic: true });

    res.json({
      lists,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get public lists error:', error);
    res.status(500).json({ message: 'Error fetching public lists' });
  }
});

// Get list by ID
router.get('/:listId', async (req, res) => {
  try {
    const list = await List.findById(req.params.listId)
      .populate('user', 'username profilePicture');

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if user can view this list
    if (!list.isPublic && (!req.userId || list.user._id.toString() !== req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(list);
  } catch (error) {
    console.error('Get list error:', error);
    res.status(500).json({ message: 'Error fetching list' });
  }
});

// Get list by share code
router.get('/share/:shareCode', async (req, res) => {
  try {
    const list = await List.findOne({ shareCode: req.params.shareCode })
      .populate('user', 'username profilePicture');

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json(list);
  } catch (error) {
    console.error('Get list by share code error:', error);
    res.status(500).json({ message: 'Error fetching list' });
  }
});

// Create a list
router.post('/', auth, [
  body('name').isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPublic, tags } = req.body;

    const list = new List({
      user: req.userId,
      name,
      description: description || '',
      isPublic: isPublic !== false,
      tags: tags || [],
      movies: []
    });

    await list.save();
    res.status(201).json(list);
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ message: 'Error creating list' });
  }
});

// Update a list
router.put('/:listId', auth, [
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const list = await List.findOne({ _id: req.params.listId, user: req.userId });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const { name, description, isPublic, tags } = req.body;

    if (name !== undefined) list.name = name;
    if (description !== undefined) list.description = description;
    if (isPublic !== undefined) list.isPublic = isPublic;
    if (tags !== undefined) list.tags = tags;

    await list.save();
    res.json(list);
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ message: 'Error updating list' });
  }
});

// Delete a list
router.delete('/:listId', auth, async (req, res) => {
  try {
    const list = await List.findOneAndDelete({ _id: req.params.listId, user: req.userId });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ message: 'Error deleting list' });
  }
});

// Add movie to list
router.post('/:listId/movies', auth, [
  body('movieId').notEmpty(),
  body('tmdbId').isInt(),
  body('title').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const list = await List.findOne({ _id: req.params.listId, user: req.userId });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const { movieId, tmdbId, title, posterPath, releaseDate, note } = req.body;

    // Check if movie already in list
    const exists = list.movies.some(m => m.movieId === movieId || m.tmdbId === tmdbId);
    if (exists) {
      return res.status(400).json({ message: 'Movie already in list' });
    }

    list.movies.push({
      movieId,
      tmdbId,
      title,
      posterPath: posterPath || '',
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      note: note || '',
      addedAt: new Date()
    });

    // Update cover image if list is empty
    if (!list.coverImage && posterPath) {
      list.coverImage = posterPath;
    }

    await list.save();
    res.json(list);
  } catch (error) {
    console.error('Add movie to list error:', error);
    res.status(500).json({ message: 'Error adding movie to list' });
  }
});

// Remove movie from list
router.delete('/:listId/movies/:movieId', auth, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.listId, user: req.userId });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    list.movies = list.movies.filter(
      m => m.movieId !== req.params.movieId && m.tmdbId?.toString() !== req.params.movieId
    );

    await list.save();
    res.json(list);
  } catch (error) {
    console.error('Remove movie from list error:', error);
    res.status(500).json({ message: 'Error removing movie from list' });
  }
});

// Generate share code for list
router.post('/:listId/share', auth, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.listId, user: req.userId });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    if (!list.shareCode) {
      list.shareCode = crypto.randomBytes(8).toString('hex');
      await list.save();
    }

    res.json({ shareCode: list.shareCode, shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/list/${list.shareCode}` });
  } catch (error) {
    console.error('Generate share code error:', error);
    res.status(500).json({ message: 'Error generating share code' });
  }
});

module.exports = router;

