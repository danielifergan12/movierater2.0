import React, { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import MovieFilters from '../components/MovieFilters';
import RatingModal from '../components/RatingModal';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchMovies, searchResults, loading } = useMovies();
  const { isAuthenticated } = useAuth();
  const { rawRatings } = useRatings();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingMovie, setRatingMovie] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [filters, setFilters] = useState({
    genres: [],
    decades: [],
    yearRange: [1900, new Date().getFullYear() + 1],
    ratingRange: [0, 10],
    sortBy: 'popularity',
    searchQuery: ''
  });

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
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg',
      releaseDate: movie.release_date,
      genres: movie.genre_ids || []
    });
    setShowRatingModal(true);
  };

  // Filter and sort search results
  const filteredAndSortedResults = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return [];

    let filtered = [...searchResults];

    // Filter by search within (additional to main search)
    if (filters.searchQuery?.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query)
      );
    }

    // Filter by genre
    if (filters.genres?.length > 0) {
      filtered = filtered.filter(m => {
        const movieGenres = m.genre_ids || [];
        return filters.genres.some(genreId => movieGenres.includes(genreId));
      });
    }

    // Filter by decade
    if (filters.decades?.length > 0) {
      filtered = filtered.filter(m => {
        if (!m.release_date) return false;
        const year = new Date(m.release_date).getFullYear();
        return filters.decades.some(decade => {
          if (decade === 0) return year < 1950;
          return year >= decade && year < decade + 10;
        });
      });
    }

    // Filter by year range
    if (filters.yearRange) {
      filtered = filtered.filter(m => {
        if (!m.release_date) return false;
        const year = new Date(m.release_date).getFullYear();
        return year >= filters.yearRange[0] && year <= filters.yearRange[1];
      });
    }

    // Filter by rating range (TMDB vote_average)
    if (filters.ratingRange) {
      filtered = filtered.filter(m => {
        const rating = m.vote_average || 0;
        return rating >= filters.ratingRange[0] && rating <= filters.ratingRange[1];
      });
    }

    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'popularity':
            return (b.popularity || 0) - (a.popularity || 0);
          case 'popularity-asc':
            return (a.popularity || 0) - (b.popularity || 0);
          case 'rating':
            return (b.vote_average || 0) - (a.vote_average || 0);
          case 'rating-asc':
            return (a.vote_average || 0) - (b.vote_average || 0);
          case 'release-date':
            const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
            const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
            return dateB - dateA;
          case 'release-date-desc':
            const dateA2 = a.release_date ? new Date(a.release_date) : new Date(0);
            const dateB2 = b.release_date ? new Date(b.release_date) : new Date(0);
            return dateA2 - dateB2;
          case 'title':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [searchResults, filters]);

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
          {!isAuthenticated ? 'Sign in to Rate' : (isRated ? 'Rerate' : 'Rate')}
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
        
        {/* Filters - only show when there are search results */}
        {searchResults.length > 0 && (
          <MovieFilters
            filters={filters}
            onFiltersChange={setFilters}
            showRatingRange={false}
            showSearchWithin={true}
          />
        )}
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
            {filteredAndSortedResults.length === searchResults.length
              ? `Search Results for "${query}" (${searchResults.length} movies)`
              : `Showing ${filteredAndSortedResults.length} of ${searchResults.length} results for "${query}"`
            }
          </Typography>

          {filteredAndSortedResults.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                No movies match your filters
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Try adjusting your filter criteria
              </Typography>
            </Box>
          ) : (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
              {filteredAndSortedResults.map((movie) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={movie.id}>
                <MovieCard movie={movie} />
              </Grid>
            ))}
          </Grid>
          )}

          {/* Only show pagination when not filtering (filters apply to current page results) */}
          {totalPages > 1 && filteredAndSortedResults.length === searchResults.length && (
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
