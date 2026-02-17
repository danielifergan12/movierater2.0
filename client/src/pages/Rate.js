import React, { useEffect, useState } from 'react';
 
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
  CircularProgress
} from '@mui/material';
import api from '../config/axios';
import RatingModal from '../components/RatingModal';
import { useRatings } from '../hooks/useRatings';

const Rate = () => {
  const { rawRatings } = useRatings();
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [ratingMovie, setRatingMovie] = useState(null);

  useEffect(() => {
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 

  const loadPage = async (nextPage, replace = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/movies/popular?page=${nextPage}`);
      const newMovies = res.data.results || [];
      setMovies(prev => (replace ? newMovies : [...prev, ...newMovies]));
      setHasMore(newMovies.length > 0);
      setPage(nextPage);
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const openRate = (movie) => {
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg',
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: movie.vote_average,
    });
  };

  const handleRatingComplete = () => {
    setRatingMovie(null);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
    }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
          <Typography variant="h2" sx={{ 
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
          }}>
            Rate Movies
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255,255,255,0.7)',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Click a movie to add it to your personal ranking
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {movies.map((movie) => (
            <Grid key={movie.id} item xs={6} sm={6} md={4} lg={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height={{ xs: 250, sm: 300, md: 360 }}
                  image={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
                  alt={movie.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="h6" noWrap sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
                  }}>
                    {movie.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Rating value={(movie.vote_average || 0) / 2} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" sx={{ 
                      ml: 1,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {(movie.vote_average || 0).toFixed(1)}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: { xs: 1.5, sm: 2 }, pt: 0 }}>
                  {(() => {
                    const isAlreadyRated = rawRatings.some(r => r.id?.toString() === movie.id?.toString());
                    return (
                      <Button 
                        fullWidth 
                        variant={isAlreadyRated ? "outlined" : "contained"}
                        onClick={() => !isAlreadyRated && openRate(movie)}
                        disabled={isAlreadyRated}
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          py: { xs: 0.75, sm: 1 },
                          ...(isAlreadyRated && {
                            borderColor: 'rgba(0, 212, 255, 0.3)',
                            color: 'rgba(0, 212, 255, 0.5)',
                            cursor: 'not-allowed',
                          })
                        }}
                      >
                        {isAlreadyRated ? 'Already Rated' : 'Rate'}
                      </Button>
                    );
                  })()}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 } }}>
          <Button
            variant="outlined"
            onClick={() => loadPage(page + 1)}
            disabled={!hasMore || loading}
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              px: { xs: 3, sm: 4 },
              py: { xs: 1, sm: 1.25 }
            }}
          >
            {loading ? <CircularProgress size={18} /> : hasMore ? 'Load More' : 'No More'}
          </Button>
        </Box>
      </Container>

      {ratingMovie && (
        <RatingModal
          open={Boolean(ratingMovie)}
          movie={ratingMovie}
          onClose={() => setRatingMovie(null)}
          onComplete={handleRatingComplete}
        />
      )}

      
    </Box>
  );
};

export default Rate;
