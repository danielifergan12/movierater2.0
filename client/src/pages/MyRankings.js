import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Movie as MovieIcon,
  Share as ShareIcon,
  DragIndicator as DragIndicatorIcon,
  Undo as UndoIcon,
  Replay as ReplayIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlaylistAdd as PlaylistAddIcon,
} from '@mui/icons-material';
import { useRatings } from '../hooks/useRatings';
import { useAuth } from '../contexts/AuthContext';
import { useMovies } from '../contexts/MovieContext';
import MovieFilters from '../components/MovieFilters';
import RatingModal from '../components/RatingModal';
import AddToListDialog from '../components/AddToListDialog';
import ShareCard from '../components/ShareCard';
import CinemaScreen from '../components/CinemaScreen';
import api from '../config/axios';

const TIER_DEFS = [
  { id: 'S', label: 'S — Top picks', maxRatio: 0.1, minCount: 1, color: '#d4a017' },
  { id: 'A', label: 'A — Favorites', maxRatio: 0.3, minCount: 0, color: '#c9c4b8' },
  { id: 'B', label: 'B — Strong', maxRatio: 0.6, minCount: 0, color: '#8a9ba8' },
  { id: 'C', label: 'C — Solid', maxRatio: 0.85, minCount: 0, color: '#6b7280' },
  { id: 'D', label: 'D — The rest', maxRatio: 1, minCount: 0, color: '#4b5563' },
];

function assignTier(total) {
  if (total <= 0) return [];
  if (total <= 5) {
    return Array.from({ length: total }, () => ({ id: 'ALL', label: 'Your rankings', color: '#d4a017' }));
  }
  return Array.from({ length: total }, (_, index) => {
    const ratio = (index + 1) / total;
    const tier = TIER_DEFS.find((t) => ratio <= t.maxRatio) || TIER_DEFS[TIER_DEFS.length - 1];
    return tier;
  });
}

