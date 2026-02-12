import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Typography,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Star as StarIcon } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from './RatingModal';
import api from '../config/axios';

const MovieSearchRanking = ({ onRatingComplete }) => {
  const { searchMovies, searchResults, loading } = useMovies();
  const { rawRatings } = useRatings();
  const [query, setQuery] = useState('');
  const [ratingMovie, setRatingMovie] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Perform search with debounce
  useEffect(() => {
    if (query.trim().length >= 2) {
      const debounceTimer = setTimeout(() => {
        searchMovies(query, 1);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [query, searchMovies]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  const handleRateClick = (movie) => {
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg',
      releaseDate: movie.release_date,
      genres: movie.genre_ids || []
    });
    setShowRatingModal(true);
  };

  const handleRatingComplete = () => {
    setShowRatingModal(false);
    setRatingMovie(null);
    if (onRatingComplete) {
      onRatingComplete();
    }
  };

  const ratedMovieIds = new Set(rawRatings.map(r => String(r.id)));
  const filteredResults = searchResults.filter(movie => 
    movie && movie.id && !ratedMovieIds.has(String(movie.id))
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search for a movie to rank..."
          value={query}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 3,
              color: '#ffffff',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: '2px solid #00d4ff',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)',
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* Search Results */}
      {loading && query.trim().length >= 2 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : query.trim().length >= 2 && filteredResults.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 2,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            No movies found
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            Try a different search term
          </Typography>
        </Box>
      ) : query.trim().length < 2 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 2,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            Search for movies to rank
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            Type at least 2 characters to search
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {filteredResults.slice(0, 12).map((movie) => (
            <Grid item xs={6} sm={4} md={3} key={movie.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(26, 26, 26, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 212, 255, 0.3)',
                    border: '1px solid rgba(0, 212, 255, 0.5)',
                  },
                }}
              >
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    height="400"
                    image={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : '/placeholder-movie.jpg'
                    }
                    alt={movie.title}
                    sx={{
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="h2"
                    sx={{
                      fontWeight: 600,
                      color: '#ffffff',
                      mb: 1,
                      fontSize: '1rem',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {movie.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : 'N/A'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="medium"
                    variant="contained"
                    startIcon={<StarIcon />}
                    onClick={() => handleRateClick(movie)}
                    fullWidth
                    sx={{
                      background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      py: 1,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #66e0ff, #ff8a65)',
                      },
                    }}
                  >
                    Rate This Movie
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Rating Modal */}
      {ratingMovie && (
        <RatingModal
          open={showRatingModal}
          movie={ratingMovie}
          onClose={() => {
            setShowRatingModal(false);
            setRatingMovie(null);
          }}
          onComplete={handleRatingComplete}
        />
      )}
    </Box>
  );
};

export default MovieSearchRanking;


