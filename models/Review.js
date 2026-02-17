const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  photos: [{
    url: String,
    publicId: String,
    caption: String
  }],
  isWatched: {
    type: Boolean,
    default: true
  },
  watchDate: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'excited', 'scared', 'romantic', 'action-packed', 'thoughtful', 'funny', 'dramatic', 'relaxing']
  }
}, {
  timestamps: true
});

// Indexes for performance
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ movie: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isPublic: 1, createdAt: -1 });

// Update movie stats when review is saved
reviewSchema.post('save', async function() {
  const Movie = mongoose.model('Movie');
  await Movie.updateStats(this.movie);
});

// Update movie stats when review is deleted
reviewSchema.post('deleteOne', async function() {
  const Movie = mongoose.model('Movie');
  await Movie.updateStats(this.movie);
});

// Get reviews for a user's feed
reviewSchema.statics.getFeedReviews = function(userId, limit = 20, skip = 0) {
  return this.find({ isPublic: true })
    .populate('user', 'username profilePicture')
    .populate('movie', 'title posterPath releaseDate genres')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Get trending reviews
reviewSchema.statics.getTrendingReviews = function(limit = 20) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return this.find({
    isPublic: true,
    createdAt: { $gte: oneWeekAgo }
  })
  .populate('user', 'username profilePicture')
  .populate('movie', 'title posterPath releaseDate genres')
  .sort({ likes: -1, createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Review', reviewSchema);
