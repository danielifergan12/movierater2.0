import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import api from '../config/axios';
import { useRatings } from '../hooks/useRatings';
import { socialAccentBtn, socialGhostBtn, socialFieldSx } from './SocialPageShell';

const posterSrc = (pathOrUrl) => {
  if (!pathOrUrl) return '/placeholder-movie.jpg';
  if (pathOrUrl.startsWith('http')) {
    return pathOrUrl.replace('/w500', '/w92').replace('/w185', '/w92');
  }
  return `https://image.tmdb.org/t/p/w92${pathOrUrl}`;
};

const toPosterPath = (movie) => {
  if (movie.poster_path) return movie.poster_path;
  if (movie.posterPath) return movie.posterPath;
  if (movie.posterUrl?.startsWith('http')) {
    return movie.posterUrl
      .replace('https://image.tmdb.org/t/p/w500', '')
      .replace('https://image.tmdb.org/t/p/w780', '')
      .replace('https://image.tmdb.org/t/p/w185', '')
      .replace('https://image.tmdb.org/t/p/w92', '');
  }
  return '';
};

const Row = ({ poster, title, meta, action, disabled, justAdded }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      px: 0.75,
      py: 0.6,
      borderRadius: 1,
      opacity: disabled && !justAdded ? 0.5 : 1,
      backgroundColor: justAdded ? 'rgba(212,160,23,0.1)' : 'transparent',
      transition: 'background-color 0.25s ease, opacity 0.2s ease',
      '&:hover': disabled ? undefined : { backgroundColor: 'rgba(244,239,230,0.04)' },
    }}
  >
    <Box
      sx={{
        width: 30,
        height: 45,
        flexShrink: 0,
        borderRadius: '3px',
        overflow: 'hidden',
        border: '1px solid rgba(244,239,230,0.12)',
      }}
    >
      <Box component="img" src={poster} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          color: 'var(--rl-cream)',
          fontWeight: 600,
          fontSize: '0.84rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Typography>
      {meta && (
        <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.7rem' }}>{meta}</Typography>
      )}
    </Box>
    {action}
  </Box>
);

/**
 * Compact popup to add films via My Rankings or search.
 */
