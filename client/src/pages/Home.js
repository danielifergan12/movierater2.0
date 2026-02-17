import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  IconButton
} from '@mui/material';
import { Refresh as RefreshIcon, Star as StarIcon, Movie as MovieIcon } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';

const Home = () => {
  const location = useLocation();
  const { trendingMovies, recommendedMovies, getTrendingMovies, getPersonalRecommendations, loading } = useMovies();
  const { isAuthenticated } = useAuth();
  const { rawRatings } = useRatings();
  const [activeTab, setActiveTab] = useState(1);
  const [ratingMovie, setRatingMovie] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayMovies, setDisplayMovies] = useState([]);
  const hasInitialLoad = useRef(false);

  // Ensure component responds to route changes for proper navigation
  const [, setRouteUpdate] = useState(0);
  useEffect(() => {
    // Force a state update when location changes to ensure React Router detects navigation
    // This is especially important when activeTab === 0 (Trending) where there are no other state updates
    setRouteUpdate(prev => prev + 1);
  }, [location.pathname]);

  // Helper functions to manage recently shown movies in localStorage
  const getRecentlyShownMovies = () => {
    try {
      const stored = localStorage.getItem('recentlyShownMovies');
      if (stored) {
        const data = JSON.parse(stored);
        // Return array of movie IDs (keep only last 15 refreshes = 120 movies max)
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
      // Keep only last 15 refreshes (15 * 8 = 120 movies)
      const trimmed = updated.slice(-120);
      localStorage.setItem('recentlyShownMovies', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving recently shown movies:', error);
    }
  };


  // Only fetch recommendations on initial mount if we don't have data
  useEffect(() => {
    if (isAuthenticated && activeTab === 1 && !hasInitialLoad.current && 
        displayMovies.length === 0 && recommendedMovies.length === 0 && !loading) {
      hasInitialLoad.current = true;
      // Get recently shown movies to exclude
      const recentlyShown = getRecentlyShownMovies();
      getPersonalRecommendations(false, recentlyShown).then((result) => {
        // Track all movies that are shown (from initial load or refresh)
        // This ensures they won't appear again for at least 15 refreshes
        if (result && result.results && result.results.length > 0) {
          const newMovieIds = result.results
            .slice(0, 8)
            .map(movie => movie.id)
            .filter(Boolean);
          // Only add if we have new movies (avoid duplicates)
          const current = getRecentlyShownMovies();
          const newIds = newMovieIds.filter(id => !current.includes(id.toString()));
          if (newIds.length > 0) {
            addToRecentlyShown(newIds);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Refresh recommendations when a movie is rated
  useEffect(() => {
    if (isAuthenticated && activeTab === 1 && rawRatings.length > 0) {
      // Small delay to ensure server has updated ratings
      const timer = setTimeout(() => {
        getPersonalRecommendations();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRatings.length, isAuthenticated, activeTab]);

  const handleRatingComplete = () => {
    setRatingMovie(null);
    // Refresh recommendations after rating
    if (activeTab === 1) {
      setTimeout(() => {
        getPersonalRecommendations();
      }, 500);
    }
  };

  const handleRefresh = async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing || loading) return;
    
    setIsRefreshing(true);
    
    try {
      // Get current movie IDs to exclude from new recommendations (use displayMovies to avoid stale data)
      const currentMovieIds = displayMovies.length > 0 
        ? displayMovies.slice(0, 8).map(movie => movie.id).filter(Boolean)
        : filteredRecommendedMovies.slice(0, 8).map(movie => movie.id).filter(Boolean);
      
      // Get recently shown movies to exclude (from last 15 refreshes)
      const recentlyShown = getRecentlyShownMovies();
      
      // Combine current and recently shown movies
      const allExcludeIds = [...currentMovieIds, ...recentlyShown];
      
      // Fetch new recommendations with forceRefresh to get fresh data
      const result = await getPersonalRecommendations(true, allExcludeIds);
      
      // After getting new recommendations, add them to recently shown list
      if (result && result.results) {
        const newMovieIds = result.results
          .slice(0, 8)
          .map(movie => movie.id)
          .filter(Boolean);
        addToRecentlyShown(newMovieIds);
        
        // Update displayMovies atomically after new data is ready
        // Filter out already-rated movies before setting
        const ratedIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
        const newFiltered = result.results.filter(movie => 
          movie && movie.id && !ratedIds.has(movie.id.toString())
        );
        // Only update if we have new movies, otherwise keep current displayMovies
        if (newFiltered.length > 0) {
          setDisplayMovies(newFiltered.slice(0, 8));
        }
      }
      // Mark that we've done an initial load so it won't auto-fetch again
      hasInitialLoad.current = true;
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter out already-rated movies from recommendations
  const ratedMovieIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
  const filteredRecommendedMovies = recommendedMovies.filter(movie => 
    movie && movie.id && !ratedMovieIds.has(movie.id.toString())
  );

  // Use displayMovies to prevent flickering during refresh
  // Keep old movies visible during refresh, only update when refresh completes
  useEffect(() => {
    if (activeTab === 1) {
      // Only update displayMovies when not refreshing (smooth transition)
      // During refresh, keep showing old movies until new ones are ready
      if (!isRefreshing && filteredRecommendedMovies.length > 0) {
        // Only update if the movies have actually changed (by comparing IDs)
        const currentIds = displayMovies.map(m => m.id).sort().join(',');
        const newIds = filteredRecommendedMovies.slice(0, 8).map(m => m.id).sort().join(',');
        if (currentIds !== newIds) {
          setDisplayMovies(filteredRecommendedMovies.slice(0, 8));
        }
      } else if (filteredRecommendedMovies.length > 0 && displayMovies.length === 0 && !loading) {
        // Initial load - set display movies only when loading is complete
        setDisplayMovies(filteredRecommendedMovies.slice(0, 8));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // Check if movie is already rated
          const isAlreadyRated = rawRatings.some(r => r.id?.toString() === movie.id?.toString());
          
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
      minHeight: '100vh',
      background: isAuthenticated ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' : 'transparent',
      position: 'relative',
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
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 2 }}>
        {!isAuthenticated ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 4
          }}>
            {/* ReelList Logo - Large and Centered */}
            <Box sx={{ 
              textAlign: 'center', 
              mb: { xs: 2, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: { xs: 1.5, sm: 2 },
                mb: 2
              }}>
                <MovieIcon sx={{ 
                  color: '#00d4ff', 
                  fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                  filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.5))'
                }} />
                <Typography variant="h1" component="h1" sx={{
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                  letterSpacing: { xs: '0.05em', sm: '0.1em' },
                  textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                }}>
                  ReelList
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/login"
              sx={{ 
                px: { xs: 4, sm: 6 }, 
                py: { xs: 1.5, sm: 2 }, 
                fontSize: { xs: '1rem', sm: '1.2rem' },
                minWidth: { xs: 150, sm: 200 },
                width: { xs: '100%', sm: 'auto' },
                maxWidth: { xs: 300, sm: 'none' }
              }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/register"
              sx={{ 
                px: { xs: 4, sm: 6 }, 
                py: { xs: 1.5, sm: 2 }, 
                fontSize: { xs: '1rem', sm: '1.2rem' },
                minWidth: { xs: 150, sm: 200 },
                width: { xs: '100%', sm: 'auto' },
                maxWidth: { xs: 300, sm: 'none' }
              }}
            >
              Sign Up
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: { xs: 4, sm: 6 }, textAlign: 'center' }}>
              <Typography variant="h1" component="h1" gutterBottom sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
              }}>
                Welcome to ReelList
              </Typography>
              <Typography variant="h5" align="center" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 4,
                fontWeight: 300,
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                px: { xs: 2, sm: 0 }
              }}>
                Discover, rate, and share your favorite movies with friends
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4, gap: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
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
                  <Tab label="Suggested for You" />
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

              {loading && !isRefreshing && displayMovies.length === 0 ? (
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
                  {activeTab === 1 && displayMovies.length === 0 && filteredRecommendedMovies.length === 0 && !loading && (
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
              )}
            </Box>
          </>
        )}
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
