import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Bookmark,
  Delete as DeleteIcon,
  Movie as MovieIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useMovies } from '../contexts/MovieContext';
import api from '../config/axios';
import RatingModal from '../components/RatingModal';

const Watchlist = () => {
  const { isAuthenticated } = useAuth();
  const { getMovieDetails } = useMovies();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredWatchlist, setFilteredWatchlist] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, movie: null });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [filters, setFilters] = useState({
    genre: '',
    year: '',
    sortBy: 'addedAt'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWatchlist();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    applyFilters();
  }, [watchlist, filters]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/watchlist');
      setWatchlist(response.data.watchlist || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...watchlist];

    // Filter by genre (if movie details are available)
    if (filters.genre) {
      // This would require fetching movie details - simplified for now
    }

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(movie => {
        if (!movie.releaseDate) return false;
        const year = new Date(movie.releaseDate).getFullYear();
        return year.toString() === filters.year;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'releaseDate':
          return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
        case 'addedAt':
        default:
          return new Date(b.addedAt) - new Date(a.addedAt);
      }
    });

    setFilteredWatchlist(filtered);
  };

  const handleDelete = async () => {
    if (!deleteDialog.movie) return;

    try {
      await api.delete(`/api/watchlist/${deleteDialog.movie.movieId || deleteDialog.movie.tmdbId}`);
      setWatchlist(prev => prev.filter(m => 
        m.movieId !== deleteDialog.movie.movieId && 
        m.tmdbId !== deleteDialog.movie.tmdbId
      ));
      setDeleteDialog({ open: false, movie: null });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const handleRateMovie = (movie) => {
    setSelectedMovie({
      id: movie.movieId || movie.tmdbId,
      title: movie.title,
      posterUrl: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg',
    });
    setShowRatingModal(true);
  };

  const handleRatingComplete = () => {
    setShowRatingModal(false);
    setSelectedMovie(null);
    // Optionally remove from watchlist after rating
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= 1900; i--) {
      years.push(i.toString());
    }
    return years;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <CircularProgress />
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h2" sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            My Watchlist
          </Typography>
          <Chip
            icon={<Bookmark />}
            label={`${watchlist.length} ${watchlist.length === 1 ? 'Movie' : 'Movies'}`}
            sx={{
              background: 'linear-gradient(45deg, #ff6b35, #e64a19)',
              color: '#ffffff',
              fontWeight: 600,
            }}
          />
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              sx={{ color: '#ffffff' }}
            >
              <MenuItem value="addedAt">Recently Added</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="releaseDate">Release Date</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={filters.year}
              label="Year"
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              sx={{ color: '#ffffff' }}
            >
              <MenuItem value="">All Years</MenuItem>
              {getYearOptions().slice(0, 50).map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {filteredWatchlist.length === 0 ? (
          <Card sx={{
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
            p: 4,
            textAlign: 'center'
          }}>
            <MovieIcon sx={{ fontSize: 60, color: '#00d4ff', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#ffffff', mb: 2 }}>
              {watchlist.length === 0 ? 'Your Watchlist is Empty' : 'No Movies Match Your Filters'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              {watchlist.length === 0 
                ? 'Start adding movies you want to watch! Click "Add to Watchlist" on any movie page.'
                : 'Try adjusting your filters to see more movies.'}
            </Typography>
            {watchlist.length === 0 && (
              <Button
                variant="contained"
                component={Link}
                to="/search"
                sx={{
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                }}
              >
                Discover Movies
              </Button>
            )}
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredWatchlist.map((movie) => (
              <Grid item xs={6} sm={4} md={3} key={movie.movieId || movie.tmdbId}>
                <Card sx={{
                  background: 'rgba(26, 26, 26, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 212, 255, 0.3)',
                  }
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="400"
                      image={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg'}
                      alt={movie.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: '#ff6b35',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        }
                      }}
                      onClick={() => setDeleteDialog({ open: true, movie })}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="h6"
                      component={Link}
                      to={`/movie/${movie.movieId || movie.tmdbId}`}
                      sx={{
                        color: '#ffffff',
                        textDecoration: 'none',
                        mb: 1,
                        fontWeight: 600,
                        '&:hover': {
                          color: '#00d4ff',
                        },
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {movie.title}
                    </Typography>
                    {movie.releaseDate && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
                        {new Date(movie.releaseDate).getFullYear()}
                      </Typography>
                    )}
                    <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        component={Link}
                        to={`/movie/${movie.movieId || movie.tmdbId}`}
                        sx={{
                          flex: 1,
                          borderColor: '#00d4ff',
                          color: '#00d4ff',
                          '&:hover': {
                            borderColor: '#66e0ff',
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          },
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleRateMovie(movie)}
                        sx={{
                          flex: 1,
                          background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                        }}
                      >
                        Rate
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, movie: null })}
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
            Remove from Watchlist?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Are you sure you want to remove "{deleteDialog.movie?.title}" from your watchlist?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, movie: null })}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #ff6b35, #e64a19)',
              }}
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rating Modal */}
        {showRatingModal && selectedMovie && (
          <RatingModal
            open={showRatingModal}
            movie={selectedMovie}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedMovie(null);
            }}
            onComplete={handleRatingComplete}
            allowRerate={false}
          />
        )}
      </Container>
    </Box>
  );
};

export default Watchlist;