const AddMoviesToListDialog = ({ open, onClose, list, onAdded }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { rawRatings } = useRatings();
  const [tab, setTab] = useState(0);
  const [addingId, setAddingId] = useState(null);
  const [justAdded, setJustAdded] = useState(() => new Set());
  const [pulseId, setPulseId] = useState(null);
  const [addedCount, setAddedCount] = useState(0);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [rankFilter, setRankFilter] = useState('');

  useEffect(() => {
    if (!open) return;
    setTab(rawRatings.length > 0 ? 0 : 1);
    setQuery('');
    setResults([]);
    setRankFilter('');
    setError('');
    setJustAdded(new Set());
    setAddedCount(0);
    setPulseId(null);
    setAddingId(null);
  }, [open, rawRatings.length]);

  useEffect(() => {
    if (!open || tab !== 1) return undefined;
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await api.get(`/api/movies/search?query=${encodeURIComponent(query.trim())}&page=1`);
        if (!cancelled) setResults((response.data.results || []).slice(0, 10));
      } catch (e) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 260);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, tab]);

  const inListIds = useMemo(() => {
    const set = new Set();
    (list?.movies || []).forEach((m) => {
      if (m.movieId) set.add(String(m.movieId));
      if (m.tmdbId != null) set.add(String(m.tmdbId));
    });
    justAdded.forEach((id) => set.add(String(id)));
    return set;
  }, [list?.movies, justAdded]);

  const isInList = (id) => inListIds.has(String(id));

  const filteredRankings = useMemo(() => {
    const q = rankFilter.trim().toLowerCase();
    if (!q) return rawRatings;
    return rawRatings.filter((m) => (m.title || '').toLowerCase().includes(q));
  }, [rawRatings, rankFilter]);

  const markAdded = (id) => {
    setJustAdded((prev) => new Set([...prev, id]));
    setAddedCount((c) => c + 1);
    setPulseId(id);
    setTimeout(() => setPulseId((cur) => (cur === id ? null : cur)), 500);
  };

  const addMovie = async (movie) => {
    const id = String(movie.id || movie.tmdbId || movie.movieId);
    if (!id || isInList(id) || addingId) return;

    // Optimistic UI
    markAdded(id);
    setAddingId(id);
    setError('');
    try {
      await onAdded({
        movieId: id,
        tmdbId: Number(movie.tmdbId || movie.id || movie.movieId),
        title: movie.title,
        posterPath: toPosterPath(movie),
        releaseDate: movie.release_date || movie.releaseDate || null,
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not add movie';
      if (!/already/i.test(msg)) {
        setJustAdded((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setAddedCount((c) => Math.max(0, c - 1));
        setError(msg);
      }
    } finally {
      setAddingId(null);
    }
  };

  const addBtn = (id, added, busy) => {
    if (added) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
            color: 'var(--rl-accent)',
            pr: 0.5,
            animation: pulseId === id ? 'checkPop 0.45s ease' : undefined,
            '@keyframes checkPop': {
              '0%': { transform: 'scale(0.7)', opacity: 0.4 },
              '55%': { transform: 'scale(1.15)' },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        >
          <CheckIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700 }}>Added</Typography>
        </Box>
      );
    }
    if (busy) return <CircularProgress size={15} sx={{ color: 'var(--rl-accent)', mr: 0.75 }} />;
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.25,
          px: 1,
          py: 0.35,
          borderRadius: 1,
          bgcolor: 'var(--rl-accent)',
          color: 'var(--rl-ink)',
          fontSize: '0.7rem',
          fontWeight: 700,
          pointerEvents: 'none',
        }}
      >
        <AddIcon sx={{ fontSize: 14 }} />
        Add
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(12, 11, 10, 0.98)',
          border: '1px solid rgba(244, 239, 230, 0.12)',
          borderRadius: { xs: 0, sm: 1.5 },
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
          maxHeight: { xs: '100dvh', sm: 'min(84vh, 640px)' },
          m: { xs: 0, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'var(--rl-cream)',
          fontFamily: '"Bebas Neue", sans-serif',
          letterSpacing: '0.04em',
          fontSize: '1.35rem',
          py: 1.35,
          px: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          Add movies
          <Typography sx={{ color: 'var(--rl-muted)', fontFamily: '"Manrope", sans-serif', fontSize: '0.75rem', letterSpacing: 0, mt: 0.15, fontWeight: 400 }}>
            {list?.name}
            {addedCount > 0 ? ` · ${addedCount} added` : ''}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'var(--rl-muted)' }} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 2, borderBottom: '1px solid rgba(244,239,230,0.1)' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              color: 'var(--rl-muted)',
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 36,
              fontSize: '0.82rem',
              '&.Mui-selected': { color: 'var(--rl-cream)' },
            },
            '& .MuiTabs-indicator': { backgroundColor: 'var(--rl-accent)' },
          }}
        >
          <Tab label="My Rankings" />
          <Tab label="Search" />
        </Tabs>
      </Box>

      <DialogContent sx={{ px: 1.5, pt: 1.25, pb: 1.25, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Typography sx={{ color: '#e07050', fontSize: '0.8rem', mb: 1, px: 0.5 }}>{error}</Typography>
        )}

        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            {rawRatings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <Typography sx={{ color: 'var(--rl-muted)', mb: 2, fontSize: '0.85rem' }}>
                  No ranked films yet.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    onClose();
                    navigate('/rankings');
                  }}
                  sx={{ ...socialAccentBtn, py: 0.7 }}
                >
                  Go to My Rankings
                </Button>
              </Box>
            ) : (
              <>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Filter rankings…"
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'var(--rl-muted)', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 0.75,
                    px: 0.5,
                    ...socialFieldSx,
                    '& .MuiOutlinedInput-root': {
                      ...socialFieldSx['& .MuiOutlinedInput-root'],
                      fontSize: '0.85rem',
                    },
                  }}
                />
                <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: { xs: 'calc(100dvh - 210px)', sm: 380 } }}>
                  {filteredRankings.map((movie) => {
                    const id = String(movie.id);
                    const added = isInList(id);
                    const busy = addingId === id;
                    const popped = justAdded.has(id);
                    return (
                      <Box
                        key={id}
                        component="button"
                        type="button"
                        disabled={added || busy}
                        onClick={() =>
                          addMovie({
                            id: movie.id,
                            title: movie.title,
                            posterUrl: movie.posterUrl,
                            releaseDate: movie.releaseDate,
                          })
                        }
                        sx={{
                          display: 'block',
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          p: 0,
                          m: 0,
                          textAlign: 'left',
                          cursor: added ? 'default' : 'pointer',
                          font: 'inherit',
                        }}
                      >
                        <Row
                          poster={posterSrc(movie.posterUrl)}
                          title={movie.title}
                          meta={movie.releaseDate ? String(movie.releaseDate).slice(0, 4) : undefined}
                          disabled={added}
                          justAdded={popped && pulseId === id}
                          action={addBtn(id, added, busy)}
                        />
                      </Box>
                    );
                  })}
                  {filteredRankings.length === 0 && (
                    <Typography sx={{ color: 'var(--rl-muted)', textAlign: 'center', py: 3, fontSize: '0.85rem' }}>
                      No matches.
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="Search any movie…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--rl-muted)', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={16} sx={{ color: 'var(--rl-accent)' }} />
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                mb: 0.75,
                px: 0.5,
                ...socialFieldSx,
                '& .MuiOutlinedInput-root': {
                  ...socialFieldSx['& .MuiOutlinedInput-root'],
                  fontSize: '0.85rem',
                },
              }}
            />
            <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: { xs: 'calc(100dvh - 210px)', sm: 380 } }}>
              {results.map((movie) => {
                const id = String(movie.id);
                const added = isInList(id);
                const busy = addingId === id;
                const popped = justAdded.has(id);
                return (
                  <Box
                    key={id}
                    component="button"
                    type="button"
                    disabled={added || busy}
                    onClick={() =>
                      addMovie({
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.poster_path,
                        release_date: movie.release_date,
                      })
                    }
                    sx={{
                      display: 'block',
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      p: 0,
                      m: 0,
                      textAlign: 'left',
                      cursor: added ? 'default' : 'pointer',
                      font: 'inherit',
                    }}
                  >
                    <Row
                      poster={posterSrc(movie.poster_path)}
                      title={movie.title}
                      meta={movie.release_date ? String(movie.release_date).slice(0, 4) : undefined}
                      disabled={added}
                      justAdded={popped && pulseId === id}
                      action={addBtn(id, added, busy)}
                    />
                  </Box>
                );
              })}
              {query.trim().length >= 2 && !searching && results.length === 0 && (
                <Typography sx={{ color: 'var(--rl-muted)', textAlign: 'center', py: 3, fontSize: '0.85rem' }}>
                  No movies found.
                </Typography>
              )}
              {query.trim().length < 2 && (
                <Typography sx={{ color: 'var(--rl-muted)', textAlign: 'center', py: 3, fontSize: '0.85rem' }}>
                  Type at least 2 characters.
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1.1, px: 0.5 }}>
          <Button
            onClick={onClose}
            variant={addedCount > 0 ? 'contained' : 'outlined'}
            sx={addedCount > 0 ? { ...socialAccentBtn, py: 0.55 } : { ...socialGhostBtn, py: 0.5 }}
          >
            {addedCount > 0 ? `Done · ${addedCount} added` : 'Done'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddMoviesToListDialog;
