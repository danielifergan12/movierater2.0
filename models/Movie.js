const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  overview: {
    type: String,
    default: ''
  },
  releaseDate: {
    type: Date
  },
  posterPath: {
    type: String,
    default: ''
  },
  backdropPath: {
    type: String,
    default: ''
  },
  genres: [{
    id: Number,
    name: String
  }],
  runtime: {
    type: Number,
    default: 0
  },
  voteAverage: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  },
  adult: {
    type: Boolean,
    default: false
  },
  originalLanguage: {
    type: String,
    default: 'en'
  },
  originalTitle: {
    type: String,
    default: ''
  },
  imdbId: {
    type: String,
    default: null
  },
  imdbRating: {
    type: Number,
    default: null
  },
  // Our app's aggregated data
  appStats: {
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalWatches: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0 }
  },
  // Cache for quick access
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for search
movieSchema.index({ title: 'text', overview: 'text' });
movieSchema.index({ genres: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ 'appStats.trendingScore': -1 });

// Update app stats when reviews change
movieSchema.statics.updateStats = async function(movieId) {
  const Review = mongoose.model('Review');
  
  const stats = await Review.aggregate([
    { $match: { movie: mongoose.Types.ObjectId(movieId) } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        totalWatches: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(movieId, {
      'appStats.totalReviews': stats[0].totalReviews,
      'appStats.averageRating': Math.round(stats[0].averageRating * 10) / 10,
      'appStats.totalWatches': stats[0].totalWatches,
      lastUpdated: new Date()
    });
  }
};

module.exports = mongoose.model('Movie', movieSchema);
