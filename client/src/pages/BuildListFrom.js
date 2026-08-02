import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  SkipNext as SkipIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import api from '../config/axios';

const posterUrl = (pathOrUrl) => {
  if (!pathOrUrl) return '/placeholder-movie.jpg';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `https://image.tmdb.org/t/p/w500${pathOrUrl}`;
};

const toPosterPath = (pathOrUrl) => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) {
    return pathOrUrl.replace('https://image.tmdb.org/t/p/w500', '').replace('https://image.tmdb.org/t/p/w780', '');
  }
  return pathOrUrl;
};

const normalizeFromRanking = (r) => ({
  movieId: String(r.id),
  tmdbId: Number(r.id),
  title: r.title,
  posterPath: toPosterPath(r.posterUrl),
  releaseDate: r.releaseDate || null,
  posterDisplay: posterUrl(r.posterUrl),
});

const normalizeFromListMovie = (m) => ({
  movieId: String(m.movieId || m.tmdbId),
  tmdbId: Number(m.tmdbId || m.movieId),
  title: m.title,
  posterPath: m.posterPath || '',
  releaseDate: m.releaseDate || null,
  posterDisplay: posterUrl(m.posterPath),
});

/**
 * Build a new list by walking My Rankings (or another list) one movie at a time.
 * Steps: setup → review (add/skip) → done.
 */