const MyRankings = () => {
  const { rawRatings, setRatingsArray } = useRatings();
  const { isAuthenticated, user } = useAuth();
  const { getMovieDetails } = useMovies();
  const location = useLocation();
  const navigate = useNavigate();

  const [snack, setSnack] = useState({ open: Boolean(location.state?.message), message: location.state?.message || '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, movieId: null });
  const [shareDialog, setShareDialog] = useState({ open: false, shareUrl: '', loading: false });
  const [listMovie, setListMovie] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [rerankMovie, setRerankMovie] = useState(null);
  const [filters, setFilters] = useState({
    genres: [],
    decades: [],
    yearRange: [1900, new Date().getFullYear() + 1],
    ratingRange: [1, 10],
    sortBy: 'rating',
    searchQuery: '',
  });
  const [movieDetailsCache, setMovieDetailsCache] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseDownIndex, setMouseDownIndex] = useState(null);
  const draggedIndexRef = useRef(null);
  const dragOverIndexRef = useRef(null);
  const lastHoveredIndexRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const rawRatingsRef = useRef(rawRatings);
  rawRatingsRef.current = rawRatings;
  const [ratingsHistory, setRatingsHistory] = useState([]);
  const maxHistorySize = 10;

  const canReorder = filters.sortBy === 'rating'
    && !filters.searchQuery?.trim()
    && (!filters.genres || filters.genres.length === 0)
    && (!filters.decades || filters.decades.length === 0);

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const saveToHistory = (currentRatings) => {
    setRatingsHistory((prev) => [...prev, JSON.parse(JSON.stringify(currentRatings))].slice(-maxHistorySize));
  };

  const handleUndo = () => {
    if (ratingsHistory.length === 0) return;
    const previousState = ratingsHistory[ratingsHistory.length - 1];
    setRatingsArray(previousState);
    setRatingsHistory((prev) => prev.slice(0, -1));
    setSnack({ open: true, message: 'Changes undone' });
  };

  const confirmDelete = () => {
    saveToHistory(rawRatings);
    setRatingsArray(rawRatings.filter((r) => r.id !== deleteDialog.movieId));
    setDeleteDialog({ open: false, movieId: null });
  };

  const handleMouseDown = (e, originalIndex) => {
    if (!canReorder) return;
    const target = e.target;
    if (target.closest('button') || target.closest('a') || target.tagName === 'BUTTON' || target.tagName === 'A') {
      return;
    }
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setDraggedIndex(originalIndex);
    draggedIndexRef.current = originalIndex;
    setDragOverIndex(null);
    dragOverIndexRef.current = null;
    setIsMouseDown(true);
    setMouseDownIndex(originalIndex);
    lastHoveredIndexRef.current = null;
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isMouseDown || mouseDownIndex === null || !canReorder) return undefined;

    const handleMouseMove = (e) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      let hoveredIndex = null;
      for (const el of elements) {
        if (el.hasAttribute?.('data-ranking-index')) {
          hoveredIndex = parseInt(el.getAttribute('data-ranking-index'), 10);
          break;
        }
        const listItem = el.closest?.('[data-ranking-index]');
        if (listItem) {
          hoveredIndex = parseInt(listItem.getAttribute('data-ranking-index'), 10);
          break;
        }
      }
      if (hoveredIndex !== null && hoveredIndex !== mouseDownIndex && hoveredIndex !== lastHoveredIndexRef.current) {
        lastHoveredIndexRef.current = hoveredIndex;
        dragOverIndexRef.current = hoveredIndex;
        setDragOverIndex(hoveredIndex);
      }
    };

    const handleMouseUp = () => {
      const from = draggedIndexRef.current;
      const to = dragOverIndexRef.current;
      if (from !== null && to !== null && from !== to) {
        const current = rawRatingsRef.current;
        saveToHistory(current);
        const next = [...current];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        setRatingsArray(next);
        setSnack({ open: true, message: 'Ranking updated' });
      }
      draggedIndexRef.current = null;
      dragOverIndexRef.current = null;
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsMouseDown(false);
      setMouseDownIndex(null);
      lastHoveredIndexRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMouseDown, mouseDownIndex, setRatingsArray, canReorder]);

  const handleShareClick = async () => {
    setShareDialog({ open: true, shareUrl: '', loading: true });
    try {
      const response = await api.post('/api/share/generate');
      setShareDialog({ open: true, shareUrl: response.data.shareUrl, loading: false });
    } catch (error) {
      setShareDialog({ open: true, shareUrl: '', loading: false });
      setSnack({ open: true, message: error.response?.data?.message || 'Failed to generate share link' });
    }
  };

  useEffect(() => {
    const fetchMissingDetails = async () => {
      const missingIds = rawRatings
        .filter((r) => !r.releaseDate || !r.genres)
        .map((r) => r.id)
        .filter((id) => !movieDetailsCache[id]);
      if (missingIds.length === 0) return;

      const newCache = { ...movieDetailsCache };
      for (let i = 0; i < missingIds.length; i += 10) {
        const batch = missingIds.slice(i, i + 10);
        const results = await Promise.all(batch.map(async (id) => {
          try {
            const details = await getMovieDetails(id);
            return { id, details };
          } catch {
            return { id, details: null };
          }
        }));
        results.forEach(({ id, details }) => {
          if (details) {
            newCache[id] = {
              releaseDate: details.releaseDate || details.release_date,
              genres: details.genres || [],
            };
          }
        });
        setMovieDetailsCache({ ...newCache });
      }
    };
    if (rawRatings.length > 0) fetchMissingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRatings.length]);

  const enhancedRatings = useMemo(() => {
    const tiers = assignTier(rawRatings.length);
    return rawRatings.map((rating, index) => {
      const cached = movieDetailsCache[rating.id];
      return {
        ...rating,
        releaseDate: rating.releaseDate || cached?.releaseDate || null,
        genres: rating.genres || cached?.genres || [],
        originalIndex: index,
        rankNumber: index + 1,
        tier: tiers[index],
      };
    });
  }, [rawRatings, movieDetailsCache]);

  const filteredAndSortedRatings = useMemo(() => {
    let filtered = [...enhancedRatings];

    if (filters.searchQuery?.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(query));
    }

    if (filters.genres?.length > 0) {
      filtered = filtered.filter((r) => {
        const movieGenres = Array.isArray(r.genres)
          ? r.genres.map((g) => (typeof g === 'object' ? g.id : g))
          : [];
        return filters.genres.some((genreId) => movieGenres.includes(genreId));
      });
    }

    if (filters.decades?.length > 0) {
      filtered = filtered.filter((r) => {
        if (!r.releaseDate) return false;
        const year = new Date(r.releaseDate).getFullYear();
        return filters.decades.some((decade) => {
          if (decade === 0) return year < 1950;
          return year >= decade && year < decade + 10;
        });
      });
    }

    if (filters.yearRange) {
      const defaults = [1900, new Date().getFullYear() + 1];
      const isDefault = filters.yearRange[0] === defaults[0] && filters.yearRange[1] === defaults[1];
      if (!isDefault) {
        filtered = filtered.filter((r) => {
          if (!r.releaseDate) return false;
          const year = new Date(r.releaseDate).getFullYear();
          return year >= filters.yearRange[0] && year <= filters.yearRange[1];
        });
      }
    }

    if (filters.sortBy && filters.sortBy !== 'rating') {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'rating-asc':
            return b.originalIndex - a.originalIndex;
          case 'date-added':
            return new Date(b.ratedAt || 0) - new Date(a.ratedAt || 0);
          case 'date-added-desc':
            return new Date(a.ratedAt || 0) - new Date(b.ratedAt || 0);
          case 'release-date': {
            return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
          }
          case 'release-date-desc': {
            return new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0);
          }
          case 'title':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          default:
            return a.originalIndex - b.originalIndex;
        }
      });
    }

    return filtered;
  }, [enhancedRatings, filters]);

  const groupedByTier = useMemo(() => {
    if (!canReorder || filters.sortBy !== 'rating') {
      return [{ id: 'ALL', label: 'Results', color: '#d4a017', items: filteredAndSortedRatings }];
    }
    const groups = [];
    let current = null;
    filteredAndSortedRatings.forEach((item) => {
      const tierId = item.tier?.id || 'ALL';
      if (!current || current.id !== tierId) {
        current = {
          id: tierId,
          label: item.tier?.label || 'Your rankings',
          color: item.tier?.color || '#d4a017',
          items: [],
        };
        groups.push(current);
      }
      current.items.push(item);
    });
    return groups;
  }, [filteredAndSortedRatings, canReorder, filters.sortBy]);

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0c0b0a', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8 }}>
          <MovieIcon sx={{ fontSize: 64, color: 'var(--rl-accent)', mb: 2 }} />
          <Typography variant="h4" sx={{ color: 'var(--rl-cream)', mb: 2, fontFamily: '"Bebas Neue", sans-serif' }}>
            Sign in to see your rankings
          </Typography>
          <Button component={Link} to="/login" variant="contained" sx={{ backgroundImage: 'none', backgroundColor: 'var(--rl-accent)', color: '#140f0a' }}>
            Sign in
          </Button>
        </Container>
      </Box>
    );
  }

  if (rawRatings.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0c0b0a', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" sx={{ color: 'var(--rl-cream)', mb: 2, fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em' }}>
            No rankings yet
          </Typography>
          <Typography sx={{ color: 'var(--rl-muted)', mb: 3 }}>
            Rate a few movies to build your ordered list.
          </Typography>
          <Button component={Link} to="/onboarding" variant="contained" sx={{ backgroundImage: 'none', backgroundColor: 'var(--rl-accent)', color: '#140f0a' }}>
            Rank movies
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
        bgcolor: '#0c0b0a',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 55% 45% at 50% 48%, rgba(212, 160, 23, 0.2) 0%, transparent 62%),
            radial-gradient(ellipse 40% 35% at 15% 18%, rgba(244, 239, 230, 0.05) 0%, transparent 55%),
            linear-gradient(180deg, #12100e 0%, #0c0b0a 60%, #090807 100%)
          `,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '50%',
            top: '48%',
            width: '65%',
            height: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(212,160,23,0.16) 0%, transparent 70%)',
            filter: 'blur(28px)',
            animation: 'rankGlow 6s ease-in-out infinite',
          },
          '@keyframes rankGlow': {
            '0%, 100%': { opacity: 0.5, transform: 'translate(-50%, -50%) scale(1)' },
            '50%': { opacity: 0.9, transform: 'translate(-50%, -50%) scale(1.06)' },
          },
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 1, sm: 1.5 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ open: false, message: '' })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="success" onClose={() => setSnack({ open: false, message: '' })}>{snack.message}</Alert>
        </Snackbar>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1.25, flexShrink: 0 }}>
          <Box>
            <Typography sx={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: { xs: '1.85rem', sm: '2.35rem' }, letterSpacing: '0.04em', color: 'var(--rl-cream)', lineHeight: 1 }}>
              My Rankings
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', mt: 0.35, fontSize: '0.85rem' }}>
              {filteredAndSortedRatings.length === rawRatings.length
                ? `${rawRatings.length} movies · ordered by preference`
                : `${filteredAndSortedRatings.length} of ${rawRatings.length} movies`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={handleUndo} disabled={ratingsHistory.length === 0} title="Undo" sx={{ color: 'var(--rl-cream)' }}>
              <UndoIcon />
            </IconButton>
            <IconButton onClick={handleShareClick} title="Share" sx={{ color: 'var(--rl-cream)' }}>
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search your rankings"
          value={filters.searchQuery}
          onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'var(--rl-muted)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 0.75,
            flexShrink: 0,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(244,239,230,0.04)',
              borderRadius: '4px',
            },
          }}
        />

        <Button
          onClick={() => setShowAdvancedFilters((v) => !v)}
          endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ color: 'var(--rl-muted)', textTransform: 'none', mb: 0.75, px: 0, flexShrink: 0, alignSelf: 'flex-start', minHeight: 32 }}
        >
          {showAdvancedFilters ? 'Hide filters' : 'More filters'}
        </Button>
        <Collapse in={showAdvancedFilters} sx={{ flexShrink: 0 }}>
          <MovieFilters
            filters={filters}
            onFiltersChange={setFilters}
            showRatingRange={false}
            showSearchWithin={false}
          />
        </Collapse>

        {!canReorder && (
          <Alert severity="info" sx={{ mb: 1.5, bgcolor: 'rgba(212,160,23,0.08)', color: 'var(--rl-cream)', flexShrink: 0 }}>
            Drag to reorder is available when viewing rank order with no filters.
          </Alert>
        )}

        <CinemaScreen scrollable maxWidth={1100} sx={{ flex: 1, minHeight: 0, px: 0, pb: 0 }}>
          {filteredAndSortedRatings.length === 0 ? (
            <Typography sx={{ color: 'var(--rl-muted)', textAlign: 'center', py: 6 }}>
              No movies match your filters.
            </Typography>
          ) : (
            groupedByTier.map((group) => (
              <Box key={group.id} sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: group.color,
                    mb: 1.25,
                    pb: 1,
                    borderBottom: `1px solid ${group.color}44`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 3,
                    background: 'linear-gradient(180deg, rgba(20,18,16,0.98) 60%, rgba(20,18,16,0.85) 100%)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {group.label}
                </Typography>
                <List sx={{ p: 0 }}>
                  {group.items.map((ranking) => {
                    const originalIndex = ranking.originalIndex;
                    const isDragging = draggedIndex === originalIndex;
                    const isDragOver = dragOverIndex === originalIndex;
                    return (
                      <ListItem
                        key={ranking.id}
                        data-ranking-index={originalIndex}
                        onMouseDown={(e) => handleMouseDown(e, originalIndex)}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              edge="end"
                              title="Add to list"
                              onClick={() => setListMovie(ranking)}
                              sx={{ color: 'var(--rl-muted)' }}
                            >
                              <PlaylistAddIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              edge="end"
                              title="Re-rank"
                              onClick={() => setRerankMovie(ranking)}
                              sx={{ color: 'var(--rl-muted)' }}
                            >
                              <ReplayIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              edge="end"
                              title="Remove"
                              onClick={() => setDeleteDialog({ open: true, movieId: ranking.id })}
                              sx={{ color: 'var(--rl-muted)' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                        sx={{
                          py: 1.25,
                          px: 1,
                          mb: 0.5,
                          borderRadius: '4px',
                          cursor: canReorder ? (isDragging ? 'grabbing' : 'grab') : 'default',
                          opacity: isDragging ? 0.7 : 1,
                          backgroundColor: isDragOver ? 'rgba(212,160,23,0.12)' : 'transparent',
                          border: isDragOver ? '1px solid rgba(212,160,23,0.4)' : '1px solid transparent',
                          '&:hover': { backgroundColor: 'rgba(244,239,230,0.04)' },
                        }}
                      >
                        {canReorder && (
                          <DragIndicatorIcon sx={{ mr: 1, color: 'rgba(244,239,230,0.35)', fontSize: '1.1rem' }} />
                        )}
                        <Typography
                          sx={{
                            width: 36,
                            flexShrink: 0,
                            fontFamily: '"Bebas Neue", sans-serif',
                            fontSize: '1.35rem',
                            color: group.color,
                            mr: 1.5,
                          }}
                        >
                          #{ranking.rankNumber}
                        </Typography>
                        <ListItemAvatar sx={{ minWidth: 56 }}>
                          <Avatar
                            variant="rounded"
                            src={ranking.posterUrl || undefined}
                            component={Link}
                            to={`/movie/${ranking.id}`}
                            sx={{ width: 44, height: 66, borderRadius: '3px' }}
                          >
                            <MovieIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              component={Link}
                              to={`/movie/${ranking.id}`}
                              sx={{ color: 'var(--rl-cream)', textDecoration: 'none', fontWeight: 600, '&:hover': { color: 'var(--rl-accent)' } }}
                            >
                              {ranking.title}
                            </Typography>
                          }
                          secondary={
                            ranking.releaseDate
                              ? String(new Date(ranking.releaseDate).getFullYear())
                              : null
                          }
                          secondaryTypographyProps={{ sx: { color: 'var(--rl-muted)' } }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ))
          )}
        </CinemaScreen>
      </Container>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, movieId: null })}>
        <DialogTitle>Remove from rankings?</DialogTitle>
        <DialogContent>This removes the movie from your ordered list.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, movieId: null })}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={shareDialog.open} onClose={() => setShareDialog({ open: false, shareUrl: '', loading: false })} fullWidth maxWidth="sm">
        <DialogTitle>Share your rankings</DialogTitle>
        <DialogContent>
          {shareDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
          ) : shareDialog.shareUrl ? (
            <ShareCard
              username={user?.username}
              rankings={rawRatings}
              shareUrl={shareDialog.shareUrl}
              onCopy={() => { navigator.clipboard.writeText(shareDialog.shareUrl); setSnack({ open: true, message: 'Link copied' }); }}
            />
          ) : (
            <Alert severity="error">Could not create share link.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog({ open: false, shareUrl: '', loading: false })}>Close</Button>
        </DialogActions>
      </Dialog>

      <AddToListDialog
        open={!!listMovie}
        onClose={() => setListMovie(null)}
        movie={listMovie}
      />

      {rerankMovie && (
        <RatingModal
          open={!!rerankMovie}
          movie={{
            id: rerankMovie.id,
            title: rerankMovie.title,
            posterUrl: rerankMovie.posterUrl,
            releaseDate: rerankMovie.releaseDate,
            genres: rerankMovie.genres,
          }}
          onClose={() => setRerankMovie(null)}
          onComplete={() => {
            setRerankMovie(null);
            setSnack({ open: true, message: 'Re-ranked' });
          }}
          allowRerate
        />
      )}
    </Box>
  );
};

export default MyRankings;
