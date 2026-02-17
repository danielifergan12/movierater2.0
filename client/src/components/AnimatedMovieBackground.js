import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import api from '../config/axios';

// Famous movies with their TMDB IDs - 56 movies for 14 per row across 4 rows
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
  { id: 424, title: 'Schindler\'s List' },
  { id: 122, title: 'The Lord of the Rings: The Return of the King' },
  { id: 120, title: 'The Lord of the Rings: The Fellowship of the Ring' },
  { id: 121, title: 'The Lord of the Rings: The Two Towers' },
  { id: 11, title: 'Star Wars' },
  { id: 1891, title: 'The Empire Strikes Back' },
  { id: 597, title: 'Titanic' },
  { id: 49026, title: 'The Dark Knight Rises' },
  { id: 245891, title: 'John Wick' },
  { id: 324857, title: 'Spider-Man: Into the Spider-Verse' },
  { id: 299536, title: 'Avengers: Infinity War' },
  { id: 299534, title: 'Avengers: Endgame' },
  { id: 181808, title: 'Star Wars: The Last Jedi' },
  { id: 140607, title: 'Star Wars: The Force Awakens' },
  { id: 78, title: 'Blade Runner' },
  { id: 335984, title: 'Blade Runner 2049' },
  { id: 475557, title: 'Joker' },
  { id: 496243, title: 'Parasite' },
  { id: 19404, title: 'Dilwale Dulhania Le Jayenge' },
  { id: 429, title: 'The Good, the Bad and the Ugly' },
  { id: 11216, title: 'Cinema Paradiso' },
  { id: 346, title: 'Seven Samurai' },
  { id: 389, title: '12 Angry Men' },
  { id: 497, title: 'The Green Mile' },
  { id: 510, title: 'One Flew Over the Cuckoo\'s Nest' },
  { id: 8587, title: 'The Lion King' },
  { id: 862, title: 'Toy Story' },
  { id: 105, title: 'Back to the Future' },
  { id: 62, title: '2001: A Space Odyssey' },
  { id: 694, title: 'The Shining' },
  { id: 539, title: 'Psycho' },
  { id: 98, title: 'Gladiator' },
  { id: 857, title: 'Saving Private Ryan' },
  { id: 2062, title: 'Ratatouille' },
  { id: 24428, title: 'The Avengers' },
  { id: 315162, title: 'Puss in Boots: The Last Wish' },
  { id: 10681, title: 'WALL-E' },
  { id: 18, title: 'The Fifth Element' },
  { id: 19995, title: 'Avatar' },
  { id: 49051, title: 'The Hobbit: An Unexpected Journey' },
  { id: 10138, title: 'Iron Man' },
  { id: 284054, title: 'Black Panther' },
  { id: 335983, title: 'Venom' },
  { id: 284053, title: 'Thor: Ragnarok' },
  { id: 283995, title: 'Guardians of the Galaxy Vol. 2' },
  { id: 335984, title: 'Blade Runner 2049' },
  { id: 335984, title: 'Blade Runner 2049' },
];

const AnimatedMovieBackground = () => {
  const [moviePosters, setMoviePosters] = useState({});

  useEffect(() => {
    // Fetch all poster paths in one batch request
    const fetchPosters = async () => {
      try {
        const movieIds = FAMOUS_MOVIES.map(m => m.id).join(',');
        const response = await api.get(`/api/movies/posters/batch?ids=${movieIds}`);
        if (response.data && response.data.posters) {
          setMoviePosters(response.data.posters);
        }
      } catch (error) {
        console.error('Error fetching movie posters:', error);
        // Fallback: try to fetch individually in parallel as backup
        const posterPromises = FAMOUS_MOVIES.map(async (movie) => {
          try {
            const response = await api.get(`/api/movies/${movie.id}`);
            if (response.data && response.data.posterPath) {
              return { id: movie.id, posterPath: response.data.posterPath };
            }
          } catch (err) {
            console.error(`Error fetching poster for ${movie.title}:`, err);
          }
          return null;
        });
        const results = await Promise.all(posterPromises);
        const posters = {};
        results.forEach(result => {
          if (result) {
            posters[result.id] = result.posterPath;
          }
        });
        setMoviePosters(posters);
      }
    };
    fetchPosters();
  }, []);

  // Create 4 rows with exactly 14 movies each (56 total movies)
  const moviesPerRow = 14;
  const rows = [
    FAMOUS_MOVIES.slice(0, moviesPerRow),
    FAMOUS_MOVIES.slice(moviesPerRow, moviesPerRow * 2),
    FAMOUS_MOVIES.slice(moviesPerRow * 2, moviesPerRow * 3),
    FAMOUS_MOVIES.slice(moviesPerRow * 3, moviesPerRow * 4),
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
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
      {rows.map((row, rowIndex) => {
        // Alternate direction: even rows (0, 2) go left to right, odd rows (1, 3) go right to left
        const isLeftToRight = rowIndex % 2 === 0;
        
        return (
          <Box
            key={rowIndex}
            sx={{
              position: 'absolute',
              top: `${rowIndex * 25}%`,
              left: 0,
              width: '200%',
              height: '25%',
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 2, sm: 2.5, md: 3 },
              animation: isLeftToRight 
                ? 'slideLeftToRight 20s linear infinite'
                : 'slideRightToLeft 20s linear infinite',
              '@keyframes slideLeftToRight': {
                '0%': { transform: 'translateX(0)' },
                '100%': { transform: 'translateX(-50%)' },
              },
              '@keyframes slideRightToLeft': {
                '0%': { transform: 'translateX(-50%)' },
                '100%': { transform: 'translateX(0)' },
              },
            }}
          >
            {/* Render row twice for seamless infinite loop - when one set exits, the other enters */}
            {[...row, ...row].map((movie, index) => (
            <Box
              key={`${movie.id}-${index}`}
              sx={{
                flexShrink: 0,
                width: { xs: 100, sm: 120, md: 140, lg: 150 },
                height: { xs: 150, sm: 180, md: 210, lg: 225 },
                minWidth: { xs: 100, sm: 120, md: 140, lg: 150 },
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
        );
      })}
    </Box>
  );
};

export default AnimatedMovieBackground;

