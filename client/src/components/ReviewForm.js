import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import api from '../config/axios';

const MOODS = ['happy', 'sad', 'excited', 'scared', 'romantic', 'action-packed', 'thoughtful', 'funny', 'dramatic', 'relaxing'];

const ReviewForm = ({ open, onClose, movie, onComplete, existingReview = null }) => {
  const [rating, setRating] = useState(existingReview?.rating || 3);
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
  const [mood, setMood] = useState(existingReview?.mood || '');
  const [tags, setTags] = useState(existingReview?.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!movie?.id) {
      setError('Movie information is missing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reviewData = {
        movieId: movie.id,
        rating,
        reviewText: reviewText.trim(),
        mood: mood || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      };

      if (existingReview) {
        // Update existing review
        await api.put(`/api/reviews/${existingReview._id}`, reviewData);
      } else {
        // Create new review
        await api.post('/api/reviews', reviewData);
      }

      onComplete && onComplete();
      handleClose();
    } catch (error) {
      console.error('Error saving review:', error);
      setError(error.response?.data?.message || 'Error saving review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(3);
    setReviewText('');
    setMood('');
    setTags('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 4,
        }
      }}
    >
      <DialogTitle sx={{ color: '#ffffff' }}>
        {existingReview ? 'Edit Review' : 'Write a Review'}
      </DialogTitle>
      <DialogContent>
        {movie && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={movie.posterUrl || '/placeholder-movie.jpg'}
              alt={movie.title}
              sx={{
                width: 60,
                height: 90,
                objectFit: 'cover',
                borderRadius: 1,
              }}
            />
            <Typography variant="h6" sx={{ color: '#ffffff' }}>
              {movie.title}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ color: '#ffffff', mb: 1 }}>
            Rating
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => {
              if (newValue !== null) {
                setRating(newValue);
              }
            }}
            max={5}
            size="large"
            sx={{
              '& .MuiRating-iconFilled': {
                color: '#ff6b35',
              },
              '& .MuiRating-iconEmpty': {
                color: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={6}
          label="Your Review"
          placeholder="Share your thoughts about this movie..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 212, 255, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00d4ff',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#00d4ff',
            },
          }}
          inputProps={{ maxLength: 1000 }}
          helperText={`${reviewText.length}/1000 characters`}
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Mood (Optional)</InputLabel>
          <Select
            value={mood}
            label="Mood (Optional)"
            onChange={(e) => setMood(e.target.value)}
            sx={{
              color: '#ffffff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 212, 255, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00d4ff',
              },
            }}
          >
            <MenuItem value="">None</MenuItem>
            {MOODS.map((m) => (
              <MenuItem key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1).replace('-', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Tags (comma-separated)"
          placeholder="e.g., must-watch, classic, underrated"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 212, 255, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00d4ff',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#00d4ff',
            },
          }}
        />

        {error && (
          <Typography variant="body2" sx={{ color: '#ff6b35', mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
          }}
        >
          {loading ? <CircularProgress size={24} /> : existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewForm;

