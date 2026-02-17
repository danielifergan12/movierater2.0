import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Box,
  Rating,
  Button,
  CircularProgress,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import RatingModal from '../components/RatingModal';

const MovieDetail = () => {
  const { movieId } = useParams();
  const { getMovieDetails } = useMovies();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    fetchMovieDetails();
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!movie) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4">Movie not found</Typography>
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
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
            }}>
              <CardMedia
                component="img"
                height="600"
                image={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg'}
                alt={movie.title}
                sx={{ borderRadius: 4 }}
              />
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom sx={{ 
              color: '#ffffff',
              mb: 3,
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

            <Button
              variant="contained"
              startIcon={<Star />}
              size="large"
              onClick={() => setShowRatingModal(true)}
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(45deg, #00a8cc, #e64a19)',
                },
              }}
            >
              Rate This Movie
            </Button>
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
          />
        )}
      </Container>
    </Box>
  );
};

export default MovieDetail;
