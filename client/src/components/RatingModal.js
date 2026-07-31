import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, useMediaQuery, useTheme, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRatings } from '../hooks/useRatings';
import { useAuth } from '../contexts/AuthContext';

// Props: { movie: { id, title, posterUrl }, open, onClose, onComplete, allowRerate }
const RatingModal = ({ movie, open, onClose, onComplete, allowRerate = false }) => {
  const { rawRatings, upsertAtIndex, setRatingsArray } = useRatings();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [mid, setMid] = useState(null);
  const [firstTime, setFirstTime] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRerating, setIsRerating] = useState(false);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  // Store filtered ratings when rerating to ensure movie is always excluded
  const [filteredRatings, setFilteredRatings] = useState(null);

  // Helper function to save current state to history
  const saveToHistory = (currentCompareTarget) => {
    if (mid != null && currentCompareTarget) {
      setComparisonHistory(prev => [...prev, { low, high, mid, compareTarget: { ...currentCompareTarget } }]);
    }
  };

  // Helper function to restore state from history
  const restoreFromHistory = () => {
    if (comparisonHistory.length > 0) {
      const lastState = comparisonHistory[comparisonHistory.length - 1];
      setLow(lastState.low);
      setHigh(lastState.high);
      setMid(lastState.mid);
      setComparisonHistory(prev => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      setFirstTime(false);
      setMid(null);
      setLow(0);
      setHigh(0);
      setIsRerating(false);
      setComparisonHistory([]);
      setFilteredRatings(null);
      return;
    }
    
    // If not authenticated, redirect to login and close modal
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      onClose && onClose();
      return;
    }
    
    // Check if this movie is already rated
    // Use string comparison to handle ID type mismatches
    const movieIdStr = String(movie.id);
    const alreadyRatedIndex = rawRatings.findIndex(r => String(r.id) === movieIdStr);
    const alreadyRated = alreadyRatedIndex !== -1;
    
    if (alreadyRated && !allowRerate) {
      // Movie already rated and re-rating not allowed, close modal
      onClose && onClose();
      return;
    }
    
    // If re-rating, remove the movie from ratings first
    // Use robust string comparison to handle ID type mismatches
    let ratingsToUse = rawRatings;
    
    if (alreadyRated && allowRerate) {
      setIsRerating(true);
      // Filter out the movie being reranked using string comparison
      const updatedRatings = rawRatings.filter(r => {
        const rIdStr = String(r.id);
        return rIdStr !== movieIdStr;
      });
      // Store filtered ratings locally to ensure we always use them
      // Don't update global state during reranking - only use local filteredRatings
      setFilteredRatings(updatedRatings);
      ratingsToUse = updatedRatings; // Use filtered array for calculations
    } else {
      // Not rerating, clear filtered ratings
      setIsRerating(false);
      setFilteredRatings(null);
    }

    // Determine if it's first time based on ratings length (after potential removal)
    const currentRatingsLength = ratingsToUse.length;
      
    if (currentRatingsLength === 0) {
      setFirstTime(true);
      setIsInitialized(true);
    } else {
      setFirstTime(false);
      setLow(0);
      setHigh(currentRatingsLength - 1);
      // Only initialize after filteredRatings is set when rerating
      if (alreadyRated && allowRerate) {
        // Wait for filteredRatings to be set - it will be available in next render
        // The second useEffect will wait for filteredRatings before running
        setIsInitialized(true);
      } else {
        setIsInitialized(true);
      }
    }
  }, [open, rawRatings, movie.id, onClose, allowRerate]);

  useEffect(() => {
    if (!open || !isInitialized || firstTime) return;
    
    // If rerating, wait for filteredRatings to be ready before proceeding
    if (isRerating && !filteredRatings) {
      return; // Don't calculate comparisons yet - wait for filteredRatings
    }
    
    // Get current ratings - always filter out the movie being reranked to prevent self-comparison
    // Use robust ID comparison to handle string/number mismatches
    // When rerating, use the filtered ratings we stored; otherwise filter on the fly
    const movieIdStr = String(movie.id);
    const currentRatings = isRerating && filteredRatings 
      ? filteredRatings  // Use pre-filtered ratings when rerating - never fall back to rawRatings
      : rawRatings.filter(r => {
          const rIdStr = String(r.id);
          return rIdStr !== movieIdStr;
        });
    
    if (currentRatings.length === 0) {
      // No other movies to compare against, just insert at position 0
      const updated = upsertAtIndex(movie, 0);
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }
    
    // Adjust high if it's out of bounds for the filtered array
    const adjustedHigh = Math.min(high, currentRatings.length - 1);
    const adjustedLow = Math.min(low, currentRatings.length - 1);
    
    if (adjustedLow > adjustedHigh) {
      const insertAt = adjustedLow;
      // If re-rating, the movie is already removed, so we can just insert
      const updated = upsertAtIndex(movie, insertAt);
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }
    
    const nextMid = Math.floor((adjustedLow + adjustedHigh) / 2);
    
    // Ensure nextMid is within bounds
    if (nextMid < 0 || nextMid >= currentRatings.length) {
      // Out of bounds, just insert at the end
      const updated = upsertAtIndex(movie, currentRatings.length);
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }
    
    // Robust safety check: ensure we're not comparing against the same movie
    // Find the next valid comparison target if nextMid points to the same movie
    let validMid = nextMid;
    const movieIdStrCheck = String(movie.id);
    
    // Check if the calculated mid points to the same movie
    const midRating = currentRatings[validMid];
    const midRatingIdStr = midRating ? String(midRating.id) : '';
    
    if (midRatingIdStr === movieIdStrCheck) {
      // Try to find a valid position by searching nearby positions
      let found = false;
      const maxSearch = Math.max(currentRatings.length, 10);
      
      // First, try positions after nextMid
      for (let i = nextMid + 1; i < currentRatings.length && i < nextMid + maxSearch; i++) {
        const ratingIdStr = String(currentRatings[i]?.id || '');
        if (ratingIdStr !== movieIdStrCheck) {
          validMid = i;
          found = true;
          break;
        }
      }
      
      // If not found, try positions before nextMid
      if (!found) {
        for (let i = nextMid - 1; i >= 0 && i > nextMid - maxSearch; i--) {
          const ratingIdStr = String(currentRatings[i]?.id || '');
          if (ratingIdStr !== movieIdStrCheck) {
            validMid = i;
            found = true;
            break;
          }
        }
      }
      
      // If still no valid position found, search the entire array
      if (!found) {
        for (let i = 0; i < currentRatings.length; i++) {
          const ratingIdStr = String(currentRatings[i]?.id || '');
          if (ratingIdStr !== movieIdStrCheck) {
            validMid = i;
            found = true;
            break;
          }
        }
      }
      
      // If no valid comparison target exists (shouldn't happen, but handle gracefully)
      if (!found) {
        // No other movies to compare, just insert at this position
        const updated = upsertAtIndex(movie, nextMid);
        onComplete && onComplete(updated);
        onClose && onClose();
        return;
      }
    }
    
    // Final safety check: ensure validMid is within bounds and doesn't match the movie
    if (validMid >= 0 && validMid < currentRatings.length) {
      const finalRating = currentRatings[validMid];
      const finalRatingIdStr = String(finalRating?.id || '');
      if (finalRatingIdStr !== movieIdStrCheck) {
        setMid(validMid);
      } else {
        // Still matches somehow - find any other movie
        const otherIndex = currentRatings.findIndex(r => String(r.id) !== movieIdStrCheck);
        if (otherIndex >= 0) {
          setMid(otherIndex);
        } else {
          // No other movies, just complete
          const updated = upsertAtIndex(movie, currentRatings.length);
          onComplete && onComplete(updated);
          onClose && onClose();
        }
      }
    } else {
      // Fallback: if somehow we still have an invalid mid, just complete the rating
      const updated = upsertAtIndex(movie, Math.min(nextMid, currentRatings.length));
      onComplete && onComplete(updated);
      onClose && onClose();
    }
  }, [low, high, open, isInitialized, rawRatings, filteredRatings, firstTime, movie, upsertAtIndex, onComplete, onClose, isRerating]);

  const compareTarget = useMemo(() => {
    if (mid == null) return null;
    
    // If rerating but filteredRatings not ready yet, return null to prevent rendering
    if (isRerating && !filteredRatings) {
      return null;
    }
    
    // Get current ratings (always filter out the movie being reranked to prevent self-comparison)
    // Use robust string comparison to handle ID type mismatches
    // When rerating, use the filtered ratings we stored; otherwise filter on the fly
    const movieIdStr = String(movie.id);
    const currentRatings = isRerating && filteredRatings 
      ? filteredRatings  // Use pre-filtered ratings when rerating - never fall back to rawRatings
      : rawRatings.filter(r => {
          const rIdStr = String(r.id);
          return rIdStr !== movieIdStr;
        });
    
    // Ensure mid is within valid bounds
    if (mid < 0 || mid >= currentRatings.length) {
      return null;
    }
    
    const target = currentRatings[mid];
    
    // Multiple safety checks: ensure target exists and is not the same movie
    if (!target) {
      return null;
    }
    
    // Critical check: if somehow the target is the same movie, return null to avoid comparison
    // Use string comparison to handle type mismatches
    const targetIdStr = String(target.id);
    if (movieIdStr === targetIdStr) {
      return null;
    }
    
    return target;
  }, [mid, rawRatings, filteredRatings, isRerating, movie.id]);

  // Effect to handle when compareTarget becomes null - find a new valid target or complete
  // Use a ref to prevent infinite loops
  const handlingNullTargetRef = useRef(false);
  
  useEffect(() => {
    if (!open || !isInitialized || firstTime || mid == null) {
      handlingNullTargetRef.current = false;
      return;
    }
    
    // If rerating but filteredRatings not ready, don't handle null compareTarget yet
    // Wait for filteredRatings to be set first
    if (isRerating && !filteredRatings) {
      return; // Don't complete prematurely - wait for filteredRatings
    }
    
    // If compareTarget is null and we haven't already handled it, find a valid comparison or complete
    if (!compareTarget && !handlingNullTargetRef.current) {
      handlingNullTargetRef.current = true;
      
      const movieIdStr = String(movie.id);
      const currentRatings = isRerating && filteredRatings 
        ? filteredRatings  // Use pre-filtered ratings when rerating - never fall back to rawRatings
        : rawRatings.filter(r => {
            const rIdStr = String(r.id);
            return rIdStr !== movieIdStr;
          });
      
      if (currentRatings.length === 0) {
        // No other movies, just insert at position 0
        const updated = upsertAtIndex(movie, 0);
        onComplete && onComplete(updated);
        onClose && onClose();
        return;
      }
      
      // Try to find a valid comparison target
      // Search for any movie that's not the same
      const validIndex = currentRatings.findIndex(r => String(r.id) !== movieIdStr);
      
      if (validIndex >= 0) {
        // Found a valid target, update mid to point to it
        setMid(validIndex);
        // Reset the ref after a short delay to allow state to update
        setTimeout(() => {
          handlingNullTargetRef.current = false;
        }, 100);
      } else {
        // No valid comparison target found, complete the rating
        const insertAt = Math.min(mid, currentRatings.length);
        const updated = upsertAtIndex(movie, insertAt);
        onComplete && onComplete(updated);
        onClose && onClose();
      }
    } else if (compareTarget) {
      // Reset the ref when we have a valid target
      handlingNullTargetRef.current = false;
    }
  }, [compareTarget, open, isInitialized, firstTime, mid, rawRatings, filteredRatings, isRerating, movie, upsertAtIndex, onComplete, onClose]);

  if (!open || !movie || !isInitialized) {
    return null;
  }

  const getWorkingRatings = () => {
    const movieIdStr = String(movie.id);
    return isRerating && filteredRatings
      ? filteredRatings
      : rawRatings.filter((r) => String(r.id) !== movieIdStr);
  };

  const completeAt = (insertAt) => {
    const currentRatings = getWorkingRatings();
    const updated = upsertAtIndex(movie, Math.min(insertAt, currentRatings.length));
    onComplete && onComplete(updated);
    onClose && onClose();
  };

  const preferNew = () => {
    if (!compareTarget) {
      completeAt(mid != null && mid >= 0 ? mid : 0);
      return;
    }
    const movieIdStr = String(movie.id);
    if (movieIdStr === String(compareTarget.id)) {
      const currentRatings = getWorkingRatings();
      if (currentRatings.length === 0) {
        completeAt(0);
        return;
      }
      const validIndex = currentRatings.findIndex((r) => String(r.id) !== movieIdStr);
      if (validIndex >= 0) setMid(validIndex);
      return;
    }
    saveToHistory(compareTarget);
    setHigh(mid - 1);
  };

  const preferExisting = () => {
    if (!compareTarget) {
      completeAt(mid != null && mid >= 0 ? mid : 0);
      return;
    }
    const movieIdStr = String(movie.id);
    if (movieIdStr === String(compareTarget.id)) {
      const currentRatings = getWorkingRatings();
      if (currentRatings.length === 0) {
        completeAt(0);
        return;
      }
      const validIndex = currentRatings.findIndex((r) => String(r.id) !== movieIdStr);
      if (validIndex >= 0) setMid(validIndex);
      return;
    }
    saveToHistory(compareTarget);
    setLow(mid + 1);
  };

  const skipComparison = () => {
    if (low > high) {
      completeAt(low);
    } else if (mid != null) {
      completeAt(mid);
    } else {
      completeAt(low);
    }
  };

  const pickPosterSx = {
    width: { xs: 112, sm: 132 },
    flex: '0 0 auto',
    cursor: 'pointer',
    borderRadius: 1,
    overflow: 'hidden',
    border: '1px solid rgba(244, 239, 230, 0.14)',
    backgroundColor: 'rgba(244, 239, 230, 0.04)',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
    '&:hover': {
      borderColor: 'rgba(212, 160, 23, 0.55)',
      transform: { xs: 'none', sm: 'translateY(-2px)' },
    },
    '&:active': { transform: 'scale(0.98)' },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(12,11,10,0.97)',
          border: '1px solid rgba(244, 239, 230, 0.12)',
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '100dvh', sm: '85vh' },
          overflow: 'auto',
          borderRadius: { xs: 0, sm: 2 },
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 2.5 } }}>
        {!firstTime && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, minHeight: 36 }}>
            <IconButton
              onClick={restoreFromHistory}
              disabled={comparisonHistory.length === 0}
              size="small"
              sx={{
                color: comparisonHistory.length > 0 ? 'var(--rl-accent)' : 'rgba(244, 239, 230, 0.25)',
                '&:hover': {
                  backgroundColor: comparisonHistory.length > 0 ? 'rgba(212, 160, 23, 0.1)' : 'transparent',
                },
              }}
              title="Go back to previous comparison"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            {comparisonHistory.length > 0 && (
              <Typography sx={{ color: 'rgba(244, 239, 230, 0.5)', ml: 0.5, fontSize: '0.75rem' }}>
                {comparisonHistory.length} back
              </Typography>
            )}
          </Box>
        )}

        {firstTime ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '1.75rem',
                letterSpacing: '0.04em',
                color: 'var(--rl-cream)',
                lineHeight: 1,
                mb: 0.75,
              }}
            >
              Baseline
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.875rem', mb: 2.5, maxWidth: 280, mx: 'auto' }}>
              Set “{movie.title}” as your first ranked film.
            </Typography>
            <Box
              sx={{
                width: 132,
                mx: 'auto',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid rgba(244, 239, 230, 0.14)',
              }}
            >
              <Box
                component="img"
                src={movie.posterUrl || '/placeholder-movie.jpg'}
                alt={movie.title}
                sx={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', display: 'block' }}
              />
            </Box>
            <Button
              variant="contained"
              onClick={() => completeAt(0)}
              sx={{
                mt: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                backgroundColor: 'var(--rl-accent)',
                color: 'var(--rl-ink)',
                '&:hover': { backgroundColor: 'var(--rl-accent-hover)' },
              }}
            >
              Set as baseline
            </Button>
          </Box>
        ) : !compareTarget ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.9rem' }}>
              Finding a comparison…
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: { xs: '1.6rem', sm: '1.85rem' },
                letterSpacing: '0.04em',
                color: 'var(--rl-cream)',
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {isRerating ? 'Which ranks higher?' : 'Which do you prefer?'}
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.8rem', mb: 2.5 }}>
              Tap the one you like more
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: { xs: 1.25, sm: 2 },
              }}
            >
              <Box onClick={preferNew} sx={pickPosterSx}>
                <Box
                  component="img"
                  src={movie.posterUrl || '/placeholder-movie.jpg'}
                  alt={movie.title}
                  sx={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', display: 'block' }}
                />
                <Typography
                  sx={{
                    px: 0.75,
                    py: 0.75,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--rl-cream)',
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {movie.title}
                </Typography>
              </Box>

              <Typography
                sx={{
                  alignSelf: 'center',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '1.1rem',
                  letterSpacing: '0.08em',
                  color: 'rgba(244, 239, 230, 0.35)',
                  pt: 4,
                }}
              >
                VS
              </Typography>

              <Box onClick={preferExisting} sx={pickPosterSx}>
                <Box
                  component="img"
                  src={compareTarget?.posterUrl || '/placeholder-movie.jpg'}
                  alt={compareTarget?.title}
                  sx={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', display: 'block' }}
                />
                <Typography
                  sx={{
                    px: 0.75,
                    py: 0.75,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--rl-cream)',
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {compareTarget?.title}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="text"
              onClick={skipComparison}
              sx={{
                mt: 2.5,
                textTransform: 'none',
                fontSize: '0.8rem',
                color: 'rgba(244, 239, 230, 0.5)',
                '&:hover': { color: 'var(--rl-cream)', backgroundColor: 'rgba(244, 239, 230, 0.06)' },
              }}
            >
              Can’t decide
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;


