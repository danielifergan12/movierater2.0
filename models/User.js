const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() {
      return !this.googleId; // Username required only if not using Google OAuth
    },
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not using Google OAuth
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 150,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  movieStats: {
    totalMoviesWatched: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    favoriteGenres: [String],
    watchStreak: { type: Number, default: 0 },
    lastWatchDate: Date
  },
  preferences: {
    favoriteGenres: [String],
    preferredLanguages: [String],
    minRating: { type: Number, default: 0 }
  },
  achievements: [{
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String
  }],
  ratings: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    posterUrl: String
  }],
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  shareCode: {
    type: String,
    unique: true,
    sparse: true
    // No default - field will be undefined (not null) if not set, which works better with sparse indexes
  },
  shareCodeCreatedAt: {
    type: Date,
    default: null
  },
  hiddenMovies: [{
    movieId: { type: String, required: true },
    hiddenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  }],
  watchlist: [{
    movieId: { type: String, required: true },
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    posterPath: String,
    releaseDate: Date,
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Hash password before saving (only if password exists and is modified)
userSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user's movie feed
userSchema.methods.getFeed = async function(limit = 20) {
  const followingIds = this.following;
  const Review = mongoose.model('Review');
  
  return Review.find({
    user: { $in: followingIds }
  })
  .populate('user', 'username profilePicture')
  .populate('movie', 'title posterPath releaseDate')
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('User', userSchema);
