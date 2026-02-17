import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const { trendingMovies, recommendedMovies, getTrendingMovies, getPersonalRecommendations, loading } = useMovies();
  const { isAuthenticated } = useAuth();
  const { rawRatings } = useRatings();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ratingMovie, setRatingMovie] = useState(null);

  useEffect(() => {
    // Always load trending movies, regardless of authentication
    getTrendingMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 1) {
      getPersonalRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated, refreshKey]);

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

  const handleRefresh = () => {
    // Clear current recommendations and fetch fresh ones
    setRefreshKey(prev => prev + 1);
    getPersonalRecommendations(true); // Pass true to force refresh
  };

  // Filter out already-rated movies from recommendations
  const ratedMovieIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
  const filteredRecommendedMovies = recommendedMovies.filter(movie => 
    movie && movie.id && !ratedMovieIds.has(movie.id.toString())
  );

  

  const MovieCard = ({ movie }) => (
    <Card sx={{ 
      maxWidth: { xs: '100%', sm: 300 }, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'rgba(26, 26, 26, 0.8)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 212, 255, 0.2)',
      borderRadius: 4,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
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
      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Typography gutterBottom variant="h6" component="h2" sx={{ 
          fontWeight: 600,
          color: '#ffffff',
          mb: 1,
          fontSize: { xs: '1rem', sm: '1.25rem' },
        }}>
          {movie.title}
        </Typography>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.6)',
          mb: 2,
          fontSize: { xs: '0.8rem', sm: '0.9rem' },
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
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}>
            {movie.vote_average.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: 1.4,
          display: { xs: 'none', sm: '-webkit-box' },
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontSize: { xs: '0.8rem', sm: '0.875rem' },
        }}>
          {movie.overview}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
        {activeTab === 1 && (
          <Button
            size="small"
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
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 0.75, sm: 1 },
              '&:hover': {
                borderColor: '#66e0ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
              },
            }}
          >
            Rate
          </Button>
        )}
        <Button
          size="small"
          component={Link}
          to={`/movie/${movie.id}`}
          variant="contained"
          fullWidth
          sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            borderRadius: 2,
            py: { xs: 0.75, sm: 1 },
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
            {/* MovieRate Logo - Large and Centered */}
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
                  MovieRate
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
                Welcome to MovieRate
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
                  <Tab label="Trending This Week" />
                  <Tab label="Suggested for You" />
                </Tabs>
                {activeTab === 1 && (
                  <IconButton
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{
                      color: '#00d4ff',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                    title="Refresh recommendations"
                  >
                    <RefreshIcon />
                  </IconButton>
                )}
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
                  {(activeTab === 0 ? trendingMovies : filteredRecommendedMovies)
                    .slice(0, 8)
                    .map((movie) => (
                      <Grid item xs={6} sm={6} md={4} lg={3} key={movie.id}>
                        <MovieCard movie={movie} />
                      </Grid>
                    ))}
                  {activeTab === 1 && filteredRecommendedMovies.length === 0 && (
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
