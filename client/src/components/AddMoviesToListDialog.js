import React, { useMemo, useState } from 'react';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Check as CheckIcon, Add as AddIcon } from '@mui/icons-material';
import AutocompleteSearch from './AutocompleteSearch';
import { useRatings } from '../hooks/useRatings';
import { socialAccentBtn, socialGhostBtn } from './SocialPageShell';

const posterSrc = (pathOrUrl) => {
  if (!pathOrUrl) return '/placeholder-movie.jpg';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `https://image.tmdb.org/t/p/w185${pathOrUrl}`;
};

const toPosterPath = (movie) => {
  if (movie.poster_path) return movie.poster_path;
  if (movie.posterPath) return movie.posterPath;
  if (movie.posterUrl?.startsWith('http')) {
    return movie.posterUrl
      .replace('https://image.tmdb.org/t/p/w500', '')
      .replace('https://image.tmdb.org/t/p/w780', '')
      .replace('https://image.tmdb.org/t/p/w185', '');
  }
  return '';
};

/**
 * Popup to add films to a list via search or the user's rankings.
 */
const AddMoviesToListDialog = ({ open, onClose, list, onAdded }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { rawRatings } = useRatings();
  const [tab, setTab] = useState(0);
  const [addingId, setAddingId] = useState(null);
  const [justAdded, setJustAdded] = useState(() => new Set());
  const [error, setError] = useState('');

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

  const addMovie = async (movie) => {
    const id = String(movie.id || movie.tmdbId || movie.movieId);
    if (!id || isInList(id) || addingId) return;

    setAddingId(id);
    setError('');
    try {
      const payload = {
        movieId: id,
        tmdbId: Number(movie.tmdbId || movie.id || movie.movieId),
        title: movie.title,
        posterPath: toPosterPath(movie),
        releaseDate: movie.release_date || movie.releaseDate || null,
      };
      const updated = await onAdded(payload);
      setJustAdded((prev) => new Set([...prev, id]));
      return updated;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not add movie';
      if (/already/i.test(msg)) {
        setJustAdded((prev) => new Set([...prev, id]));
      } else {
        setError(msg);
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleSearchSelect = (movie) => {
    addMovie({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
    });
  };

  const handleClose = () => {
    setTab(0);
    setError('');
    setJustAdded(new Set());
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(12, 11, 10, 0.98)',
          border: '1px solid rgba(244, 239, 230, 0.12)',
          borderRadius: { xs: 0, sm: 1.5 },
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
          maxHeight: { xs: '100dvh', sm: 'min(88vh, 720px)' },
          m: { xs: 0, sm: 2 },
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
          fontSize: '1.6rem',
          pb: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          Add movies
          <Typography sx={{ color: 'var(--rl-muted)', fontFamily: '"Manrope", sans-serif', fontSize: '0.8rem', letterSpacing: 0, mt: 0.25, fontWeight: 400 }}>
            to {list?.name || 'your list'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'var(--rl-muted)' }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 2.5, borderBottom: '1px solid rgba(244,239,230,0.1)' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              color: 'var(--rl-muted)',
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 40,
              '&.Mui-selected': { color: 'var(--rl-cream)' },
            },
            '& .MuiTabs-indicator': { backgroundColor: 'var(--rl-accent)' },
          }}
        >
          <Tab label="Search" />
          <Tab label={`My Rankings (${rawRatings.length})`} />
        </Tabs>
      </Box>

      <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, pt: 2, pb: 2.5 }}>
        {error && (
          <Typography sx={{ color: '#e07050', fontSize: '0.85rem', mb: 1.5 }}>{error}</Typography>
        )}

        {tab === 0 && (
          <Box>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem', mb: 1.25 }}>
              Search any film and tap it to add.
            </Typography>
            <AutocompleteSearch
              onMovieSelect={handleSearchSelect}
              placeholder="Search movies to add…"
            />
            {addingId && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                <CircularProgress size={16} sx={{ color: 'var(--rl-accent)' }} />
                <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.8rem' }}>Adding…</Typography>
              </Box>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem', mb: 1.5 }}>
              Pick from your ranked films.
            </Typography>
            {rawRatings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: 'var(--rl-muted)', mb: 2 }}>
                  You haven’t ranked any movies yet.
                </Typography>
                <Button
                  variant="contained"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClose();
                    navigate('/rankings');
                  }}
                  sx={socialAccentBtn}
                >
                  Go to My Rankings
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(3, 1fr)',
                    sm: 'repeat(4, 1fr)',
                  },
                  gap: 1.25,
                  maxHeight: { xs: 'calc(100dvh - 220px)', sm: 420 },
                  overflowY: 'auto',
                  pr: 0.5,
                }}
              >
                {rawRatings.map((movie) => {
                  const id = String(movie.id);
                  const added = isInList(id);
                  const busy = addingId === id;
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
                        p: 0,
                        m: 0,
                        border: '1px solid',
                        borderColor: added ? 'rgba(212,160,23,0.45)' : 'rgba(244,239,230,0.12)',
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'rgba(244,239,230,0.03)',
                        cursor: added ? 'default' : 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        opacity: busy ? 0.7 : 1,
                        transition: 'border-color 0.15s ease, transform 0.15s ease',
                        '&:hover:not(:disabled)': {
                          borderColor: 'rgba(212,160,23,0.55)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Box sx={{ position: 'relative', aspectRatio: '2 / 3' }}>
                        <Box
                          component="img"
                          src={posterSrc(movie.posterUrl)}
                          alt=""
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            pb: 0.75,
                            background: added
                              ? 'linear-gradient(0deg, rgba(12,11,10,0.85) 0%, transparent 55%)'
                              : 'linear-gradient(0deg, rgba(12,11,10,0.7) 0%, transparent 50%)',
                          }}
                        >
                          {busy ? (
                            <CircularProgress size={18} sx={{ color: 'var(--rl-accent)' }} />
                          ) : added ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35, color: 'var(--rl-accent)' }}>
                              <CheckIcon sx={{ fontSize: 16 }} />
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>Added</Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'var(--rl-cream)' }}>
                              <AddIcon sx={{ fontSize: 16 }} />
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>Add</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Typography
                        sx={{
                          px: 0.6,
                          py: 0.6,
                          color: 'var(--rl-cream)',
                          fontSize: '0.68rem',
                          fontWeight: 600,
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
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button onClick={handleClose} sx={socialGhostBtn}>
            Done
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddMoviesToListDialog;
