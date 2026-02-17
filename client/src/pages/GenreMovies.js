import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
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
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Star as StarIcon } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';
import api from '../config/axios';

const GenreMovies = () => {
  const { genreId } = useParams();
  const [searchParams] = useSearchParams();
  const genreName = searchParams.get('name') || 'Genre';
  const navigate = useNavigate();
  const { getMoviesByGenre } = useMovies();
  const { isAuthenticated } = useAuth();
  const { rawRatings } = useRatings();
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [ratingMovie, setRatingMovie] = useState(null);

  useEffect(() => {
    loadMovies(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreId]);

  const loadMovies = async (nextPage, replace = false) => {
    if (!genreId) return;
    
    setLoading(true);
    try {
      // Use the API endpoint that sorts by rating
      const response = await api.get(`/api/movies/genre/${genreId}/highly-rated?page=${nextPage}`);
      const newMovies = response.data.results || [];
      setMovies(prev => (replace ? newMovies : [...prev, ...newMovies]));
      // Check if there are more pages available
      const totalPages = response.data.total_pages || 0;
      setHasMore(nextPage < totalPages && newMovies.length > 0);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading genre movies:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRateClick = (movie) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/genre/${genreId}?name=${encodeURIComponent(genreName)}`)}`;
      return;
    }
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'
    });
  };

  const handleRatingComplete = () => {
    setRatingMovie(null);
  };

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
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 3, sm: 4 }, gap: 2 }}>
          <IconButton
            onClick={() => navigate('/?tab=2')}
            sx={{
              color: '#00d4ff',
              '&:hover': {
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h2" sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            {genreName} Movies
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          mb: { xs: 3, sm: 4 },
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}>
          Popular {genreName} movies
        </Typography>

        {loading && movies.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
              {movies.map((movie) => {
                const isAlreadyRated = rawRatings.some(r => r.id?.toString() === movie.id?.toString());
                return (
                  <Grid key={movie.id} item xs={12} sm={6} md={4} lg={4}>
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
                          height={{ xs: 250, sm: 300 }}
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
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
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
                            {movie.vote_average?.toFixed(1) || 'N/A'}
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
                        {isAuthenticated ? (
                          isAlreadyRated ? (
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
                              onClick={() => handleRateClick(movie)}
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
                          )
                        ) : (
                          <Button
                            size="medium"
                            variant="outlined"
                            startIcon={<StarIcon />}
                            onClick={() => handleRateClick(movie)}
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
                        )}
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
                  </Grid>
                );
              })}
            </Grid>

            {movies.length > 0 && hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 } }}>
                <Button
                  variant="outlined"
                  onClick={() => loadMovies(page + 1)}
                  disabled={loading}
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1, sm: 1.25 },
                    borderColor: '#00d4ff',
                    color: '#00d4ff',
                    '&:hover': {
                      borderColor: '#66e0ff',
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={18} /> : 'Load More'}
                </Button>
              </Box>
            )}
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

export default GenreMovies;

