import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Rating,
  Chip,
  Button,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Movie as MovieIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { useRatings } from '../hooks/useRatings';
import { useAuth } from '../contexts/AuthContext';
import { useMovies } from '../contexts/MovieContext';
import MovieFilters from '../components/MovieFilters';
import api from '../config/axios';

const MyRankings = () => {
  const { rawRatings, setRatingsArray, computeScore } = useRatings();
  const { isAuthenticated } = useAuth();
  const { getMovieDetails } = useMovies();
  const location = useLocation();
  const navigate = useNavigate();
  const [snack, setSnack] = useState({ open: Boolean(location.state?.message), message: location.state?.message || '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, movieId: null });
  const [shareDialog, setShareDialog] = useState({ open: false, shareUrl: '', loading: false });
  const [filters, setFilters] = useState({
    genres: [],
    decades: [],
    yearRange: [1900, new Date().getFullYear() + 1],
    ratingRange: [1, 10],
    sortBy: 'rating',
    searchQuery: ''
  });
  const [movieDetailsCache, setMovieDetailsCache] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    if (location.state?.message) {
      // clear nav state so it doesn't persist
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleDeleteMovie = (movieId) => {
    setDeleteDialog({ open: true, movieId });
  };

  const confirmDelete = () => {
    const updatedRankings = rawRatings.filter(ranking => ranking.id !== deleteDialog.movieId);
    setRatingsArray(updatedRankings);
    setDeleteDialog({ open: false, movieId: null });
  };

  const handleDragStart = (e, originalIndex) => {
    setDraggedIndex(originalIndex);
    setDragOverIndex(null); // Reset on new drag
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    // Set a custom drag image to prevent flickering
    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = '0.5';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e, dropOriginalIndex) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // Only update if it's different to prevent unnecessary re-renders
    if (draggedIndex !== null && draggedIndex !== dropOriginalIndex && dragOverIndex !== dropOriginalIndex) {
      setDragOverIndex(dropOriginalIndex);
    }
  };

  const handleDragEnter = (e, dropOriginalIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== dropOriginalIndex) {
      setDragOverIndex(dropOriginalIndex);
    }
  };

  const handleDragLeave = (e) => {
    // Don't clear dragOverIndex on dragLeave - let it persist until we enter a new item
    // This prevents flickering when moving between child elements
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, dropOriginalIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === dropOriginalIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the ratings array using original indices
    const newRatings = [...rawRatings];
    const draggedItem = newRatings[draggedIndex];
    
    // Remove the dragged item
    newRatings.splice(draggedIndex, 1);
    
    // Find the new position based on the drop target's original index
    const newPosition = draggedIndex < dropOriginalIndex 
      ? dropOriginalIndex - 1  // Moving down
      : dropOriginalIndex;      // Moving up
    
    // Insert at new position
    newRatings.splice(newPosition, 0, draggedItem);
    
    // Update the ratings
    setRatingsArray(newRatings);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleShareClick = async () => {
    setShareDialog({ open: true, shareUrl: '', loading: true });
    try {
      const response = await api.post('/api/share/generate');
      setShareDialog({ 
        open: true, 
        shareUrl: response.data.shareUrl, 
        loading: false 
      });
    } catch (error) {
      console.error('Error generating share code:', error);
      setShareDialog({ 
        open: true, 
        shareUrl: '', 
        loading: false 
      });
      setSnack({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to generate share link' 
      });
    }
  };

  const handleCopyLink = () => {
    if (shareDialog.shareUrl) {
      navigator.clipboard.writeText(shareDialog.shareUrl);
      setSnack({ open: true, message: 'Link copied to clipboard!' });
    }
  };

  const getRankingColor = (position) => {
    if (position === 0) return '#ffd700'; // Gold for #1
    if (position < 3) return '#c0c0c0'; // Silver for top 3
    if (position < 5) return '#cd7f32'; // Bronze for top 5
    return '#00d4ff'; // Default cyan
  };

  const computeEvenScore = (index, total) => {
    if (total <= 1) return 10.0;
    const raw = 10 - (9 * index) / (total - 1);
    return Math.round(raw * 10) / 10;
  };

  const getRankingIcon = (position) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return `#${position + 1}`;
  };

  // Fetch movie details for ratings missing metadata (in batches)
  useEffect(() => {
    const fetchMissingDetails = async () => {
      const missingIds = rawRatings
        .filter(r => !r.releaseDate || !r.genres)
        .map(r => r.id)
        .filter(id => !movieDetailsCache[id]);

      if (missingIds.length === 0) return;

      setLoadingDetails(true);
      try {
        // Fetch in batches of 10 to avoid overwhelming the API
        const batchSize = 10;
        const newCache = { ...movieDetailsCache };
        
        for (let i = 0; i < missingIds.length; i += batchSize) {
          const batch = missingIds.slice(i, i + batchSize);
          const detailsPromises = batch.map(async (id) => {
            try {
              const details = await getMovieDetails(id);
              return { id, details };
            } catch (error) {
              console.error(`Error fetching details for movie ${id}:`, error);
              return { id, details: null };
            }
          });

          const results = await Promise.all(detailsPromises);
          results.forEach(({ id, details }) => {
            if (details) {
              newCache[id] = {
                releaseDate: details.releaseDate || details.release_date,
                genres: details.genres || []
              };
            }
          });
          
          // Update cache after each batch
          setMovieDetailsCache({ ...newCache });
          
          // Small delay between batches to avoid rate limiting
          if (i + batchSize < missingIds.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };

    if (rawRatings.length > 0) {
      fetchMissingDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRatings.length]);

  // Enhanced ratings with metadata
  const enhancedRatings = useMemo(() => {
    return rawRatings.map((rating, index) => {
      const cached = movieDetailsCache[rating.id];
      return {
        ...rating,
        releaseDate: rating.releaseDate || cached?.releaseDate || null,
        genres: rating.genres || cached?.genres || [],
        computedScore: computeScore(index, rawRatings.length),
        originalIndex: index
      };
    });
  }, [rawRatings, movieDetailsCache, computeScore]);

  // Filter and sort logic
  const filteredAndSortedRatings = useMemo(() => {
    let filtered = [...enhancedRatings];

    // Filter by search query
    if (filters.searchQuery?.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query)
      );
    }

    // Filter by genre
    if (filters.genres?.length > 0) {
      filtered = filtered.filter(r => {
        const movieGenres = Array.isArray(r.genres) 
          ? r.genres.map(g => (typeof g === 'object' ? g.id : g))
          : [];
        return filters.genres.some(genreId => movieGenres.includes(genreId));
      });
    }

    // Filter by decade
    if (filters.decades?.length > 0) {
      filtered = filtered.filter(r => {
        if (!r.releaseDate) return false;
        const releaseDate = r.releaseDate instanceof Date 
          ? r.releaseDate 
          : new Date(r.releaseDate);
        const year = releaseDate.getFullYear();
        
        return filters.decades.some(decade => {
          if (decade === 0) return year < 1950;
          return year >= decade && year < decade + 10;
        });
      });
    }

    // Filter by year range (only if different from default)
    if (filters.yearRange) {
      const defaultYearRange = [1900, new Date().getFullYear() + 1];
      const isDefaultRange = filters.yearRange[0] === defaultYearRange[0] && 
                            filters.yearRange[1] === defaultYearRange[1];
      
      if (!isDefaultRange) {
        filtered = filtered.filter(r => {
          if (!r.releaseDate) return false;
          const releaseDate = r.releaseDate instanceof Date 
            ? r.releaseDate 
            : new Date(r.releaseDate);
          const year = releaseDate.getFullYear();
          return year >= filters.yearRange[0] && year <= filters.yearRange[1];
        });
      }
    }

    // Filter by rating range
    if (filters.ratingRange) {
      filtered = filtered.filter(r => {
        const score = r.computedScore || computeScore(r.originalIndex, rawRatings.length);
        return score >= filters.ratingRange[0] && score <= filters.ratingRange[1];
      });
    }

    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'rating':
            return (b.computedScore || 0) - (a.computedScore || 0);
          case 'rating-asc':
            return (a.computedScore || 0) - (b.computedScore || 0);
          case 'date-added':
            return b.originalIndex - a.originalIndex;
          case 'date-added-desc':
            return a.originalIndex - b.originalIndex;
          case 'release-date':
            const dateA = a.releaseDate ? (a.releaseDate instanceof Date ? a.releaseDate : new Date(a.releaseDate)) : new Date(0);
            const dateB = b.releaseDate ? (b.releaseDate instanceof Date ? b.releaseDate : new Date(b.releaseDate)) : new Date(0);
            return dateB - dateA;
          case 'release-date-desc':
            const dateA2 = a.releaseDate ? (a.releaseDate instanceof Date ? a.releaseDate : new Date(a.releaseDate)) : new Date(0);
            const dateB2 = b.releaseDate ? (b.releaseDate instanceof Date ? b.releaseDate : new Date(b.releaseDate)) : new Date(0);
            return dateA2 - dateB2;
          case 'title':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [enhancedRatings, filters, computeScore, rawRatings.length]);

  if (!isAuthenticated) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
          <MovieIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: '#00d4ff', mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            Sign In to View Your Rankings
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Create an account or sign in to start building your personal movie rankings!
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              component={Link}
              to="/login"
              size="large"
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                px: { xs: 4, sm: 6 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
              }}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              component={Link}
              to="/register"
              size="large"
              sx={{
                borderColor: '#00d4ff',
                color: '#00d4ff',
                px: { xs: 4, sm: 6 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                '&:hover': {
                  borderColor: '#66e0ff',
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                },
              }}
            >
              Create Account
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  if (rawRatings.length === 0) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
          <MovieIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: '#00d4ff', mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            No Movies Rated Yet
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Start rating movies to build your personal ranking list!
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/"
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              px: { xs: 4, sm: 6 },
              py: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: 300, sm: 'none' }
            }}
          >
            Start Rating Movies
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
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
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h2" sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
            }}>
              My Movie Rankings
            </Typography>
            <IconButton
              onClick={handleShareClick}
              sx={{
                color: '#00d4ff',
                '&:hover': {
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                },
              }}
              size="large"
            >
              <ShareIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
            </IconButton>
          </Box>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            {filteredAndSortedRatings.length === rawRatings.length
              ? `Your personal ranking of ${rawRatings.length} rated movies`
              : `Showing ${filteredAndSortedRatings.length} of ${rawRatings.length} movies`
            }
          </Typography>
        </Box>

        {/* Filters */}
        <MovieFilters
          filters={filters}
          onFiltersChange={setFilters}
          showRatingRange={true}
          showSearchWithin={true}
        />

        {/* Full Rankings List */}
        <Box>
          <Typography variant="h4" gutterBottom sx={{ 
            color: '#ffffff', 
            mb: { xs: 3, sm: 4 },
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}>
            {filteredAndSortedRatings.length === rawRatings.length
              ? 'Complete Rankings'
              : 'Filtered Rankings'
            }
          </Typography>

          {loadingDetails && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {filteredAndSortedRatings.length === 0 ? (
            <Card sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                No movies match your filters
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Try adjusting your filter criteria
              </Typography>
            </Card>
          ) : (
          
          <Card sx={{
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
          }}>
            <List sx={{ p: 0 }}>
              {filteredAndSortedRatings.map((ranking, displayIndex) => {
                const originalIndex = ranking.originalIndex;
                const score = ranking.computedScore || computeEvenScore(originalIndex, rawRatings.length);
                const isDragging = draggedIndex === originalIndex;
                const isDragOver = dragOverIndex === originalIndex;
                
                // Determine if this item should move up or down to make space
                // When dragging down (e.g., from 2 to 5), items 3-5 should move up
                // When dragging up (e.g., from 5 to 2), items 2-4 should move down
                let shouldMoveUp = false;
                let shouldMoveDown = false;
                
                if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== originalIndex && !isDragging) {
                  if (draggedIndex < dragOverIndex) {
                    // Dragging down: items between dragged and drop should move up
                    shouldMoveUp = originalIndex > draggedIndex && originalIndex <= dragOverIndex;
                  } else {
                    // Dragging up: items between drop and dragged should move down
                    shouldMoveDown = originalIndex >= dragOverIndex && originalIndex < draggedIndex;
                  }
                }
                
                return (
                <React.Fragment key={ranking.id}>
                  {/* Drop zone placeholder - shown above the item being replaced */}
                  {isDragOver && draggedIndex !== null && draggedIndex !== originalIndex && (
                    <Box
                      sx={{
                        minHeight: { xs: 140, sm: 180 },
                        border: '2px dashed #00d4ff',
                        borderRadius: 2,
                        backgroundColor: 'rgba(0, 212, 255, 0.15)',
                        margin: { xs: '8px 16px', sm: '12px 32px' },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity 0.2s ease',
                        opacity: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#00d4ff', fontWeight: 600 }}>
                        Drop here
                      </Typography>
                    </Box>
                  )}
                  <ListItem 
                    draggable={filters.sortBy === 'rating' && filteredAndSortedRatings.length === rawRatings.length}
                    onDragStart={(e) => {
                      if (filters.sortBy === 'rating' && filteredAndSortedRatings.length === rawRatings.length) {
                        handleDragStart(e, originalIndex);
                      } else {
                        e.preventDefault();
                      }
                    }}
                    onDragEnter={(e) => {
                      if (filters.sortBy === 'rating' && filteredAndSortedRatings.length === rawRatings.length) {
                        handleDragEnter(e, originalIndex);
                      }
                    }}
                    onDragOver={(e) => {
                      if (filters.sortBy === 'rating' && filteredAndSortedRatings.length === rawRatings.length) {
                        handleDragOver(e, originalIndex);
                      } else {
                        e.preventDefault();
                      }
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      if (filters.sortBy === 'rating' && filteredAndSortedRatings.length === rawRatings.length) {
                        handleDrop(e, originalIndex);
                      } else {
                        e.preventDefault();
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    sx={{ 
                      py: { xs: 2, sm: 3 },
                      px: { xs: 2, sm: 4 },
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      cursor: (filters.sortBy === 'rating' && filteredAndSortedRatings.length === rawRatings.length) ? 'grab' : 'default',
                      opacity: isDragging ? 0.2 : 1,
                      transform: shouldMoveUp ? 'translateY(-100%)' : shouldMoveDown ? 'translateY(100%)' : 'translateY(0)',
                      transition: draggedIndex !== null && !isDragging ? 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease' : 'opacity 0.15s ease',
                      backgroundColor: isDragOver && !isDragging ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                      border: isDragOver && !isDragging ? '2px solid rgba(0, 212, 255, 0.4)' : '2px solid transparent',
                      position: 'relative',
                      zIndex: isDragging ? 10 : (isDragOver ? 5 : 1),
                      pointerEvents: isDragging ? 'none' : 'auto',
                      '&:hover': {
                        backgroundColor: draggedIndex === null ? 'rgba(0, 212, 255, 0.05)' : (isDragOver && !isDragging ? 'rgba(0, 212, 255, 0.08)' : 'transparent'),
                      },
                      '&:active': {
                        cursor: (filters.sortBy === 'rating' && filteredAndSortedRatings.length === rawRatings.length) ? 'grabbing' : 'default',
                      },
                      '&[draggable="true"]': {
                        userSelect: 'none',
                      }
                    }}
                  >
                    {filters.sortBy === 'rating' && filteredAndSortedRatings.length === rawRatings.length && (
                      <Box
                        sx={{
                          mr: { xs: 1, sm: 2 },
                          display: 'flex',
                          alignItems: 'center',
                          color: 'rgba(255, 255, 255, 0.5)',
                          cursor: 'grab',
                          '&:active': {
                            cursor: 'grabbing',
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <DragIndicatorIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                      </Box>
                    )}
                    <ListItemAvatar sx={{ mr: { xs: 2, sm: 3 }, mb: { xs: 1, sm: 0 } }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={ranking.posterUrl || null}
                          sx={{ 
                            width: { xs: 60, sm: 80 }, 
                            height: { xs: 90, sm: 120 },
                            borderRadius: 2,
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          }}
                        >
                          🎬
                        </Avatar>
                        <Box sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                            backgroundColor: getRankingColor(originalIndex),
                            color: originalIndex < 3 ? '#000' : '#fff',
                          borderRadius: '50%',
                          width: { xs: 24, sm: 30 },
                          height: { xs: 24, sm: 30 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        }}>
                            {originalIndex + 1}
                        </Box>
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="h6" sx={{ 
                          color: '#ffffff', 
                          fontWeight: 600,
                          mb: 1,
                          fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}>
                          {ranking.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 1, sm: 2 },
                            flexWrap: 'wrap'
                          }}>
                            <Rating
                              precision={0.1}
                                value={score / 2}
                              readOnly
                              size="small"
                              sx={{
                                '& .MuiRating-iconFilled': {
                                  color: '#00d4ff',
                                },
                              }}
                            />
                            <Typography variant="body2" sx={{ 
                              color: '#00d4ff',
                              fontWeight: 600,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}>
                                {score.toFixed(1)}/10
                            </Typography>
                            <Chip
                                label={`#${originalIndex + 1}`}
                              size="small"
                              sx={{
                                  backgroundColor: getRankingColor(originalIndex),
                                  color: originalIndex < 3 ? '#000' : '#fff',
                                fontWeight: 'bold',
                                fontSize: { xs: '0.7rem', sm: '0.75rem' }
                              }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1,
                      mt: { xs: 2, sm: 0 },
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'flex-end', sm: 'flex-start' }
                    }}>
                      <Button
                        variant="outlined"
                        component={Link}
                        to={`/movie/${ranking.id}`}
                        size="small"
                        sx={{
                          borderColor: '#00d4ff',
                          color: '#00d4ff',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          px: { xs: 1.5, sm: 2 },
                          '&:hover': {
                            borderColor: '#66e0ff',
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          },
                        }}
                      >
                        View
                      </Button>
                      <IconButton
                        onClick={() => handleDeleteMovie(ranking.id)}
                        sx={{ color: '#ff6b35' }}
                        size="small"
                      >
                        <DeleteIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      </IconButton>
                    </Box>
                  </ListItem>
                    {displayIndex < filteredAndSortedRatings.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  )}
                </React.Fragment>
                );
              })}
            </List>
          </Card>
          )}
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, movieId: null })}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          Remove from Rankings?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Are you sure you want to remove this movie from your rankings? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, movieId: null })}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #ff6b35, #e64a19)',
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialog.open}
        onClose={() => setShareDialog({ open: false, shareUrl: '', loading: false })}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
            minWidth: { xs: '90%', sm: 400 },
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          Share Your Rankings
        </DialogTitle>
        <DialogContent>
          {shareDialog.loading ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', py: 2 }}>
              Generating share link...
            </Typography>
          ) : shareDialog.shareUrl ? (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                Share this link with others to let them view your movie rankings:
              </Typography>
              <TextField
                fullWidth
                value={shareDialog.shareUrl}
                readOnly
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleCopyLink}
                        sx={{ color: '#00d4ff' }}
                      >
                        <CopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          ) : (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', py: 2 }}>
              Failed to generate share link. Please try again.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShareDialog({ open: false, shareUrl: '', loading: false })}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Close
          </Button>
          {shareDialog.shareUrl && (
            <Button
              onClick={handleCopyLink}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              }}
              startIcon={<CopyIcon />}
            >
              Copy Link
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyRankings;

