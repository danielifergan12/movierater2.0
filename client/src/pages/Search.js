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
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchMovies, searchResults, loading } = useMovies();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync query from URL params when they change (e.g., when navigating from navbar search)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      setPage(1);
    }
  }, [searchParams]);

  // Perform search when query or page changes
  useEffect(() => {
    if (query.trim()) {
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page]);

  const performSearch = async () => {
    const result = await searchMovies(query, page);
    if (result && result.total_pages) {
      setTotalPages(result.total_pages);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const searchQuery = e.target.value.trim();
      if (searchQuery) {
        setQuery(searchQuery);
        setPage(1);
        setSearchParams({ q: searchQuery });
      }
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const MovieCard = ({ movie }) => (
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
      <Box sx={{ p: { xs: 2.5, sm: 3 }, pt: 0 }}>
        <Link
          to={`/movie/${movie.id}`}
          style={{ textDecoration: 'none' }}
        >
          <Box
            sx={{
              width: '100%',
              py: { xs: 1.5, sm: 1 },
              px: { xs: 2, sm: 2 },
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              color: 'white',
              borderRadius: 2,
              textAlign: 'center',
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              fontWeight: 600,
              minHeight: { xs: 48, sm: 36 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'scale(1.05)' },
                boxShadow: { xs: 'none', sm: '0 8px 24px rgba(0, 212, 255, 0.4)' },
              },
            }}
          >
            View Details
          </Box>
        </Link>
      </Box>
    </Card>
  );

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
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleSearch}
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
      </Container>
    </Box>
  );
};

export default Search;
