import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
  const [high, setHigh] = useState(-1);
  const [mid, setMid] = useState(null);
  const [firstTime, setFirstTime] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRerating, setIsRerating] = useState(false);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  const [filteredRatings, setFilteredRatings] = useState(null);
  const sessionKeyRef = useRef(null);
  const completingRef = useRef(false);

  const finish = useCallback(
    (insertAt, listForBounds) => {
      if (completingRef.current) return;
      completingRef.current = true;
      const max = listForBounds?.length ?? rawRatings.length;
      const index = Math.max(0, Math.min(insertAt, max));
      const updated = upsertAtIndex(movie, index);
      onComplete && onComplete(updated);
      onClose && onClose();
    },
    [movie, onClose, onComplete, rawRatings.length, upsertAtIndex]
  );

  const getCompareList = useCallback(() => {
    const movieIdStr = String(movie.id);
    if (isRerating && filteredRatings) return filteredRatings;
    return rawRatings.filter((r) => String(r.id) !== movieIdStr);
  }, [filteredRatings, isRerating, movie.id, rawRatings]);

  useEffect(() => {
    if (!open) {
      sessionKeyRef.current = null;
      completingRef.current = false;
      setIsInitialized(false);
      setFirstTime(false);
      setMid(null);
      setLow(0);
      setHigh(-1);
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

    if (!movie?.id) return;

    const movieIdStr = String(movie.id);
    const alreadyRatedIndex = rawRatings.findIndex((r) => String(r.id) === movieIdStr);
    const alreadyRated = alreadyRatedIndex !== -1;

    if (alreadyRated && !allowRerate) {
      onClose && onClose();
      return;
    }

    let ratingsToUse = rawRatings;
    if (alreadyRated && allowRerate) {
      ratingsToUse = rawRatings.filter((r) => String(r.id) !== movieIdStr);
    }

    const sessionKey = `${movieIdStr}:${allowRerate ? 'rerate' : 'rate'}`;
    const alreadyInited = sessionKeyRef.current === sessionKey && isInitialized;

    // Don't reset an in-progress comparison when parent re-renders.
    // Only recover if we incorrectly started as "first time" before ratings hydrated.
    if (alreadyInited) {
      if (!(firstTime && ratingsToUse.length > 0)) {
        return;
      }
    }

    if (alreadyRated && allowRerate) {
      setIsRerating(true);
      setFilteredRatings(ratingsToUse);
    } else {
      setIsRerating(false);
      setFilteredRatings(null);
    }

    sessionKeyRef.current = sessionKey;
    completingRef.current = false;
    setComparisonHistory([]);
    setMid(null);

    if (ratingsToUse.length === 0) {
      setFirstTime(true);
      setLow(0);
      setHigh(-1);
      setIsInitialized(true);
      return;
    }

    setFirstTime(false);
    setLow(0);
    setHigh(ratingsToUse.length - 1);
    setIsInitialized(true);
  }, [open, rawRatings, movie?.id, onClose, allowRerate, isAuthenticated, isInitialized, firstTime]);
  // Drive binary search / insertion from low/high
  useEffect(() => {
    if (!open || !isInitialized || firstTime || completingRef.current) return;

    const currentRatings = getCompareList();
    if (currentRatings.length === 0) {
      finish(0, currentRatings);
      return;
    }

    // Search exhausted → insert at `low` (valid range: 0..length)
    if (low > high) {
      finish(low, currentRatings);
      return;
    }

    const nextMid = Math.floor((low + high) / 2);
    if (nextMid < 0 || nextMid >= currentRatings.length) {
      finish(Math.max(0, Math.min(low, currentRatings.length)), currentRatings);
      return;
    }

    const movieIdStr = String(movie.id);
    if (String(currentRatings[nextMid]?.id) === movieIdStr) {
      // Should not happen after filtering, but recover gracefully
      const otherIndex = currentRatings.findIndex((r) => String(r.id) !== movieIdStr);
      if (otherIndex >= 0) {
        setMid(otherIndex);
      } else {
        finish(currentRatings.length, currentRatings);
      }
      return;
    }

    if (mid !== nextMid) {
      setMid(nextMid);
    }
  }, [low, high, open, isInitialized, firstTime, getCompareList, finish, movie.id, mid]);

  const compareTarget = useMemo(() => {
    if (mid == null || firstTime) return null;
    const currentRatings = getCompareList();
    if (mid < 0 || mid >= currentRatings.length) return null;
    const target = currentRatings[mid];
    if (!target || String(target.id) === String(movie.id)) return null;
    return target;
  }, [mid, firstTime, getCompareList, movie.id]);

  const saveToHistory = () => {
    if (mid == null || !compareTarget) return;
    setComparisonHistory((prev) => [...prev, { low, high, mid }]);
  };

  const restoreFromHistory = () => {
    if (comparisonHistory.length === 0) return;
    const last = comparisonHistory[comparisonHistory.length - 1];
    setLow(last.low);
    setHigh(last.high);
    setMid(last.mid);
    setComparisonHistory((prev) => prev.slice(0, -1));
  };

  const pickNewBetter = () => {
    if (completingRef.current || mid == null) return;
    saveToHistory();
    // New movie ranks above mid → search left half
    setHigh(mid - 1);
  };

  const pickCompareBetter = () => {
    if (completingRef.current || mid == null) return;
    saveToHistory();
    // Compare target ranks above new movie → search right half
    setLow(mid + 1);
  };

  const skipDecide = () => {
    if (completingRef.current) return;
    const currentRatings = getCompareList();
    const insertAt = mid != null ? mid : Math.max(0, low);
    finish(insertAt, currentRatings);
  };

  if (!open || !movie || !isInitialized) {
    return null;
  }

  const MoviePick = ({ title, posterUrl, onPick }) => (
    <Box
      component="button"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPick();
      }}
      sx={{
        flex: '1 1 0',
        maxWidth: { xs: '46%', sm: 168 },
        cursor: 'pointer',
        outline: 'none',
        border: 'none',
        background: 'transparent',
        p: 0,
        m: 0,
        font: 'inherit',
        color: 'inherit',
        textAlign: 'center',
        WebkitTapHighlightColor: 'transparent',
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
          pointerEvents: 'none',
        }}
      >
        <Box
          component="img"
          src={posterUrl || '/placeholder-movie.jpg'}
          alt=""
          draggable={false}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
        />
      </Box>
      <Typography
        className="title"
        component="span"
        sx={{
          display: '-webkit-box',
          mt: 1,
          textAlign: 'center',
          color: 'var(--rl-cream)',
          fontWeight: 600,
          fontSize: { xs: '0.72rem', sm: '0.82rem' },
          lineHeight: 1.3,
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'color 0.15s ease',
          pointerEvents: 'none',
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
                onClick={() => finish(0, [])}
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
                  pointerEvents: 'none',
                }}
              >
                VS
              </Typography>
              <MoviePick
                title={compareTarget.title}
                posterUrl={compareTarget.posterUrl}
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
