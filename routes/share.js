const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Generate or retrieve share code for authenticated user
router.post('/generate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user already has a share code, return it
    if (user.shareCode) {
      // Get frontend URL from environment variable, request origin, or default to localhost
      // Priority: 1. FRONTEND_URL env var, 2. Request origin (if not localhost), 3. Referer origin, 4. localhost
      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        if (req.headers.origin && !req.headers.origin.includes('localhost')) {
          frontendUrl = req.headers.origin;
        } else if (req.headers.referer) {
          try {
            frontendUrl = new URL(req.headers.referer).origin;
          } catch (e) {
            frontendUrl = 'http://localhost:3000';
          }
        } else {
          frontendUrl = 'http://localhost:3000';
        }
      }
      const shareUrl = `${frontendUrl}/share/${user.shareCode}`;
      
      return res.json({
        shareCode: user.shareCode,
        shareUrl: shareUrl
      });
    }

    // Generate a unique 8-character share code
    let shareCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate 4 random bytes and convert to hex (8 characters)
      shareCode = crypto.randomBytes(4).toString('hex');
      
      // Check if code already exists
      const existingUser = await User.findOne({ shareCode });
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: 'Failed to generate unique share code' });
    }

    // Save share code to user
    user.shareCode = shareCode;
    user.shareCodeCreatedAt = new Date();
    await user.save();

    // Get frontend URL from environment variable, request origin, or default to localhost
    // Priority: 1. FRONTEND_URL env var, 2. Request origin (if not localhost), 3. Referer origin, 4. localhost
    let frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      if (req.headers.origin && !req.headers.origin.includes('localhost')) {
        frontendUrl = req.headers.origin;
      } else if (req.headers.referer) {
        try {
          frontendUrl = new URL(req.headers.referer).origin;
        } catch (e) {
          frontendUrl = 'http://localhost:3000';
        }
      } else {
        frontendUrl = 'http://localhost:3000';
      }
    }
    const shareUrl = `${frontendUrl}/share/${shareCode}`;

    res.json({
      shareCode: shareCode,
      shareUrl: shareUrl
    });
  } catch (error) {
    console.error('Generate share code error:', error);
    res.status(500).json({ message: 'Error generating share code' });
  }
});

// Get shared rankings by share code (public endpoint)
router.get('/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params;

    if (!shareCode || shareCode.length !== 8) {
      return res.status(400).json({ message: 'Invalid share code format' });
    }

    const user = await User.findOne({ shareCode }).select('username ratings');

    if (!user) {
      return res.status(404).json({ message: 'Share link not found' });
    }

    // Return username and ratings (even if empty)
    res.json({
      username: user.username || 'Anonymous',
      ratings: user.ratings || []
    });
  } catch (error) {
    console.error('Get shared rankings error:', error);
    res.status(500).json({ message: 'Error fetching shared rankings' });
  }
});

module.exports = router;

