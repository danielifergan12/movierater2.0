const express = require('express');
const User = require('../models/User');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

const router = express.Router();

// Discover users - get users with ratings, ordered by rating count
// Must be before /:userId route to avoid route conflicts
router.get('/discover', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Use aggregation to sort by ratings array length
    const users = await User.aggregate([
      {
        $match: {
          $expr: { $gt: [{ $size: { $ifNull: ['$ratings', []] } }, 0] }
        }
      },
      {
        $addFields: {
          ratingsCount: { $size: { $ifNull: ['$ratings', []] } }
        }
      },
      {
        $sort: { ratingsCount: -1 }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit * 1
      },
      {
        $project: {
          _id: 1,
          username: 1,
          profilePicture: 1,
          bio: 1,
          followers: 1,
          following: 1,
          ratingsCount: 1
        }
      }
    ]);

    // Get total count of users with ratings
    const total = await User.countDocuments({
      $expr: { $gt: [{ $size: { $ifNull: ['$ratings', []] } }, 0] }
    });

    // Format response
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers || [],
      following: user.following || [],
      ratingsCount: user.ratingsCount || 0
    }));

    res.json({
      users: formattedUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Discover users error:', error);
    res.status(500).json({ message: 'Error fetching discover users' });
  }
});

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's recent reviews
    const recentReviews = await Review.find({ user: userId, isPublic: true })
      .populate('movie', 'title posterPath releaseDate')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      user,
      recentReviews
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Follow/Unfollow user
router.post('/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.userId.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.userId);
    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.userId, {
        $pull: { following: userId }
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: req.userId }
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.userId, {
        $push: { following: userId }
      });
      await User.findByIdAndUpdate(userId, {
        $push: { followers: req.userId }
      });
    }

    res.json({
      isFollowing: !isFollowing,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Error following user' });
  }
});

// Get user's followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username profilePicture bio',
        options: {
          limit: limit * 1,
          skip: (page - 1) * limit
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = await User.findById(userId).then(u => u.followers.length);

    res.json({
      followers: user.followers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Error fetching followers' });
  }
});

// Get user's following
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username profilePicture bio',
        options: {
          limit: limit * 1,
          skip: (page - 1) * limit
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = await User.findById(userId).then(u => u.following.length);

    res.json({
      following: user.following,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Error fetching following' });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username profilePicture bio followers following')
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    });

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get rankings from all users you follow (protected)
router.get('/following/rankings', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select('following');
    
    if (!currentUser || !currentUser.following || currentUser.following.length === 0) {
      return res.json({
        rankings: []
      });
    }

    // Get all followed users with their rankings and followers count
    const followedUsers = await User.find({
      _id: { $in: currentUser.following }
    }).select('username profilePicture ratings followers');

    // Format response with user info and their rankings
    const rankings = followedUsers
      .filter(user => user.ratings && user.ratings.length > 0)
      .map(user => ({
        userId: user._id,
        username: user.username || 'Anonymous',
        profilePicture: user.profilePicture || '',
        followersCount: user.followers?.length || 0,
        ratings: user.ratings || []
      }));

    res.json({
      rankings: rankings
    });
  } catch (error) {
    console.error('Get following rankings error:', error);
    res.status(500).json({ message: 'Error fetching following rankings' });
  }
});

// Get user's public rankings
router.get('/:userId/rankings', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('username ratings');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return username and ratings (even if empty)
    res.json({
      username: user.username || 'Anonymous',
      ratings: user.ratings || []
    });
  } catch (error) {
    console.error('Get user rankings error:', error);
    res.status(500).json({ message: 'Error fetching user rankings' });
  }
});

// Get user's movie stats
// Get total rankings count across all users (must be before /:userId route)
router.get('/stats/total-rankings', async (req, res) => {
  try {
    // Aggregate to count total ratings across all users
    const result = await User.aggregate([
      {
        $project: {
          ratingsCount: { $size: { $ifNull: ['$ratings', []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalRankings: { $sum: '$ratingsCount' }
        }
      }
    ]);
    
    const totalRankings = result.length > 0 ? result[0].totalRankings : 0;
    
    res.json({ totalRankings });
  } catch (error) {
    console.error('Get total rankings error:', error);
    res.status(500).json({ message: 'Error fetching total rankings', totalRankings: 0 });
  }
});

router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('movieStats');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get additional stats from reviews
    const reviewStats = await Review.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          favoriteGenres: { $push: '$movie' }
        }
      }
    ]);

    // Get favorite genres from movie data
    const favoriteGenres = await Review.aggregate([
      { $match: { user: user._id } },
      { $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movieData'
      }},
      { $unwind: '$movieData' },
      { $unwind: '$movieData.genres' },
      { $group: {
        _id: '$movieData.genres.name',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      movieStats: user.movieStats,
      reviewStats: reviewStats[0] || {},
      favoriteGenres
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Error fetching user stats' });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { favoriteGenres, preferredLanguages, minRating } = req.body;

    const updateData = {};
    if (favoriteGenres) updateData['preferences.favoriteGenres'] = favoriteGenres;
    if (preferredLanguages) updateData['preferences.preferredLanguages'] = preferredLanguages;
    if (minRating !== undefined) updateData['preferences.minRating'] = minRating;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
});

// Admin route: Get all users (only for danielifergan)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Check if the current user is danielifergan
    const currentUser = await User.findById(req.userId).select('username');
    
    if (!currentUser || currentUser.username !== 'danielifergan') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { page = 1, limit = 50 } = req.query;
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments();

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get all users (admin) error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Admin route: Delete user (only for danielifergan)
router.delete('/admin/:userId', auth, async (req, res) => {
  try {
    // Check if the current user is danielifergan
    const currentUser = await User.findById(req.userId).select('username');
    
    if (!currentUser || currentUser.username !== 'danielifergan') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.userId.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all reviews by this user
    await Review.deleteMany({ user: userId });

    // Remove user from all followers' following lists
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );

    // Remove user from all following users' followers lists
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user (admin) error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;
