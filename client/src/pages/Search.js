import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  TextField,
  Box,
  Rating,
  CircularProgress,
  Pagination,
  InputAdornment,
  Button
} from '@mui/material';
import { Search as SearchIcon, Star } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchMovies, searchResults, loading } = useMovies();
  const { rawRatings } = useRatings();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingMovie, setRatingMovie] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Sync query from URL params when they change (e.g., when navigating from navbar search)
  useEffect(() => {
    const currentUrlQuery = searchParams.get('q') || '';
    if (currentUrlQuery !== query) {
      setQuery(currentUrlQuery);
      setPage(1);
    }
  }, [searchParams]);

  // Perform search when query or page changes (with debounce for typing)
  useEffect(() => {
    if (query.trim().length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 500); // 500ms debounce
      
      return () => clearTimeout(debounceTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page]);

  const performSearch = async () => {
    const result = await searchMovies(query, page);
    if (result && result.total_pages) {
      setTotalPages(result.total_pages);
    }
  };

  const handleSearchChange = (e) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);
    setPage(1);
    // Update URL params but don't require minimum length for display
    if (searchQuery.trim().length >= 2) {
      setSearchParams({ q: searchQuery.trim() });
    } else if (searchQuery.length === 0) {
      setSearchParams({});
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRatingComplete = () => {
    setShowRatingModal(false);
    setRatingMovie(null);
  };

  const handleRateClick = (movie) => {
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg',
    });
    setShowRatingModal(true);
  };

  const MovieCard = ({ movie }) => {
    // Check if movie is already rated
    const movieIdNum = parseInt(movie.id);
    const isRated = rawRatings.some(r => {
      const rId = typeof r.id === 'string' ? parseInt(r.id) : r.id;
      return rId === movieIdNum || r.id?.toString() === movie.id?.toString();
    });

    return (
    <Card sx={{ 
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
      <CardMedia
        component="img"
        height={{ xs: 300, sm: 350, md: 400 }}
        image={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
        alt={movie.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
        <Typography gutterBottom variant="h6" component="h2" sx={{ 
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 600,
          color: '#ffffff',
          mb: 1.5,
          lineHeight: 1.3
        }}>
          {movie.title}
        </Typography>
        <Typography variant="body2" sx={{ 
          mb: 2,
          fontSize: { xs: '0.875rem', sm: '0.9rem' },
          color: 'rgba(255, 255, 255, 0.6)'
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
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            color: '#00d4ff',
            fontWeight: 600
          }}>
            {movie.vote_average.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ 
          display: { xs: 'none', sm: '-webkit-box' },
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontSize: { xs: '0.875rem', sm: '0.875rem' },
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: 1.5
        }}>
          {movie.overview}
        </Typography>
      </CardContent>
      <Box sx={{ p: { xs: 2.5, sm: 3 }, pt: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          variant={isRated ? "outlined" : "contained"}
          startIcon={<Star />}
          onClick={() => handleRateClick(movie)}
          fullWidth
          sx={{
            ...(isRated ? {
              borderColor: '#00d4ff',
              color: '#00d4ff',
              '&:hover': {
                borderColor: '#66e0ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
              },
            } : {
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #00a8cc, #e64a19)',
              },
            }),
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            fontWeight: 600,
            py: { xs: 1.25, sm: 1 },
            minHeight: { xs: 44, sm: 36 },
          }}
        >
          {isRated ? 'Rerate' : 'Rate'}
        </Button>
        <Link
          to={`/movie/${movie.id}`}
          style={{ textDecoration: 'none' }}
        >
          <Box
            sx={{
              width: '100%',
              py: { xs: 1.25, sm: 1 },
              px: { xs: 2, sm: 2 },
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              color: '#00d4ff',
              borderRadius: 2,
              textAlign: 'center',
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              fontWeight: 600,
              minHeight: { xs: 44, sm: 36 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'scale(1.05)' },
                backgroundColor: 'rgba(0, 212, 255, 0.2)',
                borderColor: 'rgba(0, 212, 255, 0.5)',
              },
            }}
          >
            View Details
          </Box>
        </Link>
      </Box>
    </Card>
    );
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
        zIndex: 1,
      },
    }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 }
        }}>
          Search Movies
        </Typography>

      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <TextField
          fullWidth
          placeholder="Search for movies..."
          value={query}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#00d4ff' }} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            mb: 2,
            '& .MuiInputBase-root': {
              fontSize: { xs: '1rem', sm: '1rem' },
              minHeight: { xs: 56, sm: 56 }
            },
            '& .MuiInputLabel-root': {
              fontSize: { xs: '1rem', sm: '1rem' }
            },
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(0, 212, 255, 0.05)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              '& fieldset': {
                borderColor: 'rgba(0, 212, 255, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 212, 255, 0.6)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00d4ff',
              },
            },
          }}
        />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      )}

      {!loading && query && searchResults.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No movies found for "{query}"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try a different search term
          </Typography>
        </Box>
      )}

      {!loading && searchResults.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            mb: { xs: 2, sm: 3 }
          }}>
            Search Results for "{query}" ({searchResults.length} movies)
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {searchResults.map((movie) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={movie.id}>
                <MovieCard movie={movie} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 } }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={{ xs: 'small', sm: 'large' }}
              />
            </Box>
          )}
        </>
      )}

      {!loading && !query && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 2,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Start typing to search for movies
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}>
            Discover your next favorite movie!
          </Typography>
        </Box>
      )}

      {showRatingModal && ratingMovie && (
        <RatingModal
          open={showRatingModal}
          movie={ratingMovie}
          onClose={() => {
            setShowRatingModal(false);
            setRatingMovie(null);
          }}
          onComplete={handleRatingComplete}
          allowRerate={true}
        />
      )}
      </Container>
    </Box>
  );
};

export default Search;
