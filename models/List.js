const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  movies: [{
    movieId: { type: String, required: true },
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    posterPath: String,
    releaseDate: Date,
    addedAt: { type: Date, default: Date.now },
    note: String // Optional note about why this movie is in the list
  }],
  tags: [String],
  coverImage: String, // URL to cover image (could be first movie's poster)
  shareCode: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes for performance
listSchema.index({ user: 1, createdAt: -1 });
listSchema.index({ isPublic: 1, createdAt: -1 });
listSchema.index({ shareCode: 1 });

module.exports = mongoose.model('List', listSchema);

