import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';

const MovieDetail = () => {
  const { movieId } = useParams();
  const { getMovieDetails } = useMovies();
  const { ratings, rawRatings, computeScore } = useRatings();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  // Check if movie is already rated (handle both number and string IDs)
  const movieIdNum = parseInt(movieId);
  const movieRating = rawRatings.find(r => {
    const rId = typeof r.id === 'string' ? parseInt(r.id) : r.id;
    return rId === movieIdNum || r.id?.toString() === movieId?.toString();
  });
  const ratingIndex = rawRatings.findIndex(r => {
    const rId = typeof r.id === 'string' ? parseInt(r.id) : r.id;
    return rId === movieIdNum || r.id?.toString() === movieId?.toString();
  });
  const currentScore = ratingIndex >= 0 ? computeScore(ratingIndex, rawRatings.length) : null;

  useEffect(() => {
    fetchMovieDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  const handleRatingComplete = () => {
    setShowRatingModal(false);
  };

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const movieData = await getMovieDetails(movieId);
      setMovie(movieData);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!movie) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Movie not found
        </Typography>
      </Container>
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
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
            }}>
              <CardMedia
                component="img"
                height={{ xs: 400, sm: 500, md: 600 }}
                image={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg'}
                alt={movie.title}
                sx={{ borderRadius: 4 }}
              />
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom sx={{ 
              color: '#ffffff',
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
            }}>
              {movie.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
              {movie.imdbRating ? (
                <>
                  <Box
                    component="img"
                    src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                    alt="IMDB"
                    sx={{
                      height: 32,
                      width: 'auto',
                    }}
                  />
                  <Typography variant="h5" sx={{ 
                    color: '#f5c518',
                    fontWeight: 700,
                  }}>
                    {movie.imdbRating.toFixed(1)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                }}>
                  IMDB rating not available
                </Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom sx={{ 
              color: '#ffffff',
              mb: 2,
            }}>
              Description
            </Typography>
            <Typography variant="body1" paragraph sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.8,
              mb: 4,
            }}>
              {movie.overview}
            </Typography>

            {movieRating && currentScore !== null ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Your Rating: ${currentScore.toFixed(1)}/10`}
                    sx={{
                      background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      px: 2,
                      py: 2.5,
                    }}
                  />
                  <Chip
                    label={`Rank: #${ratingIndex + 1}`}
                    sx={{
                      backgroundColor: 'rgba(0, 212, 255, 0.2)',
                      color: '#00d4ff',
                      border: '1px solid rgba(0, 212, 255, 0.5)',
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Star />}
                  size="large"
                  onClick={() => setShowRatingModal(true)}
                  sx={{
                    borderColor: '#00d4ff',
                    color: '#00d4ff',
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.25, sm: 1.5 },
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                    fontWeight: 600,
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': {
                      borderColor: '#66e0ff',
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    },
                  }}
                >
                  Rerate This Movie
                </Button>
              </Box>
            ) : (
              <Button
                variant={movieRating ? "outlined" : "contained"}
                startIcon={<Star />}
                size="large"
                onClick={() => !movieRating && setShowRatingModal(true)}
                disabled={!!movieRating}
                sx={{
                  ...(movieRating ? {
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    color: 'rgba(0, 212, 255, 0.5)',
                    cursor: 'not-allowed',
                  } : {
                    background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00a8cc, #e64a19)',
                    },
                  }),
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                  fontWeight: 600,
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                {movieRating ? 'Already Rated' : 'Rate This Movie'}
              </Button>
            )}
          </Grid>
        </Grid>

        {showRatingModal && (
          <RatingModal
            open={showRatingModal}
            movie={{
              id: movie.id || movie.tmdbId,
              title: movie.title,
              posterUrl: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg',
            }}
            onClose={() => setShowRatingModal(false)}
            onComplete={handleRatingComplete}
            allowRerate={false}
          />
        )}
      </Container>
    </Box>
  );
};

export default MovieDetail;
