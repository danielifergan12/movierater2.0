import React, { useState, useEffect, useRef } from 'react';
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
  Fade
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import api from '../config/axios';

const AutocompleteSearch = ({ onMovieSelect, placeholder = "Search movies..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
    if (!showSuggestions || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleMovieSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
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
          endAdornment: loading && (
            <CircularProgress size={20} sx={{ color: '#00d4ff' }} />
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
            maxHeight: 400,
            overflow: 'hidden',
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
                    py: 2,
                    px: 3,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    },
                  }}
                >
                  <ListItemAvatar sx={{ mr: 2 }}>
                    <Avatar
                      src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : null}
                      sx={{ 
                        width: 60, 
                        height: 90,
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
                          }}
                        >
                          {new Date(movie.release_date).getFullYear()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {movie.overview}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#00d4ff',
                              fontWeight: 600,
                              mr: 1,
                            }}
                          >
                            ⭐ {movie.vote_average.toFixed(1)}
                          </Typography>
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
    </Box>
  );
};

export default AutocompleteSearch;

