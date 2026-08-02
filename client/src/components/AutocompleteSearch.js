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
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '../config/axios';
import RatingModal from './RatingModal';
import { useRatings } from '../hooks/useRatings';
import { useAuth } from '../contexts/AuthContext';

/**
 * Main movie search — also finds actors/directors and opens their profile.
 */
const AutocompleteSearch = ({ onMovieSelect, placeholder = 'Search movies, actors, directors…' }) => {
  const navigate = useNavigate();
  const { rawRatings } = useRatings();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [ratingMovie, setRatingMovie] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      if (query.length < 2) {
        setMovies([]);
        setPeople([]);
        setShowSuggestions(false);
        return;
      }
      setLoading(true);
      try {
        const response = await api.get(`/api/movies/search?query=${encodeURIComponent(query)}&page=1`);
        setMovies((response.data.results || []).slice(0, 6));
        setPeople(response.data.people || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setMovies([]);
        setPeople([]);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(run, 280);
    return () => clearTimeout(t);
  }, [query]);

  const flatItems = [
    ...people.map((p) => ({ type: 'person', data: p })),
    ...movies.map((m) => ({ type: 'movie', data: m })),
  ];

  const handleMovieSelect = (movie) => {
    setQuery(movie.title || '');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onMovieSelect(movie);
  };

  const openPerson = (person) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setQuery('');
    navigate(`/person/${person.id}`);
  };

  const handleKeyDown = (event) => {
    if (!showSuggestions || flatItems.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (event.key === 'Enter' && selectedIndex >= 0) {
      event.preventDefault();
      const item = flatItems[selectedIndex];
      if (item.type === 'person') openPerson(item.data);
      else handleMovieSelect(item.data);
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    const onDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const showPanel = showSuggestions && flatItems.length > 0;

  return (
    <Box ref={searchRef} sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: 'var(--rl-muted)', mr: 1, fontSize: 20 }} />,
          endAdornment: loading ? (
            <CircularProgress size={18} sx={{ color: 'var(--rl-accent)' }} />
          ) : query.trim().length >= 2 ? (
            <IconButton
              size="small"
              onClick={() => {
                if (flatItems[0]?.type === 'movie') handleMovieSelect(flatItems[0].data);
                else if (flatItems[0]?.type === 'person') openPerson(flatItems[0].data);
              }}
              sx={{ color: 'var(--rl-accent)' }}
              aria-label="Search"
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          ) : null,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(244,239,230,0.04)',
            borderRadius: 1,
            color: 'var(--rl-cream)',
            '& fieldset': { borderColor: 'rgba(244,239,230,0.14)' },
            '&:hover fieldset': { borderColor: 'rgba(212,160,23,0.4)' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(212,160,23,0.65)' },
          },
          '& .MuiInputBase-input::placeholder': { color: 'var(--rl-muted)', opacity: 1 },
        }}
      />

      <Fade in={showPanel}>
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            mt: 0.75,
            backgroundColor: 'rgba(12, 11, 10, 0.98)',
            border: '1px solid rgba(244,239,230,0.12)',
            borderRadius: 1.5,
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            maxHeight: { xs: 340, sm: 420 },
            overflowY: 'auto',
          }}
        >
          {people.length > 0 && (
            <Typography
              sx={{
                px: 1.75,
                pt: 1.25,
                pb: 0.5,
                color: 'var(--rl-muted)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              People
            </Typography>
          )}

          <List sx={{ p: 0 }}>
            {people.map((person, index) => (
              <ListItem key={`p-${person.id}`} disablePadding>
                <ListItemButton
                  selected={selectedIndex === index}
                  onClick={() => openPerson(person)}
                  sx={{
                    py: 1,
                    px: 1.75,
                    '&.Mui-selected': { bgcolor: 'rgba(212,160,23,0.1)' },
                    '&:hover': { bgcolor: 'rgba(244,239,230,0.05)' },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 48 }}>
                    <Avatar
                      src={person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null}
                      sx={{ width: 36, height: 36, bgcolor: 'rgba(244,239,230,0.08)' }}
                    >
                      <PersonIcon sx={{ fontSize: 18, color: 'var(--rl-muted)' }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 600, fontSize: '0.88rem' }}>
                          {person.name}
                        </Typography>
                        <Chip
                          label={person.role}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            bgcolor: 'rgba(212,160,23,0.18)',
                            color: 'var(--rl-accent)',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      person.known_for?.length ? (
                        <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.72rem' }}>
                          {person.known_for.map((k) => k.title).join(' · ')}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}

            {movies.length > 0 && people.length > 0 && (
              <Typography
                sx={{
                  px: 1.75,
                  pt: 1,
                  pb: 0.5,
                  color: 'var(--rl-muted)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Movies
              </Typography>
            )}

            {movies.map((movie, index) => {
              const flatIndex = people.length + index;
              const isAlreadyRated = rawRatings.some((r) => String(r.id) === String(movie.id));
              const year = movie.release_date ? String(movie.release_date).slice(0, 4) : '';
              return (
                <ListItem key={`m-${movie.id}`} disablePadding>
                  <ListItemButton
                    selected={selectedIndex === flatIndex}
                    onClick={() => handleMovieSelect(movie)}
                    sx={{
                      py: 1,
                      px: 1.75,
                      '&.Mui-selected': { bgcolor: 'rgba(212,160,23,0.1)' },
                      '&:hover': { bgcolor: 'rgba(244,239,230,0.05)' },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 52 }}>
                      <Avatar
                        variant="rounded"
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : null}
                        sx={{ width: 34, height: 51, borderRadius: '3px', bgcolor: 'rgba(244,239,230,0.06)' }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 600, fontSize: '0.88rem' }}>
                          {movie.title}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.72rem' }}>
                            {[year, movie.vote_average ? `★ ${Number(movie.vote_average).toFixed(1)}` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<StarIcon sx={{ fontSize: '0.85rem !important' }} />}
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
                                  posterUrl: movie.poster_path
                                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                    : '/placeholder-movie.jpg',
                                });
                                setShowSuggestions(false);
                              }
                            }}
                            disabled={isAlreadyRated}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.68rem',
                              py: 0.15,
                              px: 0.75,
                              minWidth: 0,
                              color: isAlreadyRated ? 'var(--rl-muted)' : 'var(--rl-ink)',
                              bgcolor: isAlreadyRated ? 'transparent' : 'var(--rl-accent)',
                              border: isAlreadyRated ? '1px solid rgba(244,239,230,0.2)' : 'none',
                              '&:hover': {
                                bgcolor: isAlreadyRated ? 'rgba(244,239,230,0.04)' : 'var(--rl-accent-hover)',
                              },
                            }}
                          >
                            {isAlreadyRated ? 'Ranked' : 'Rank'}
                          </Button>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
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
