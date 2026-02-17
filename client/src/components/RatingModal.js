import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, Card, CardMedia, CardContent, useMediaQuery, useTheme } from '@mui/material';
import { useRatings } from '../hooks/useRatings';

// Props: { movie: { id, title, posterUrl }, open, onClose, onComplete, allowRerate }
const RatingModal = ({ movie, open, onClose, onComplete, allowRerate = false }) => {
  const { rawRatings, upsertAtIndex, setRatingsArray } = useRatings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [mid, setMid] = useState(null);
  const [firstTime, setFirstTime] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRerating, setIsRerating] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      setFirstTime(false);
      setMid(null);
      setLow(0);
      setHigh(0);
      setIsRerating(false);
      return;
    }
    
    // Check if this movie is already rated
    const alreadyRatedIndex = rawRatings.findIndex(r => r.id === movie.id);
    const alreadyRated = alreadyRatedIndex !== -1;
    
    if (alreadyRated && !allowRerate) {
      // Movie already rated and re-rating not allowed, close modal
      onClose && onClose();
      return;
    }
    
    // If re-rating, remove the movie from ratings first
    if (alreadyRated && allowRerate) {
      setIsRerating(true);
      const updatedRatings = rawRatings.filter(r => r.id !== movie.id);
      setRatingsArray(updatedRatings);
    }

    // Determine if it's first time based on ratings length (after potential removal)
    const currentRatingsLength = alreadyRated && allowRerate 
      ? rawRatings.length - 1 
      : rawRatings.length;
      
    if (currentRatingsLength === 0) {
      setFirstTime(true);
      setIsInitialized(true);
    } else {
      setFirstTime(false);
      setLow(0);
      setHigh(currentRatingsLength - 1);
      setIsInitialized(true);
    }
  }, [open, rawRatings, movie.id, onClose, allowRerate, setRatingsArray]);

  useEffect(() => {
    if (!open || !isInitialized || firstTime) return;
    
    // Get current ratings (exclude the movie being re-rated if applicable)
    const currentRatings = isRerating 
      ? rawRatings.filter(r => r.id !== movie.id)
      : rawRatings;
    
    if (currentRatings.length === 0) return;
    
    if (low > high) {
      const insertAt = low;
      // If re-rating, the movie is already removed, so we can just insert
      const updated = upsertAtIndex(movie, insertAt);
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }
    const nextMid = Math.floor((low + high) / 2);
    setMid(nextMid);
  }, [low, high, open, isInitialized, rawRatings.length, firstTime, movie, upsertAtIndex, onComplete, onClose, isRerating]);

  const compareTarget = useMemo(() => {
    if (mid == null) return null;
    // Get current ratings (may have been modified for re-rating)
    const currentRatings = isRerating 
      ? rawRatings.filter(r => r.id !== movie.id)
      : rawRatings;
    return currentRatings[mid] || null;
  }, [mid, rawRatings, isRerating, movie.id]);

  if (!open || !movie || !isInitialized) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      fullScreen={isMobile}
      PaperProps={{ 
        sx: { 
          backgroundColor: 'rgba(26,26,26,0.95)', 
          backdropFilter: 'blur(20px)', 
          border: '1px solid rgba(0, 212, 255, 0.2)',
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: '95vh', sm: '90vh' },
          overflow: 'auto'
        } 
      }}
    >
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                  py: { xs: 1.75, sm: 1.5 },
                  fontSize: { xs: '1rem', sm: '1rem' },
                  minHeight: { xs: 52, sm: 48 },
                  fontWeight: 600
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
                {isRerating ? 'Rerate: Which do you prefer?' : 'Which do you prefer?'}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {isRerating 
                  ? 'Click on the movie you like better to update your rating'
                  : 'Click on the movie you like better'
                }
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1.5, sm: 3 }, 
              justifyContent: 'center', 
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <Card 
                sx={{ 
                  maxWidth: { xs: 'calc(50% - 0.75rem)', sm: 240 },
                  width: { xs: 'calc(50% - 0.75rem)', sm: 'auto' },
                  flex: { xs: '1 1 calc(50% - 0.75rem)', sm: 'none' },
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: { xs: 200, sm: 'auto' },
                  '&:active': {
                    transform: { xs: 'scale(0.98)', sm: 'none' },
                  },
                  '&:hover': {
                    transform: { xs: 'none', sm: 'scale(1.05)' },
                    boxShadow: { xs: 'none', sm: '0 8px 24px rgba(0, 212, 255, 0.4)' },
                    border: { xs: '2px solid rgba(0, 212, 255, 0.4)', sm: '2px solid rgba(0, 212, 255, 0.6)' },
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
                  height={{ xs: 250, sm: 340 }} 
                  image={movie.posterUrl || '/placeholder-movie.jpg'} 
                  alt={movie.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: { xs: 2, sm: 2 } }}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1rem' },
                    textAlign: 'center'
                  }}>
                    {movie.title}
                  </Typography>
                </CardContent>
              </Card>
              <Card 
                sx={{ 
                  maxWidth: { xs: 'calc(50% - 0.75rem)', sm: 240 },
                  width: { xs: 'calc(50% - 0.75rem)', sm: 'auto' },
                  flex: { xs: '1 1 calc(50% - 0.75rem)', sm: 'none' },
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: { xs: 200, sm: 'auto' },
                  '&:active': {
                    transform: { xs: 'scale(0.98)', sm: 'none' },
                  },
                  '&:hover': {
                    transform: { xs: 'none', sm: 'scale(1.05)' },
                    boxShadow: { xs: 'none', sm: '0 8px 24px rgba(0, 212, 255, 0.4)' },
                    border: { xs: '2px solid rgba(0, 212, 255, 0.4)', sm: '2px solid rgba(0, 212, 255, 0.6)' },
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
                  height={{ xs: 250, sm: 340 }} 
                  image={compareTarget?.posterUrl || '/placeholder-movie.jpg'} 
                  alt={compareTarget?.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: { xs: 2, sm: 2 } }}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1rem' },
                    textAlign: 'center'
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


