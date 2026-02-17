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
  Chip,
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

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, page]);

  const performSearch = async () => {
    const result = await searchMovies(query, page);
    if (result.total_pages) {
      setTotalPages(result.total_pages);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setQuery(e.target.value);
      setPage(1);
      setSearchParams({ q: e.target.value });
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const MovieCard = ({ movie }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="400"
        image={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
        alt={movie.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2" noWrap>
          {movie.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {new Date(movie.release_date).getFullYear()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating
            value={movie.vote_average / 2}
            precision={0.1}
            size="small"
            readOnly
          />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {movie.vote_average.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" noWrap>
          {movie.overview}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Link
          to={`/movie/${movie.id}`}
          style={{ textDecoration: 'none' }}
        >
          <Box
            sx={{
              width: '100%',
              py: 1,
              px: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: 1,
              textAlign: 'center',
              '&:hover': {
                backgroundColor: 'primary.dark',
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Search Movies
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search for movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
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
          <Typography variant="h6" gutterBottom>
            Search Results for "{query}" ({searchResults.length} movies)
          </Typography>

          <Grid container spacing={3}>
            {searchResults.map((movie) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                <MovieCard movie={movie} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {!query && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            Start typing to search for movies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Discover your next favorite movie!
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Search;