const BuildListFrom = () => {
  const { isAuthenticated } = useAuth();
  const { rawRatings } = useRatings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetSource = searchParams.get('source'); // 'rankings' | listId

  const [step, setStep] = useState('setup'); // setup | review | done
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [sourceKey, setSourceKey] = useState(presetSource && presetSource !== 'rankings' ? presetSource : 'rankings');
  const [myLists, setMyLists] = useState([]);
  const [movies, setMovies] = useState([]);
  const [listId, setListId] = useState(null);
  const [index, setIndex] = useState(0);
  const [addedCount, setAddedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [listsLoading, setListsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/lists/from');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/lists/my');
        if (!cancelled) setMyLists(res.data.lists || []);
      } catch (e) {
        console.error('Error loading lists:', e);
      } finally {
        if (!cancelled) setListsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceOptions = useMemo(() => {
    const opts = [{ value: 'rankings', label: `My Rankings (${rawRatings.length})` }];
    myLists.forEach((l) => {
      opts.push({
        value: l._id,
        label: `${l.name} (${l.movies?.length || 0})`,
      });
    });
    return opts;
  }, [myLists, rawRatings.length]);

  const current = movies[index] || null;
  const progress = movies.length ? Math.min(100, (index / movies.length) * 100) : 0;

  const loadSourceMovies = async (key) => {
    if (key === 'rankings') {
      return rawRatings.map(normalizeFromRanking).filter((m) => m.movieId && m.title);
    }
    const res = await api.get(`/api/lists/${key}`);
    return (res.data.movies || []).map(normalizeFromListMovie).filter((m) => m.movieId && m.title);
  };

  const startReview = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('List name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const pool = await loadSourceMovies(sourceKey);
      if (pool.length === 0) {
        setError('That source has no movies yet. Rank some films or pick another list.');
        setLoading(false);
        return;
      }

      const created = await api.post('/api/lists', {
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });

      setListId(created.data._id);
      setMovies(pool);
      setIndex(0);
      setAddedCount(0);
      setSkippedCount(0);
      setStep('review');
    } catch (err) {
      console.error('Error starting list build:', err);
      setError(err.response?.data?.message || 'Could not start. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const finish = () => {
    if (listId) navigate(`/list/${listId}`);
    else navigate('/lists');
  };

  const advance = (didAdd) => {
    const next = index + 1;
    if (didAdd) setAddedCount((c) => c + 1);
    else setSkippedCount((c) => c + 1);

    if (next >= movies.length) {
      setIndex(next);
      setStep('done');
      return;
    }
    setIndex(next);
  };

  const handleAdd = async () => {
    if (!current || !listId || acting) return;
    setActing(true);
    setError('');
    try {
      await api.post(`/api/lists/${listId}/movies`, {
        movieId: current.movieId,
        tmdbId: current.tmdbId,
        title: current.title,
        posterPath: current.posterPath,
        releaseDate: current.releaseDate,
      });
      advance(true);
    } catch (err) {
      // Already in list — treat as added and move on
      if (err.response?.status === 400 && /already/i.test(err.response?.data?.message || '')) {
        advance(true);
      } else {
        console.error('Error adding movie:', err);
        setError(err.response?.data?.message || 'Could not add movie.');
      }
    } finally {
      setActing(false);
    }
  };

  const handleSkip = () => {
    if (acting) return;
    advance(false);
  };

  if (!isAuthenticated) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0c0b0a',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 50% 40% at 50% 20%, rgba(212, 160, 23, 0.12) 0%, transparent 60%),
            linear-gradient(180deg, #12100e 0%, #0c0b0a 55%, #090807 100%)
          `,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 520,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 5 },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {step === 'setup' && (
          <>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: { xs: '2.2rem', sm: '2.8rem' },
                letterSpacing: '0.04em',
                color: 'var(--rl-cream)',
                lineHeight: 1,
                mb: 1,
              }}
            >
              From your list
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', mb: 3.5, fontSize: '0.95rem' }}>
              Name a new list, then go through your movies one by one — add or skip.
            </Typography>

            <Box component="form" onSubmit={startReview} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="New list name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                inputProps={{ maxLength: 100 }}
                sx={fieldSx}
              />
              <TextField
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                inputProps={{ maxLength: 500 }}
                sx={fieldSx}
              />
              <TextField
                select
                label="Walk through"
                value={sourceKey}
                onChange={(e) => setSourceKey(e.target.value)}
                fullWidth
                disabled={listsLoading}
                sx={fieldSx}
              >
                {sourceOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--rl-accent)' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: 'var(--rl-accent)',
                      },
                    }}
                  />
                }
                label="Public list"
                sx={{ color: 'var(--rl-cream)', ml: 0 }}
              />

              {error && (
                <Typography sx={{ color: '#e07050', fontSize: '0.9rem' }}>{error}</Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                <Button
                  component={Link}
                  to="/lists"
                  variant="outlined"
                  sx={{
                    textTransform: 'none',
                    borderColor: 'rgba(244,239,230,0.25)',
                    color: 'var(--rl-muted)',
                    '&:hover': { borderColor: 'var(--rl-cream)', color: 'var(--rl-cream)' },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || listsLoading}
                  sx={{
                    flex: 1,
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: 'var(--rl-accent)',
                    color: '#0c0b0a',
                    '&:hover': { bgcolor: '#e0b020' },
                  }}
                >
                  {loading ? <CircularProgress size={22} sx={{ color: '#0c0b0a' }} /> : 'Start picking'}
                </Button>
              </Box>
            </Box>
          </>
        )}

        {step === 'review' && current && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography
                sx={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '1.6rem',
                  letterSpacing: '0.04em',
                  color: 'var(--rl-cream)',
                }}
              >
                {name}
              </Typography>
              <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem' }}>
                {index + 1} / {movies.length}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                mb: 3,
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(244,239,230,0.08)',
                '& .MuiLinearProgress-bar': { bgcolor: 'var(--rl-accent)' },
              }}
            />

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: { xs: 180, sm: 210 },
                  aspectRatio: '2 / 3',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '1px solid rgba(244, 239, 230, 0.14)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  key={current.movieId}
                  src={current.posterDisplay}
                  alt={current.title}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
              <Typography
                sx={{
                  textAlign: 'center',
                  color: 'var(--rl-cream)',
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  mb: 0.5,
                  px: 1,
                }}
              >
                {current.title}
              </Typography>
              {current.releaseDate && (
                <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem', mb: 3 }}>
                  {String(current.releaseDate).slice(0, 4)}
                </Typography>
              )}

              {error && (
                <Typography sx={{ color: '#e07050', fontSize: '0.85rem', mb: 2 }}>{error}</Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, width: '100%', maxWidth: 360 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SkipIcon />}
                  onClick={handleSkip}
                  disabled={acting}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.25,
                    borderColor: 'rgba(244,239,230,0.28)',
                    color: 'var(--rl-cream)',
                    '&:hover': { borderColor: 'var(--rl-cream)', bgcolor: 'rgba(244,239,230,0.04)' },
                  }}
                >
                  Skip
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={acting ? null : <CheckIcon />}
                  onClick={handleAdd}
                  disabled={acting}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.25,
                    bgcolor: 'var(--rl-accent)',
                    color: '#0c0b0a',
                    '&:hover': { bgcolor: '#e0b020' },
                  }}
                >
                  {acting ? <CircularProgress size={22} sx={{ color: '#0c0b0a' }} /> : 'Add'}
                </Button>
              </Box>

              <Button
                onClick={finish}
                sx={{
                  mt: 2.5,
                  textTransform: 'none',
                  color: 'var(--rl-muted)',
                  fontSize: '0.85rem',
                  '&:hover': { color: 'var(--rl-cream)', bgcolor: 'transparent' },
                }}
              >
                Finish early · {addedCount} added
              </Button>
            </Box>
          </>
        )}

        {step === 'done' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(212,160,23,0.15)',
                border: '1px solid rgba(212,160,23,0.4)',
                mb: 2.5,
              }}
            >
              <CheckIcon sx={{ color: 'var(--rl-accent)', fontSize: 32 }} />
            </Box>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '2.4rem',
                letterSpacing: '0.04em',
                color: 'var(--rl-cream)',
                mb: 1,
              }}
            >
              List ready
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', mb: 3.5 }}>
              Added {addedCount} · skipped {skippedCount}
            </Typography>
            <Button
              variant="contained"
              onClick={finish}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                bgcolor: 'var(--rl-accent)',
                color: '#0c0b0a',
                '&:hover': { bgcolor: '#e0b020' },
              }}
            >
              View list
            </Button>
            <Button
              startIcon={<CloseIcon />}
              component={Link}
              to="/lists"
              sx={{ mt: 1.5, textTransform: 'none', color: 'var(--rl-muted)' }}
            >
              Back to lists
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--rl-cream)',
    '& fieldset': { borderColor: 'rgba(244,239,230,0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(244,239,230,0.4)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--rl-accent)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--rl-muted)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--rl-accent)' },
  '& .MuiSelect-icon': { color: 'var(--rl-muted)' },
};

export default BuildListFrom;
