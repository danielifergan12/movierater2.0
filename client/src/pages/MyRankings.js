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
  Card,
  Chip,
  Rating,
  Divider,
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
import api from '../config/axios';

const getRankingColor = (position) => {
  if (position === 0) return '#ffd700';
  if (position < 3) return '#c0c0c0';
  if (position < 5) return '#cd7f32';
  return '#00d4ff';
};

const computeEvenScore = (index, total) => {
  if (total <= 1) return 10.0;
  const raw = 10 - (9 * index) / (total - 1);
  return Math.round(raw * 10) / 10;
};

const pageShellSx = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
};

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
    return rawRatings.map((rating, index) => {
      const cached = movieDetailsCache[rating.id];
      return {
        ...rating,
        releaseDate: rating.releaseDate || cached?.releaseDate || null,
        genres: rating.genres || cached?.genres || [],
        originalIndex: index,
        rankNumber: index + 1,
        computedScore: computeEvenScore(index, rawRatings.length),
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

  if (!isAuthenticated) {
    return (
      <Box sx={{ ...pageShellSx, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8, position: 'relative', zIndex: 1 }}>
          <MovieIcon sx={{ fontSize: 64, color: '#00d4ff', mb: 2 }} />
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Sign in to see your rankings
          </Typography>
          <Button
            component={Link}
            to="/login"
            variant="contained"
            sx={{ background: 'linear-gradient(45deg, #00d4ff, #ff6b35)' }}
          >
            Sign in
          </Button>
        </Container>
      </Box>
    );
  }

  if (rawRatings.length === 0) {
    return (
      <Box sx={{ ...pageShellSx, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8, position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            No rankings yet
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Rate a few movies to build your ordered list.
          </Typography>
          <Button
            component={Link}
            to="/rate"
            variant="contained"
            sx={{ background: 'linear-gradient(45deg, #00d4ff, #ff6b35)' }}
          >
            Start ranking
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ ...pageShellSx, pb: 8 }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ open: false, message: '' })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnack({ open: false, message: '' })} severity="success" sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>

        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1.5 }}>
            <Typography
              variant="h2"
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              My Movie Rankings
            </Typography>
            <IconButton
              onClick={handleUndo}
              disabled={ratingsHistory.length === 0}
              title="Undo last change"
              sx={{
                color: ratingsHistory.length === 0 ? 'rgba(255,255,255,0.3)' : '#00d4ff',
                '&:hover': { backgroundColor: ratingsHistory.length === 0 ? 'transparent' : 'rgba(0, 212, 255, 0.1)' },
              }}
            >
              <UndoIcon />
            </IconButton>
            <IconButton
              onClick={handleShareClick}
              title="Share"
              sx={{ color: '#00d4ff', '&:hover': { backgroundColor: 'rgba(0, 212, 255, 0.1)' } }}
            >
              <ShareIcon />
            </IconButton>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            {filteredAndSortedRatings.length === rawRatings.length
              ? `Your personal ranking of ${rawRatings.length} rated movies`
              : `Showing ${filteredAndSortedRatings.length} of ${rawRatings.length} movies`}
          </Typography>
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
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.45)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              backgroundColor: 'rgba(26,26,26,0.65)',
              '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.25)' },
              '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.45)' },
              '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
            },
          }}
        />

        <Button
          onClick={() => setShowAdvancedFilters((v) => !v)}
          endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ color: 'rgba(255,255,255,0.65)', textTransform: 'none', mb: 1, px: 0 }}
        >
          {showAdvancedFilters ? 'Hide filters' : 'More filters'}
        </Button>
        <Collapse in={showAdvancedFilters}>
          <MovieFilters
            filters={filters}
            onFiltersChange={setFilters}
            showRatingRange={false}
            showSearchWithin={false}
          />
        </Collapse>

        {!canReorder && (
          <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(0, 212, 255, 0.08)', color: '#fff' }}>
            Clear search/filters and sort by ranking to drag and reorder.
          </Alert>
        )}

        <Typography
          variant="h4"
          sx={{
            color: '#fff',
            mb: { xs: 2, sm: 3 },
            textAlign: 'center',
            fontSize: { xs: '1.35rem', sm: '1.75rem' },
          }}
        >
          {filteredAndSortedRatings.length === rawRatings.length ? 'Complete Rankings' : 'Filtered Rankings'}
        </Typography>

        {filteredAndSortedRatings.length === 0 ? (
          <Card
            sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
              No movies match your filters
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Try adjusting your filter criteria
            </Typography>
          </Card>
        ) : (
          <Card
            sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
            }}
          >
            <List sx={{ p: 0 }}>
              {filteredAndSortedRatings.map((ranking, displayIndex) => {
                const originalIndex = ranking.originalIndex;
                const score = ranking.computedScore || computeEvenScore(originalIndex, rawRatings.length);
                const isDragging = draggedIndex === originalIndex;
                const isDragOver = dragOverIndex === originalIndex;

                return (
                  <React.Fragment key={ranking.id}>
                    <ListItem
                      data-ranking-index={originalIndex}
                      onMouseDown={(e) => handleMouseDown(e, originalIndex)}
                      sx={{
                        py: { xs: 1.5, sm: 2 },
                        px: { xs: 1.5, sm: 3 },
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        cursor: canReorder ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        opacity: isDragging ? 0.85 : 1,
                        transform: isDragging ? 'scale(1.02)' : 'none',
                        boxShadow: isDragging ? '0 8px 24px rgba(0, 212, 255, 0.25)' : 'none',
                        backgroundColor: isDragOver ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                        border: isDragOver ? '2px solid rgba(0, 212, 255, 0.4)' : '2px solid transparent',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                        userSelect: 'none',
                        '&:hover': {
                          backgroundColor:
                            draggedIndex === null ? 'rgba(0, 212, 255, 0.05)' : isDragOver ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                        },
                      }}
                    >
                      {canReorder && (
                        <Box sx={{ mr: { xs: 1, sm: 1.5 }, display: 'flex', color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }}>
                          <DragIndicatorIcon sx={{ fontSize: { xs: '1.15rem', sm: '1.35rem' } }} />
                        </Box>
                      )}

                      <ListItemAvatar sx={{ mr: { xs: 1.5, sm: 2 }, mb: { xs: 1, sm: 0 }, minWidth: 'auto' }}>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar
                            variant="rounded"
                            src={ranking.posterUrl || undefined}
                            component={Link}
                            to={`/movie/${ranking.id}`}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              width: { xs: 48, sm: 56 },
                              height: { xs: 72, sm: 84 },
                              borderRadius: 1.5,
                              backgroundColor: 'rgba(0, 212, 255, 0.1)',
                            }}
                          >
                            <MovieIcon />
                          </Avatar>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              backgroundColor: getRankingColor(originalIndex),
                              color: originalIndex < 3 ? '#000' : '#fff',
                              borderRadius: '50%',
                              width: { xs: 22, sm: 26 },
                              height: { xs: 22, sm: 26 },
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              fontWeight: 'bold',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            {originalIndex + 1}
                          </Box>
                        </Box>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Typography
                            component={Link}
                            to={`/movie/${ranking.id}`}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              color: '#fff',
                              textDecoration: 'none',
                              fontWeight: 600,
                              fontSize: { xs: '0.95rem', sm: '1.1rem' },
                              '&:hover': { color: '#66e0ff' },
                            }}
                          >
                            {ranking.title}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mt: 0.5 }}>
                            <Rating
                              precision={0.1}
                              value={score / 2}
                              readOnly
                              size="small"
                              sx={{ '& .MuiRating-iconFilled': { color: '#00d4ff' }, fontSize: '0.95rem' }}
                            />
                            <Typography sx={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.8rem' }}>
                              {score.toFixed(1)}/10
                            </Typography>
                            <Chip
                              label={`#${originalIndex + 1}`}
                              size="small"
                              sx={{
                                backgroundColor: getRankingColor(originalIndex),
                                color: originalIndex < 3 ? '#000' : '#fff',
                                fontWeight: 'bold',
                                height: 22,
                                fontSize: '0.7rem',
                              }}
                            />
                            {ranking.releaseDate && (
                              <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
                                {new Date(ranking.releaseDate).getFullYear()}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.75,
                          mt: { xs: 1.5, sm: 0 },
                          width: { xs: '100%', sm: 'auto' },
                          justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outlined"
                          component={Link}
                          to={`/movie/${ranking.id}`}
                          size="small"
                          sx={{
                            borderColor: '#00d4ff',
                            color: '#00d4ff',
                            fontSize: '0.75rem',
                            minWidth: 0,
                            px: 1.25,
                            '&:hover': { borderColor: '#66e0ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' },
                          }}
                        >
                          View
                        </Button>
                        <IconButton
                          size="small"
                          title="Add to list"
                          onClick={() => setListMovie(ranking)}
                          sx={{ color: 'rgba(255,255,255,0.55)' }}
                        >
                          <PlaylistAddIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Re-rank"
                          onClick={() => setRerankMovie(ranking)}
                          sx={{ color: 'rgba(255,255,255,0.55)' }}
                        >
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Remove"
                          onClick={() => setDeleteDialog({ open: true, movieId: ranking.id })}
                          sx={{ color: '#ff6b35' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {displayIndex < filteredAndSortedRatings.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          </Card>
        )}
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
