import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import api from '../config/axios';

const FALLBACK_BACKDROPS = [
  'https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
  'https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
  'https://image.tmdb.org/t/p/w1280/9BUvAuEgjPIbOcZD4VaUymGm5P5.jpg',
];

const AnimatedMovieBackground = () => {
  const [backdrops, setBackdrops] = useState(FALLBACK_BACKDROPS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadBackdrops = async () => {
      try {
        const response = await api.get('/api/movies/trending/week');
        const results = response.data?.results || [];
        const urls = results
          .filter((m) => m.backdrop_path)
          .slice(0, 5)
          .map((m) => `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`);

        if (!cancelled && urls.length > 0) {
          setBackdrops(urls);
        }
      } catch (error) {
        console.error('Error fetching hero backdrops:', error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadBackdrops();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (backdrops.length < 2) return undefined;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % backdrops.length);
    }, 8000);
    return () => clearInterval(id);
  }, [backdrops]);

  return (
    <Box
      aria-hidden
      className="landing-backdrop"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundColor: '#0c0b0a',
      }}
    >
      {backdrops.map((src, index) => (
        <Box
          key={src}
          component="img"
          src={src}
          alt=""
          className={
            index === activeIndex
              ? 'landing-backdrop__image is-active'
              : 'landing-backdrop__image'
          }
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
            opacity: index === activeIndex ? 1 : 0,
            transform: index === activeIndex ? 'scale(1.06)' : 'scale(1)',
            transition: 'opacity 1.4s ease, transform 8s ease-out',
            filter: 'saturate(0.85) contrast(1.05)',
          }}
          onLoad={() => {
            if (index === 0) setLoaded(true);
          }}
        />
      ))}

      {/* Readability wash — edge-to-edge plane, not a floating card */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(90deg, rgba(12, 11, 10, 0.92) 0%, rgba(12, 11, 10, 0.55) 42%, rgba(12, 11, 10, 0.25) 70%, rgba(12, 11, 10, 0.45) 100%),
            linear-gradient(0deg, rgba(12, 11, 10, 0.88) 0%, rgba(12, 11, 10, 0.35) 45%, rgba(12, 11, 10, 0.55) 100%)
          `,
          opacity: loaded ? 1 : 0.95,
          transition: 'opacity 0.6s ease',
        }}
      />
    </Box>
  );
};

export default AnimatedMovieBackground;
