import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Dialog, DialogContent, Box, Typography, Button, useMediaQuery, useTheme, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Close as CloseIcon } from '@mui/icons-material';
import { useRatings } from '../hooks/useRatings';
import { useAuth } from '../contexts/AuthContext';

// Props: { movie: { id, title, posterUrl }, open, onClose, onComplete, allowRerate }
const RatingModal = ({ movie, open, onClose, onComplete, allowRerate = false }) => {
  const { rawRatings, upsertAtIndex } = useRatings();
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
  const [filteredRatings, setFilteredRatings] = useState(null);

  const saveToHistory = (currentCompareTarget) => {
    if (mid != null && currentCompareTarget) {
      setComparisonHistory((prev) => [...prev, { low, high, mid, compareTarget: { ...currentCompareTarget } }]);
    }
  };

  const restoreFromHistory = () => {
    if (comparisonHistory.length > 0) {
      const lastState = comparisonHistory[comparisonHistory.length - 1];
      setLow(lastState.low);
      setHigh(lastState.high);
      setMid(lastState.mid);
      setComparisonHistory((prev) => prev.slice(0, -1));
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

    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      onClose && onClose();
      return;
    }

    const movieIdStr = String(movie.id);
    const alreadyRatedIndex = rawRatings.findIndex((r) => String(r.id) === movieIdStr);
    const alreadyRated = alreadyRatedIndex !== -1;

    if (alreadyRated && !allowRerate) {
      onClose && onClose();
      return;
    }

    let ratingsToUse = rawRatings;

    if (alreadyRated && allowRerate) {
      setIsRerating(true);
      const updatedRatings = rawRatings.filter((r) => String(r.id) !== movieIdStr);
      setFilteredRatings(updatedRatings);
      ratingsToUse = updatedRatings;
    } else {
      setIsRerating(false);
      setFilteredRatings(null);
    }

    const currentRatingsLength = ratingsToUse.length;

    if (currentRatingsLength === 0) {
      setFirstTime(true);
      setIsInitialized(true);
    } else {
      setFirstTime(false);
      setLow(0);
      setHigh(currentRatingsLength - 1);
      setIsInitialized(true);
    }
  }, [open, rawRatings, movie.id, onClose, allowRerate, isAuthenticated]);

  useEffect(() => {
    if (!open || !isInitialized || firstTime) return;

    if (isRerating && !filteredRatings) {
      return;
    }

    const movieIdStr = String(movie.id);
    const currentRatings =
      isRerating && filteredRatings
        ? filteredRatings
        : rawRatings.filter((r) => String(r.id) !== movieIdStr);

    if (currentRatings.length === 0) {
      const updated = upsertAtIndex(movie, 0);
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }

    const adjustedHigh = Math.min(high, currentRatings.length - 1);
    const adjustedLow = Math.min(low, currentRatings.length - 1);

    if (adjustedLow > adjustedHigh) {
      const updated = upsertAtIndex(movie, adjustedLow);
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }

    const nextMid = Math.floor((adjustedLow + adjustedHigh) / 2);

    if (nextMid < 0 || nextMid >= currentRatings.length) {
      const updated = upsertAtIndex(movie, currentRatings.length);
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }

    let validMid = nextMid;
    const movieIdStrCheck = String(movie.id);
    const midRating = currentRatings[validMid];
    const midRatingIdStr = midRating ? String(midRating.id) : '';

    if (midRatingIdStr === movieIdStrCheck) {
      let found = false;
      const maxSearch = Math.max(currentRatings.length, 10);

      for (let i = nextMid + 1; i < currentRatings.length && i < nextMid + maxSearch; i++) {
        if (String(currentRatings[i]?.id || '') !== movieIdStrCheck) {
          validMid = i;
          found = true;
          break;
        }
      }

      if (!found) {
        for (let i = nextMid - 1; i >= 0 && i > nextMid - maxSearch; i--) {
          if (String(currentRatings[i]?.id || '') !== movieIdStrCheck) {
            validMid = i;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        for (let i = 0; i < currentRatings.length; i++) {
          if (String(currentRatings[i]?.id || '') !== movieIdStrCheck) {
            validMid = i;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        const updated = upsertAtIndex(movie, nextMid);
        onComplete && onComplete(updated);
        onClose && onClose();
        return;
      }
    }

    if (validMid >= 0 && validMid < currentRatings.length) {
      const finalRating = currentRatings[validMid];
      if (String(finalRating?.id || '') !== movieIdStrCheck) {
        setMid(validMid);
      } else {
        const otherIndex = currentRatings.findIndex((r) => String(r.id) !== movieIdStrCheck);
        if (otherIndex >= 0) {
          setMid(otherIndex);
        } else {
          const updated = upsertAtIndex(movie, currentRatings.length);
          onComplete && onComplete(updated);
          onClose && onClose();
        }
      }
    } else {
      const updated = upsertAtIndex(movie, Math.min(nextMid, currentRatings.length));
      onComplete && onComplete(updated);
      onClose && onClose();
    }
  }, [low, high, open, isInitialized, rawRatings, filteredRatings, firstTime, movie, upsertAtIndex, onComplete, onClose, isRerating]);

  const compareTarget = useMemo(() => {
    if (mid == null) return null;
    if (isRerating && !filteredRatings) return null;

    const movieIdStr = String(movie.id);
    const currentRatings =
      isRerating && filteredRatings
        ? filteredRatings
        : rawRatings.filter((r) => String(r.id) !== movieIdStr);

    if (mid < 0 || mid >= currentRatings.length) return null;

    const target = currentRatings[mid];
    if (!target) return null;
    if (movieIdStr === String(target.id)) return null;

    return target;
  }, [mid, rawRatings, filteredRatings, isRerating, movie.id]);

  const handlingNullTargetRef = useRef(false);

  useEffect(() => {
    if (!open || !isInitialized || firstTime || mid == null) {
      handlingNullTargetRef.current = false;
      return;
    }

    if (isRerating && !filteredRatings) return;

    if (!compareTarget && !handlingNullTargetRef.current) {
      handlingNullTargetRef.current = true;

      const movieIdStr = String(movie.id);
      const currentRatings =
        isRerating && filteredRatings
          ? filteredRatings
          : rawRatings.filter((r) => String(r.id) !== movieIdStr);

      if (currentRatings.length === 0) {
        const updated = upsertAtIndex(movie, 0);
        onComplete && onComplete(updated);
        onClose && onClose();
        return;
      }

      const validIndex = currentRatings.findIndex((r) => String(r.id) !== movieIdStr);

      if (validIndex >= 0) {
        setMid(validIndex);
        setTimeout(() => {
          handlingNullTargetRef.current = false;
        }, 100);
      } else {
        const updated = upsertAtIndex(movie, Math.min(mid, currentRatings.length));
        onComplete && onComplete(updated);
        onClose && onClose();
      }
    } else if (compareTarget) {
      handlingNullTargetRef.current = false;
    }
  }, [compareTarget, open, isInitialized, firstTime, mid, rawRatings, filteredRatings, isRerating, movie, upsertAtIndex, onComplete, onClose]);

  const pickNewBetter = () => {
    if (!compareTarget) {
      const movieIdStr = String(movie.id);
      const currentRatings =
        isRerating && filteredRatings
          ? filteredRatings
          : rawRatings.filter((r) => String(r.id) !== movieIdStr);
      const insertAt = mid != null && mid >= 0 ? mid : 0;
      const updated = upsertAtIndex(movie, Math.min(insertAt, currentRatings.length));
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }

    const movieIdStr = String(movie.id);
    if (movieIdStr === String(compareTarget.id)) {
      const currentRatings =
        isRerating && filteredRatings
          ? filteredRatings
          : rawRatings.filter((r) => String(r.id) !== movieIdStr);
      if (currentRatings.length === 0) {
        const updated = upsertAtIndex(movie, 0);
        onComplete && onComplete(updated);
        onClose && onClose();
      } else {
        const validIndex = currentRatings.findIndex((r) => String(r.id) !== movieIdStr);
        if (validIndex >= 0) setMid(validIndex);
      }
      return;
    }

    saveToHistory(compareTarget);
    setHigh(mid - 1);
  };

  const pickCompareBetter = () => {
    if (!compareTarget) {
      const movieIdStr = String(movie.id);
      const currentRatings =
        isRerating && filteredRatings
          ? filteredRatings
          : rawRatings.filter((r) => String(r.id) !== movieIdStr);
      const insertAt = mid != null && mid >= 0 ? mid : 0;
      const updated = upsertAtIndex(movie, Math.min(insertAt, currentRatings.length));
      onComplete && onComplete(updated);
      onClose && onClose();
      return;
    }

    const movieIdStr = String(movie.id);
    if (movieIdStr === String(compareTarget.id)) {
      const currentRatings =
        isRerating && filteredRatings
          ? filteredRatings
          : rawRatings.filter((r) => String(r.id) !== movieIdStr);
      if (currentRatings.length === 0) {
        const updated = upsertAtIndex(movie, 0);
        onComplete && onComplete(updated);
        onClose && onClose();
      } else {
        const validIndex = currentRatings.findIndex((r) => String(r.id) !== movieIdStr);
        if (validIndex >= 0) setMid(validIndex);
      }
      return;
    }

    saveToHistory(compareTarget);
    setLow(mid + 1);
  };

  const skipDecide = () => {
    if (low > high) {
      const updated = upsertAtIndex(movie, low);
      onComplete && onComplete(updated);
      onClose && onClose();
    } else if (mid != null) {
      const updated = upsertAtIndex(movie, mid);
      onComplete && onComplete(updated);
      onClose && onClose();
    } else {
      const updated = upsertAtIndex(movie, low);
      onComplete && onComplete(updated);
      onClose && onClose();
    }
  };

  if (!open || !movie || !isInitialized) {
    return null;
  }

  const MoviePick = ({ title, posterUrl, onPick }) => (
    <Box
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick();
        }
      }}
      sx={{
        flex: '1 1 0',
        maxWidth: { xs: '46%', sm: 168 },
        cursor: 'pointer',
        outline: 'none',
        transition: 'transform 0.15s ease',
        '&:hover .poster': {
          borderColor: 'rgba(212, 160, 23, 0.7)',
          boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
        },
        '&:hover .title': { color: 'var(--rl-accent)' },
        '&:active': { transform: { xs: 'scale(0.98)', sm: 'none' } },
        '&:focus-visible .poster': {
          borderColor: 'var(--rl-accent)',
        },
      }}
    >
      <Box
        className="poster"
        sx={{
          aspectRatio: '2 / 3',
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid rgba(244, 239, 230, 0.14)',
          backgroundColor: 'rgba(244, 239, 230, 0.04)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <Box
          component="img"
          src={posterUrl || '/placeholder-movie.jpg'}
          alt={title}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </Box>
      <Typography
        className="title"
        sx={{
          mt: 1,
          textAlign: 'center',
          color: 'var(--rl-cream)',
          fontWeight: 600,
          fontSize: { xs: '0.72rem', sm: '0.82rem' },
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'color 0.15s ease',
        }}
      >
        {title}
      </Typography>
    </Box>
  );

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
          border: '1px solid rgba(244, 239, 230, 0.1)',
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '100dvh', sm: 'min(88vh, 640px)' },
          overflow: 'auto',
          borderRadius: { xs: 0, sm: 1.5 },
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        },
      }}
    >
      <DialogContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 2.5 },
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, minHeight: 36 }}>
          {!firstTime ? (
            <IconButton
              onClick={restoreFromHistory}
              disabled={comparisonHistory.length === 0}
              size="small"
              sx={{
                color: comparisonHistory.length > 0 ? 'var(--rl-cream)' : 'rgba(244,239,230,0.25)',
                mr: 0.5,
                '&:hover': {
                  backgroundColor: comparisonHistory.length > 0 ? 'rgba(244,239,230,0.06)' : 'transparent',
                },
              }}
              title="Go back"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          ) : (
            <Box sx={{ width: 34 }} />
          )}

          <Typography
            sx={{
              flex: 1,
              textAlign: 'center',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: { xs: '1.35rem', sm: '1.5rem' },
              letterSpacing: '0.04em',
              color: 'var(--rl-cream)',
              lineHeight: 1,
            }}
          >
            {firstTime ? 'Your first film' : isRerating ? 'Re-rank' : 'Which is better?'}
          </Typography>

          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'var(--rl-muted)',
              '&:hover': { backgroundColor: 'rgba(244,239,230,0.06)', color: 'var(--rl-cream)' },
            }}
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {firstTime ? (
          <>
            <Typography
              sx={{
                textAlign: 'center',
                color: 'var(--rl-muted)',
                fontSize: '0.85rem',
                mb: 2.5,
                px: 1,
              }}
            >
              Set “{movie.title}” as your ranking baseline.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
              <Box sx={{ width: { xs: 140, sm: 156 } }}>
                <Box
                  sx={{
                    aspectRatio: '2 / 3',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid rgba(244, 239, 230, 0.14)',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.4)',
                  }}
                >
                  <Box
                    component="img"
                    src={movie.posterUrl || '/placeholder-movie.jpg'}
                    alt={movie.title}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => {
                  const updated = upsertAtIndex(movie, 0);
                  onComplete && onComplete(updated);
                  onClose && onClose();
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  borderRadius: 1,
                  backgroundImage: 'none',
                  backgroundColor: 'var(--rl-accent)',
                  color: 'var(--rl-ink)',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: 'var(--rl-accent-hover)', boxShadow: 'none' },
                }}
              >
                Set as baseline
              </Button>
            </Box>
          </>
        ) : !compareTarget ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.9rem' }}>
              Finding a comparison…
            </Typography>
          </Box>
        ) : (
          <>
            <Typography
              sx={{
                textAlign: 'center',
                color: 'var(--rl-muted)',
                fontSize: '0.8rem',
                mb: 2,
              }}
            >
              Tap the one you prefer
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: { xs: 1.25, sm: 2 },
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <MoviePick title={movie.title} posterUrl={movie.posterUrl} onPick={pickNewBetter} />
              <Typography
                sx={{
                  alignSelf: 'center',
                  color: 'rgba(244,239,230,0.35)',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '1rem',
                  letterSpacing: '0.06em',
                  pt: { xs: 6, sm: 8 },
                  flexShrink: 0,
                }}
              >
                VS
              </Typography>
              <MoviePick
                title={compareTarget?.title}
                posterUrl={compareTarget?.posterUrl}
                onPick={pickCompareBetter}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
              <Button
                onClick={skipDecide}
                sx={{
                  textTransform: 'none',
                  color: 'var(--rl-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  px: 1.5,
                  '&:hover': {
                    color: 'var(--rl-cream)',
                    backgroundColor: 'rgba(244,239,230,0.05)',
                  },
                }}
              >
                Can&apos;t decide
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;
