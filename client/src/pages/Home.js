import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Box,
  Rating,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Chip
} from '@mui/material';
import { Refresh as RefreshIcon, Star as StarIcon, Movie as MovieIcon } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';
import api from '../config/axios';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { trendingMovies, recommendedMovies, getTrendingMovies, getPersonalRecommendations, loading } = useMovies();
  const { isAuthenticated, user } = useAuth();
  const { rawRatings } = useRatings();
  const [activeTab, setActiveTab] = useState(1);
  const [ratingMovie, setRatingMovie] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayMovies, setDisplayMovies] = useState([]);
  const [totalRankings, setTotalRankings] = useState(0);
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const hasInitialLoad = useRef(false);
  const prevUserIdRef = useRef(null);
  const STORAGE_KEY = 'homeDisplayMovies';

  // Ensure component responds to route changes for proper navigation
  const [, setRouteUpdate] = useState(0);
  useEffect(() => {
    setRouteUpdate(prev => prev + 1);
  }, [location.pathname]);

  // Read tab parameter from URL and set active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const tabValue = parseInt(tabParam);
      if (tabValue === 1 || tabValue === 2) {
        setActiveTab(tabValue);
      }
    }
  }, [searchParams]);

  // Helper functions to manage recently shown movies in localStorage
  const getRecentlyShownMovies = () => {
    try {
      const stored = localStorage.getItem('recentlyShownMovies');
      if (stored) {
        const data = JSON.parse(stored);
        return data.slice(-120);
      }
    } catch (error) {
      console.error('Error reading recently shown movies:', error);
    }
    return [];
  };

  const addToRecentlyShown = (movieIds) => {
    try {
      const current = getRecentlyShownMovies();
      const updated = [...current, ...movieIds];
      const trimmed = updated.slice(-120);
      localStorage.setItem('recentlyShownMovies', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving recently shown movies:', error);
    }
  };

  const loadPersistedMovies = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const movies = JSON.parse(stored);
        if (Array.isArray(movies) && movies.length > 0 && movies[0].id) {
          return movies;
        }
      }
    } catch (error) {
      console.error('Error loading persisted movies:', error);
    }
    return null;
  };

  const savePersistedMovies = (movies) => {
    try {
      if (movies && movies.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
      }
    } catch (error) {
      console.error('Error saving persisted movies:', error);
    }
  };

  // Clear persisted movies when user logs out or changes
  useEffect(() => {
    const currentUserId = user?._id || null;
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== currentUserId) {
      localStorage.removeItem(STORAGE_KEY);
      setDisplayMovies([]);
      hasInitialLoad.current = false;
    }
    prevUserIdRef.current = currentUserId;
  }, [user?._id]);

  // Fetch total rankings count
  useEffect(() => {
    const fetchTotalRankings = async () => {
      try {
        const response = await api.get('/api/users/stats/total-rankings');
        setTotalRankings(response.data.totalRankings || 0);
      } catch (error) {
        console.error('Error fetching total rankings:', error);
      }
    };
    fetchTotalRankings();
  }, []);

  // Fetch genres list
  useEffect(() => {
    const fetchGenres = async () => {
      setGenresLoading(true);
      try {
        const response = await api.get('/api/movies/genres');
        if (response && response.data) {
          let genresList = null;
          if (response.data.genres && Array.isArray(response.data.genres)) {
            genresList = response.data.genres;
          } else if (Array.isArray(response.data)) {
            genresList = response.data;
          }
          if (genresList && genresList.length > 0) {
            const sorted = [...genresList].sort((a, b) => a.name.localeCompare(b.name));
            setGenres(sorted);
          } else {
            setGenres([]);
          }
        } else {
          setGenres([]);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
        const fallbackGenres = [
          { id: 28, name: 'Action' },
          { id: 35, name: 'Comedy' },
          { id: 18, name: 'Drama' },
          { id: 27, name: 'Horror' },
          { id: 10749, name: 'Romance' },
          { id: 878, name: 'Science Fiction' },
          { id: 53, name: 'Thriller' },
          { id: 12, name: 'Adventure' },
          { id: 16, name: 'Animation' },
          { id: 80, name: 'Crime' },
          { id: 14, name: 'Fantasy' },
          { id: 9648, name: 'Mystery' }
        ];
        setGenres(fallbackGenres);
      } finally {
        setGenresLoading(false);
      }
    };
    fetchGenres();
  }, []);

  // Load persisted movies on mount, or fetch if none exist (for authenticated users)
  useEffect(() => {
    if (isAuthenticated && activeTab === 1 && !hasInitialLoad.current) {
      hasInitialLoad.current = true;
      const persistedMovies = loadPersistedMovies();
      if (persistedMovies && persistedMovies.length > 0) {
        const ratedIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
        const filteredPersisted = persistedMovies.filter(movie => 
          movie && movie.id && !ratedIds.has(movie.id.toString())
        );
        if (filteredPersisted.length > 0) {
          setDisplayMovies(filteredPersisted.slice(0, 8));
          return;
        }
      }
      if (displayMovies.length === 0 && recommendedMovies.length === 0 && !loading) {
        const recentlyShown = getRecentlyShownMovies();
        getPersonalRecommendations(false, recentlyShown).then((result) => {
          if (result && result.results && result.results.length > 0) {
            const newMovieIds = result.results
              .slice(0, 8)
              .map(movie => movie.id)
              .filter(Boolean);
            const current = getRecentlyShownMovies();
            const newIds = newMovieIds.filter(id => !current.includes(id.toString()));
            if (newIds.length > 0) {
              addToRecentlyShown(newIds);
            }
          }
        });
      }
    }
  }, [isAuthenticated]);

  // Refresh recommendations when a movie is rated
  useEffect(() => {
    if (isAuthenticated && activeTab === 1 && rawRatings.length > 0) {
      const ratedIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
      const filteredDisplay = displayMovies.filter(movie => 
        movie && movie.id && !ratedIds.has(movie.id.toString())
      );
      if (filteredDisplay.length === 0 && displayMovies.length > 0) {
        localStorage.removeItem(STORAGE_KEY);
        setDisplayMovies([]);
        const timer = setTimeout(() => {
          getPersonalRecommendations();
        }, 1000);
        return () => clearTimeout(timer);
      } else if (filteredDisplay.length < displayMovies.length) {
        setDisplayMovies(filteredDisplay);
        savePersistedMovies(filteredDisplay);
      }
    }
  }, [rawRatings.length, isAuthenticated, activeTab]);

  const handleRatingComplete = () => {
    setRatingMovie(null);
    if (activeTab === 1) {
      setTimeout(() => {
        getPersonalRecommendations();
      }, 500);
    }
  };

  const handleRateClick = (movie) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent('/')}`;
      return;
    }
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'
    });
  };

  const handleRefresh = async () => {
    if (isRefreshing || loading) return;
    setIsRefreshing(true);
    try {
      const currentMovieIds = displayMovies.length > 0 
        ? displayMovies.slice(0, 8).map(movie => movie.id).filter(Boolean)
        : filteredRecommendedMovies.slice(0, 8).map(movie => movie.id).filter(Boolean);
      const recentlyShown = getRecentlyShownMovies();
      const allExcludeIds = [...currentMovieIds, ...recentlyShown];
      const result = await getPersonalRecommendations(true, allExcludeIds);
      if (result && result.results) {
        const newMovieIds = result.results
          .slice(0, 8)
          .map(movie => movie.id)
          .filter(Boolean);
        addToRecentlyShown(newMovieIds);
        const ratedIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
        const newFiltered = result.results.filter(movie => 
          movie && movie.id && !ratedIds.has(movie.id.toString())
        );
        if (newFiltered.length > 0) {
          const moviesToDisplay = newFiltered.slice(0, 8);
          setDisplayMovies(moviesToDisplay);
          savePersistedMovies(moviesToDisplay);
        }
      }
      hasInitialLoad.current = true;
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const ratedMovieIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
  const filteredRecommendedMovies = recommendedMovies.filter(movie => 
    movie && movie.id && !ratedMovieIds.has(movie.id.toString())
  );

  useEffect(() => {
    if (activeTab === 1) {
      if (!isRefreshing && filteredRecommendedMovies.length > 0 && displayMovies.length === 0) {
        const persistedMovies = loadPersistedMovies();
        if (!persistedMovies || persistedMovies.length === 0) {
          const moviesToDisplay = filteredRecommendedMovies.slice(0, 8);
          setDisplayMovies(moviesToDisplay);
          savePersistedMovies(moviesToDisplay);
        }
      }
    }
  }, [filteredRecommendedMovies, activeTab, isRefreshing, loading]);

  const MovieCard = ({ movie }) => (
    <Card sx={{ 
      maxWidth: { xs: '100%', sm: 300 }, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'rgba(26, 26, 26, 0.8)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 212, 255, 0.2)',
      borderRadius: { xs: 3, sm: 4 },
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      mb: { xs: 2, sm: 0 },
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-8px)' },
        boxShadow: { xs: 'none', sm: '0 20px 40px rgba(0, 212, 255, 0.3)' },
        border: { xs: '1px solid rgba(0, 212, 255, 0.2)', sm: '1px solid rgba(0, 212, 255, 0.5)' },
      }
    }}>
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height={{ xs: 300, sm: 400 }}
          image={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
          alt={movie.title}
          sx={{ 
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: { xs: 'none', sm: 'scale(1.05)' },
            }
          }}
        />
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          '&:hover': {
            opacity: { xs: 0, sm: 1 },
          }
        }} />
      </Box>
      <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
        <Typography gutterBottom variant="h6" component="h2" sx={{ 
          fontWeight: 600,
          color: '#ffffff',
          mb: 1.5,
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          lineHeight: 1.3
        }}>
          {movie.title}
        </Typography>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.6)',
          mb: 2,
          fontSize: { xs: '0.875rem', sm: '0.9rem' },
        }}>
          {new Date(movie.release_date).getFullYear()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Rating
            value={movie.vote_average / 2}
            precision={0.1}
            size="small"
            readOnly
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.25rem' },
              '& .MuiRating-iconFilled': {
                color: '#00d4ff',
              },
              '& .MuiRating-iconEmpty': {
                color: 'rgba(0, 212, 255, 0.3)',
              },
            }}
          />
          <Typography variant="body2" sx={{ 
            ml: 1,
            color: '#00d4ff',
            fontWeight: 600,
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
          }}>
            {movie.vote_average.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: 1.5,
          display: { xs: 'none', sm: '-webkit-box' },
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontSize: { xs: '0.875rem', sm: '0.875rem' },
        }}>
          {movie.overview}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: { xs: 2.5, sm: 3 }, pt: 0, gap: { xs: 1.5, sm: 1 }, flexDirection: { xs: 'column', sm: 'row' } }}>
        {activeTab === 1 && (() => {
          const isAlreadyRated = rawRatings.some(r => r.id?.toString() === movie.id?.toString());
          if (!isAuthenticated) {
            return (
              <Button
                size="medium"
                variant="outlined"
                startIcon={<StarIcon />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRateClick(movie);
                }}
                fullWidth
                sx={{
                  borderColor: '#00d4ff',
                  color: '#00d4ff',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 1 },
                  minHeight: { xs: 48, sm: 36 },
                  '&:hover': {
                    borderColor: '#66e0ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  },
                }}
              >
                Sign in to Rate
              </Button>
            );
          }
          return isAlreadyRated ? (
            <Button
              size="medium"
              variant="outlined"
              startIcon={<StarIcon />}
              disabled
              fullWidth
              sx={{
                borderColor: 'rgba(0, 212, 255, 0.3)',
                color: 'rgba(0, 212, 255, 0.5)',
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                py: { xs: 1.5, sm: 1 },
                minHeight: { xs: 48, sm: 36 },
                cursor: 'not-allowed',
              }}
            >
              Already Rated
            </Button>
          ) : (
            <Button
              size="medium"
              variant="outlined"
              startIcon={<StarIcon />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRatingMovie({
                  id: movie.id,
                  title: movie.title,
                  posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'
                });
              }}
              fullWidth
              sx={{
                borderColor: '#00d4ff',
                color: '#00d4ff',
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                py: { xs: 1.5, sm: 1 },
                minHeight: { xs: 48, sm: 36 },
                '&:hover': {
                  borderColor: '#66e0ff',
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                },
              }}
            >
              Rate
            </Button>
          );
        })()}
        <Button
          size="medium"
          component={Link}
          to={`/movie/${movie.id}`}
          variant="contained"
          fullWidth
          sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            borderRadius: 2,
            py: { xs: 1.5, sm: 1 },
            fontWeight: 600,
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            minHeight: { xs: 48, sm: 36 },
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ 
      height: !isAuthenticated ? '100vh' : 'auto',
      minHeight: isAuthenticated ? '100vh' : '100vh',
      maxHeight: !isAuthenticated ? '100vh' : 'none',
      overflow: !isAuthenticated ? 'hidden' : 'visible',
      background: isAuthenticated ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' : 'transparent',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      '&::before': isAuthenticated ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 1,
      } : {},
    }}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: !isAuthenticated ? { xs: 2, sm: 3 } : { xs: 4, sm: 6, md: 8 }, 
          px: { xs: 2, sm: 3 }, 
          position: 'relative', 
          zIndex: 2,
          height: !isAuthenticated ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: !isAuthenticated ? 'center' : 'flex-start',
          overflow: !isAuthenticated ? 'hidden' : 'visible',
        }}
      >
        <Box sx={{ 
          mb: !isAuthenticated ? { xs: 2, sm: 3 } : { xs: 4, sm: 6 }, 
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <Typography variant="h1" component="h1" gutterBottom sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: !isAuthenticated ? 1 : 2,
            fontSize: !isAuthenticated 
              ? { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
              : { xs: '2rem', sm: '3rem', md: '4rem' },
          }}>
            Welcome to ReelList
          </Typography>
          <Typography variant="h5" align="center" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            mb: !isAuthenticated ? 1 : 2,
            fontWeight: 300,
            fontSize: !isAuthenticated 
              ? { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
              : { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
            px: { xs: 2, sm: 0 }
          }}>
            Discover, rate, and share your favorite movies with friends
          </Typography>
          {totalRankings > 0 && (
            <Typography variant="body1" align="center" sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              mb: !isAuthenticated ? 2 : 4,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 2, sm: 0 }
            }}>
              {totalRankings.toLocaleString()} movies ranked by our community
            </Typography>
          )}
        </Box>

        <Box sx={{ 
          mb: !isAuthenticated ? 2 : 3,
          flex: !isAuthenticated ? '1 1 auto' : '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          {isAuthenticated && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4, gap: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => {
                  setActiveTab(newValue);
                  const newSearchParams = new URLSearchParams(searchParams);
                  newSearchParams.set('tab', newValue.toString());
                  setSearchParams(newSearchParams);
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 600,
                    textTransform: 'none',
                    minWidth: { xs: 120, sm: 200 },
                    px: { xs: 2, sm: 3 },
                    '&.Mui-selected': {
                      color: '#00d4ff',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                    height: 3,
                  },
                }}
              >
                <Tab label="Suggested for You" value={1} />
                <Tab label="Find by Genre" value={2} />
              </Tabs>
              {activeTab === 1 && (
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}
                  sx={{
                    color: '#00d4ff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                    ...(isRefreshing && {
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }),
                  }}
                  title="Refresh recommendations"
                >
                  <RefreshIcon />
                </IconButton>
              )}
            </Box>
          )}

          {isAuthenticated && activeTab === 2 ? (
            <Box>
              {genresLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                  <CircularProgress />
                </Box>
              ) : genres.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, width: '100%', px: { xs: 2, sm: 0 } }}>
                  <Typography variant="h6" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    mb: 2,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    No genres available
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Unable to load genres. Please try refreshing the page.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
                  {genres.map((genre) => (
                    <Grid item xs={6} sm={6} md={4} lg={3} key={genre.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: 'rgba(26, 26, 26, 0.8)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(0, 212, 255, 0.2)',
                          borderRadius: { xs: 3, sm: 4 },
                          maxWidth: { xs: '100%', sm: 300 },
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: { xs: 80, sm: 100 },
                          '&:hover': {
                            transform: { xs: 'none', sm: 'translateY(-8px)' },
                            boxShadow: { xs: 'none', sm: '0 20px 40px rgba(0, 212, 255, 0.3)' },
                            border: { xs: '1px solid rgba(0, 212, 255, 0.2)', sm: '1px solid rgba(0, 212, 255, 0.5)' },
                          },
                        }}
                        onClick={() => navigate(`/genre/${genre.id}?name=${encodeURIComponent(genre.name)}`)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 2.5 }, width: '100%' }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: '1rem', sm: '1.125rem' },
                              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}
                          >
                            {genre.name}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          ) : isAuthenticated ? (
            loading && !isRefreshing && displayMovies.length === 0 && filteredRecommendedMovies.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  opacity: isRefreshing ? 0.5 : 1,
                  transition: 'opacity 0.3s ease-in-out',
                  position: 'relative',
                }}
              >
                {isRefreshing && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CircularProgress size={40} />
                  </Box>
                )}
                <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
                  {(displayMovies.length > 0 ? displayMovies : filteredRecommendedMovies)
                    .slice(0, 8)
                    .map((movie) => (
                      <Grid item xs={6} sm={6} md={4} lg={3} key={movie.id}>
                        <MovieCard movie={movie} />
                      </Grid>
                    ))}
                  {displayMovies.length === 0 && filteredRecommendedMovies.length === 0 && !loading && (
                    <Box sx={{ textAlign: 'center', py: 8, width: '100%', px: { xs: 2, sm: 0 } }}>
                      <Typography variant="h6" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        mb: 2,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}>
                        {recommendedMovies.length > 0 
                          ? "You've rated all the recommended movies! Click refresh to get new suggestions."
                          : "Rate some movies to get personalized recommendations!"
                        }
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}>
                        {recommendedMovies.length > 0
                          ? "Keep rating movies to discover more great films!"
                          : "Start rating movies and we'll suggest similar ones you might enjoy."
                        }
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Box>
            )
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: { xs: 2, sm: 3 }, 
              width: '100%', 
              px: { xs: 2, sm: 0 },
              flexShrink: 0,
            }}>
              <Typography variant="h6" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                mb: 1.5,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                Start rating to see recommendations
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                mb: 2
              }}>
                Sign in and rate movies to get personalized recommendations!
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/login"
                sx={{
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                  px: { xs: 3, sm: 5 },
                  py: { xs: 1.25, sm: 1.75 },
                  fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
                  mt: 1
                }}
              >
                Sign In to Get Started
              </Button>
            </Box>
          )}
        </Box>
      </Container>

      {ratingMovie && (
        <RatingModal
          open={!!ratingMovie}
          movie={ratingMovie}
          onClose={() => setRatingMovie(null)}
          onComplete={handleRatingComplete}
        />
      )}
    </Box>
  );
};

export default Home;
