import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, Card, CardMedia, CardContent, useMediaQuery, useTheme, IconButton } from '@mui/material';
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
        {/* Go Back Button - only show during comparisons */}
        {!firstTime && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <IconButton
              onClick={restoreFromHistory}
              disabled={comparisonHistory.length === 0}
              sx={{
                color: comparisonHistory.length > 0 ? '#00d4ff' : 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: comparisonHistory.length > 0 ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              }}
              title="Go back to previous comparison"
            >
              <ArrowBackIcon />
            </IconButton>
            {comparisonHistory.length > 0 && (
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                ml: 1,
                display: 'flex',
                alignItems: 'center'
              }}>
                {comparisonHistory.length} step{comparisonHistory.length !== 1 ? 's' : ''} back
              </Typography>
            )}
          </Box>
        )}
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
        ) : !compareTarget ? (
          // Loading state while finding a valid comparison target
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Finding a comparison...
            </Typography>
          </Box>
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
                  // Safety check: ensure we have a valid comparison target
                  if (!compareTarget) {
                    // If no valid target, try to complete the rating
                    const movieIdStr = String(movie.id);
                    const currentRatings = isRerating && filteredRatings 
                      ? filteredRatings
                      : rawRatings.filter(r => String(r.id) !== movieIdStr);
                    const insertAt = mid != null && mid >= 0 ? mid : 0;
                    const updated = upsertAtIndex(movie, Math.min(insertAt, currentRatings.length));
                    onComplete && onComplete(updated);
                    onClose && onClose();
                    return;
                  }
                  
                  // Additional check: ensure it's not the same movie
                  const movieIdStr = String(movie.id);
                  const targetIdStr = String(compareTarget.id);
                  if (movieIdStr === targetIdStr) {
                    // Same movie - find a different one or complete
                    const currentRatings = isRerating && filteredRatings 
                      ? filteredRatings
                      : rawRatings.filter(r => String(r.id) !== movieIdStr);
                    if (currentRatings.length === 0) {
                      const updated = upsertAtIndex(movie, 0);
                      onComplete && onComplete(updated);
                      onClose && onClose();
                    } else {
                      // Find a different comparison target
                      const validIndex = currentRatings.findIndex(r => String(r.id) !== movieIdStr);
                      if (validIndex >= 0) {
                        setMid(validIndex);
                      }
                    }
                    return;
                  }
                  
                  // Save to history before making choice
                  saveToHistory(compareTarget);
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
                  // Safety check: ensure we have a valid comparison target
                  if (!compareTarget) {
                    // If no valid target, try to complete the rating
                    const movieIdStr = String(movie.id);
                    const currentRatings = isRerating && filteredRatings 
                      ? filteredRatings
                      : rawRatings.filter(r => String(r.id) !== movieIdStr);
                    const insertAt = mid != null && mid >= 0 ? mid : 0;
                    const updated = upsertAtIndex(movie, Math.min(insertAt, currentRatings.length));
                    onComplete && onComplete(updated);
                    onClose && onClose();
                    return;
                  }
                  
                  // Additional check: ensure it's not the same movie
                  const movieIdStr = String(movie.id);
                  const targetIdStr = String(compareTarget.id);
                  if (movieIdStr === targetIdStr) {
                    // Same movie - find a different one or complete
                    const currentRatings = isRerating && filteredRatings 
                      ? filteredRatings
                      : rawRatings.filter(r => String(r.id) !== movieIdStr);
                    if (currentRatings.length === 0) {
                      const updated = upsertAtIndex(movie, 0);
                      onComplete && onComplete(updated);
                      onClose && onClose();
                    } else {
                      // Find a different comparison target
                      const validIndex = currentRatings.findIndex(r => String(r.id) !== movieIdStr);
                      if (validIndex >= 0) {
                        setMid(validIndex);
                      }
                    }
                    return;
                  }
                  
                  // Save to history before making choice
                  saveToHistory(compareTarget);
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, width: '100%' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  // Skip current comparison - treat as equal and place at current mid position
                  // This effectively skips to the next step in the binary search
                  const currentRatings = isRerating && filteredRatings 
                    ? filteredRatings
                    : rawRatings;
                  
                  if (low > high) {
                    // Already at insertion point, just insert
                    const insertAt = low;
                    const updated = upsertAtIndex(movie, insertAt);
                    onComplete && onComplete(updated);
                    onClose && onClose();
                  } else if (mid != null) {
                    // Place at current mid position (treating as equal)
                    // This will trigger the next comparison or completion
                    const insertAt = mid;
                    const updated = upsertAtIndex(movie, insertAt);
                    onComplete && onComplete(updated);
                    onClose && onClose();
                  } else {
                    // Fallback: insert at low
                    const insertAt = low;
                    const updated = upsertAtIndex(movie, insertAt);
                    onComplete && onComplete(updated);
                    onClose && onClose();
                  }
                }}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { xs: 'auto', sm: 200 },
                  maxWidth: { xs: '100%', sm: 400 },
                  py: { xs: 1.5, sm: 1.25 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                I Can't Decide
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;


