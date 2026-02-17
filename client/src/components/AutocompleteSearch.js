import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  CircularProgress,
  Fade,
  Button,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon, Star as StarIcon } from '@mui/icons-material';
import api from '../config/axios';
import RatingModal from './RatingModal';
import { useRatings } from '../hooks/useRatings';
import { useAuth } from '../contexts/AuthContext';

const AutocompleteSearch = ({ onMovieSelect, placeholder = "Search movies..." }) => {
  const { rawRatings } = useRatings();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [ratingMovie, setRatingMovie] = useState(null);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const searchMovies = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/api/movies/search?query=${encodeURIComponent(query)}&page=1`);
        setSuggestions(response.data.results.slice(0, 8)); // Limit to 8 suggestions
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        if (showSuggestions && suggestions.length > 0) {
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        if (showSuggestions && suggestions.length > 0) {
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        break;
      case 'Enter':
        // Removed - search happens automatically as user types
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const navigateToSearchPage = () => {
    if (query.trim().length >= 2) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleMovieSelect = (movie) => {
    setQuery(movie.title);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onMovieSelect(movie);
  };

  const handleClickOutside = (event) => {
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box ref={searchRef} sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        InputProps={{
          startAdornment: (
            <SearchIcon sx={{ color: '#00d4ff', mr: 1 }} />
          ),
          endAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {loading && (
                <CircularProgress size={20} sx={{ color: '#00d4ff' }} />
              )}
              {query.trim().length >= 2 && (
                <IconButton
                  onClick={navigateToSearchPage}
                  sx={{
                    color: '#00d4ff',
                    padding: { xs: 0.75, sm: 1 },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    },
                  }}
                  aria-label="Search"
                >
                  <SearchIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                </IconButton>
              )}
            </Box>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(0, 212, 255, 0.05)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            '& fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.6)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00d4ff',
              boxShadow: '0 0 25px rgba(0, 212, 255, 0.3)',
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'rgba(255, 255, 255, 0.6)',
          },
        }}
      />

      <Fade in={showSuggestions && suggestions.length > 0}>
        <Paper
          ref={suggestionsRef}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 1,
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            maxHeight: { xs: 300, sm: 400 },
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <List sx={{ p: 0 }}>
            {suggestions.map((movie, index) => (
              <ListItem
                key={movie.id}
                disablePadding
                sx={{
                  backgroundColor: selectedIndex === index 
                    ? 'rgba(0, 212, 255, 0.1)' 
                    : 'transparent',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                <ListItemButton
                  onClick={() => handleMovieSelect(movie)}
                  sx={{
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 2, sm: 3 },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    },
                  }}
                >
                  <ListItemAvatar sx={{ mr: { xs: 1, sm: 2 } }}>
                    <Avatar
                      src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : null}
                      sx={{ 
                        width: { xs: 40, sm: 60 }, 
                        height: { xs: 60, sm: 90 },
                        borderRadius: 2,
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      }}
                    >
                      🎬
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: '#ffffff',
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        }}
                      >
                        {movie.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            mb: 0.5,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {new Date(movie.release_date).getFullYear()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: { xs: 'none', sm: '-webkit-box' },
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {movie.overview}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#00d4ff',
                              fontWeight: 600,
                              mr: 1,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            }}
                          >
                            ⭐ {movie.vote_average.toFixed(1)}
                          </Typography>
                          {(() => {
                            const isAlreadyRated = rawRatings.some(r => r.id?.toString() === movie.id?.toString());
                            return (
                              <Button
                                size="small"
                                variant={isAlreadyRated ? "outlined" : "contained"}
                                startIcon={<StarIcon sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isAuthenticated) {
                                    const currentUrl = window.location.pathname + window.location.search;
                                    window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
                                    return;
                                  }
                                  if (!isAlreadyRated) {
                                    setRatingMovie({
                                      id: movie.id,
                                      title: movie.title,
                                      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'
                                    });
                                    setShowSuggestions(false);
                                  }
                                }}
                                disabled={isAlreadyRated}
                                sx={{
                                  ...(isAlreadyRated ? {
                                    borderColor: 'rgba(0, 212, 255, 0.3)',
                                    color: 'rgba(0, 212, 255, 0.5)',
                                    cursor: 'not-allowed',
                                  } : {
                                    background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                                  }),
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                  py: { xs: 0.25, sm: 0.5 },
                                  px: { xs: 1, sm: 1.5 },
                                  minWidth: 'auto',
                                }}
                              >
                                {isAlreadyRated ? 'Rated' : 'Rate'}
                              </Button>
                            );
                          })()}
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Fade>

      {ratingMovie && (
        <RatingModal
          open={!!ratingMovie}
          movie={ratingMovie}
          onClose={() => setRatingMovie(null)}
          onComplete={() => setRatingMovie(null)}
        />
      )}
    </Box>
  );
};

export default AutocompleteSearch;

