import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, Card, CardMedia, CardContent } from '@mui/material';
import { useRatings } from '../hooks/useRatings';

// Props: { movie: { id, title, posterUrl }, open, onClose, onComplete }
const RatingModal = ({ movie, open, onClose, onComplete }) => {
  const { rawRatings, upsertAtIndex } = useRatings();

  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [mid, setMid] = useState(null);
  const [firstTime, setFirstTime] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      setFirstTime(false);
      setMid(null);
      setLow(0);
      setHigh(0);
      return;
    }
    
    // Check if this movie is already rated
    const alreadyRated = rawRatings.some(r => r.id === movie.id);
    if (alreadyRated) {
      // Movie already rated, close modal
      onClose && onClose();
      return;
    }

    // Determine if it's first time based on ratings length
    // Only set firstTime if we truly have no ratings
    if (rawRatings.length === 0) {
      setFirstTime(true);
      setIsInitialized(true);
    } else {
      setFirstTime(false);
      setLow(0);
      setHigh(rawRatings.length - 1);
      setIsInitialized(true);
    }
  }, [open, rawRatings, movie.id, onClose]);

  useEffect(() => {
    if (!open || !isInitialized || rawRatings.length === 0 || firstTime) return;
    if (low > high) {
      const insertAt = low;
      const updated = upsertAtIndex(movie, insertAt);
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }
    const nextMid = Math.floor((low + high) / 2);
    setMid(nextMid);
  }, [low, high, open, isInitialized, rawRatings.length, firstTime, movie, upsertAtIndex, onComplete, onClose]);

  const compareTarget = useMemo(() => {
    if (mid == null) return null;
    return rawRatings[mid] || null;
  }, [mid, rawRatings]);

  if (!open || !movie || !isInitialized) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      PaperProps={{ sx: { backgroundColor: 'rgba(26,26,26,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0, 212, 255, 0.2)' } }}
    >
      <DialogContent>
        {firstTime ? (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                First Movie Baseline
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Set "{movie.title}" as your baseline (score 10).
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card sx={{ maxWidth: { xs: '100%', sm: 240 }, width: { xs: '100%', sm: 'auto' } }}>
                <CardMedia 
                  component="img" 
                  height={{ xs: 300, sm: 340 }} 
                  image={movie.posterUrl || '/placeholder-movie.jpg'} 
                  alt={movie.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="subtitle1" noWrap sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    {movie.title}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => {
                  const updated = upsertAtIndex(movie, 0);
                  onComplete && onComplete(updated);
                  onClose && onClose();
                }}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Set as Baseline
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Which do you prefer?
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Click on the movie you like better
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 2, sm: 3 }, 
              justifyContent: 'center', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center'
            }}>
              <Card 
                sx={{ 
                  maxWidth: { xs: '100%', sm: 240 },
                  width: { xs: '100%', sm: 'auto' },
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'scale(1.05)' },
                    boxShadow: { xs: 'none', sm: '0 8px 24px rgba(0, 212, 255, 0.4)' },
                    border: { xs: '2px solid transparent', sm: '2px solid rgba(0, 212, 255, 0.6)' },
                  },
                  border: '2px solid transparent',
                }}
                onClick={() => {
                  // New movie is better (higher in ranking)
                  setHigh(mid - 1);
                }}
              >
                <CardMedia 
                  component="img" 
                  height={{ xs: 300, sm: 340 }} 
                  image={movie.posterUrl || '/placeholder-movie.jpg'} 
                  alt={movie.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="subtitle1" noWrap sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    {movie.title}
                  </Typography>
                </CardContent>
              </Card>
              <Card 
                sx={{ 
                  maxWidth: { xs: '100%', sm: 240 },
                  width: { xs: '100%', sm: 'auto' },
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'scale(1.05)' },
                    boxShadow: { xs: 'none', sm: '0 8px 24px rgba(0, 212, 255, 0.4)' },
                    border: { xs: '2px solid transparent', sm: '2px solid rgba(0, 212, 255, 0.6)' },
                  },
                  border: '2px solid transparent',
                }}
                onClick={() => {
                  // Compare target is better (lower in ranking)
                  setLow(mid + 1);
                }}
              >
                <CardMedia 
                  component="img" 
                  height={{ xs: 300, sm: 340 }} 
                  image={compareTarget?.posterUrl || '/placeholder-movie.jpg'} 
                  alt={compareTarget?.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="subtitle1" noWrap sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    {compareTarget?.title}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;


