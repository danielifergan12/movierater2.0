import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import api from '../config/axios';

// Famous movies with their TMDB IDs
const FAMOUS_MOVIES = [
  { id: 157336, title: 'Interstellar' },
  { id: 27205, title: 'Inception' },
  { id: 155, title: 'The Dark Knight' },
  { id: 603, title: 'The Matrix' },
  { id: 680, title: 'Pulp Fiction' },
  { id: 550, title: 'Fight Club' },
  { id: 278, title: 'The Shawshank Redemption' },
  { id: 13, title: 'Forrest Gump' },
  { id: 769, title: 'Goodfellas' },
  { id: 238, title: 'The Godfather' },
];

const AnimatedMovieBackground = () => {
  const [moviePosters, setMoviePosters] = useState({});

  useEffect(() => {
    // Fetch poster paths for all movies
    const fetchPosters = async () => {
      const posters = {};
      for (const movie of FAMOUS_MOVIES) {
        try {
          const response = await api.get(`/api/movies/${movie.id}`);
          if (response.data && response.data.posterPath) {
            posters[movie.id] = response.data.posterPath;
          }
        } catch (error) {
          console.error(`Error fetching poster for ${movie.title}:`, error);
        }
      }
      setMoviePosters(posters);
    };
    fetchPosters();
  }, []);

  // Create multiple rows of movies
  const rows = [
    FAMOUS_MOVIES.slice(0, 5), // Top row
    FAMOUS_MOVIES.slice(5, 10), // Bottom row
  ];

  const getPosterUrl = (movieId) => {
    const posterPath = moviePosters[movieId];
    if (posterPath) {
      return `https://image.tmdb.org/t/p/w342${posterPath}`;
    }
    return '/placeholder-movie.jpg';
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.7) 0%, rgba(10, 10, 10, 0.5) 50%, rgba(10, 10, 10, 0.7) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }
      }}
    >
      {rows.map((row, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            position: 'absolute',
            top: `${rowIndex * 50}%`,
            left: 0,
            width: '200%',
            height: '50%',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            animation: `slide${rowIndex} ${20 + rowIndex * 5}s linear infinite`,
            '@keyframes slide0': {
              '0%': { transform: 'translateX(0)' },
              '100%': { transform: 'translateX(-50%)' },
            },
            '@keyframes slide1': {
              '0%': { transform: 'translateX(-50%)' },
              '100%': { transform: 'translateX(0)' },
            },
          }}
        >
          {/* Render row twice for seamless loop */}
          {[...row, ...row].map((movie, index) => (
            <Box
              key={`${movie.id}-${index}`}
              sx={{
                flexShrink: 0,
                width: { xs: 80, sm: 120, md: 150 },
                height: { xs: 120, sm: 180, md: 225 },
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                opacity: 0.6,
                transition: 'opacity 0.3s ease',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              <img
                src={getPosterUrl(movie.id)}
                alt={movie.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.src = '/placeholder-movie.jpg';
                }}
              />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default AnimatedMovieBackground;

