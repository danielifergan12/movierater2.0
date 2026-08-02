import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import api from '../config/axios';

const FALLBACK_BACKDROPS = [
  'https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
  'https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
  'https://image.tmdb.org/t/p/w1280/9BUvAuEgjPIbOcZD4VaUymGm5P5.jpg',
  'https://image.tmdb.org/t/p/w1280/5YZbUmjbMa3KiaT5FCvjYgXEUO.jpg',
  'https://image.tmdb.org/t/p/w1280/sR0SpCrXamlIwDaEKzX8Y7zR3l.jpg',
];

const shuffle = (items) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const collectBackdropUrls = (results = []) =>
  results
    .filter((m) => m?.backdrop_path)
    .map((m) => `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`);

const AnimatedMovieBackground = () => {
  const [backdrops, setBackdrops] = useState(() => shuffle(FALLBACK_BACKDROPS));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const recentRef = useRef([]);

  useEffect(() => {
    let cancelled = false;

    const loadBackdrops = async () => {
      try {
        const [trending, popular, page2] = await Promise.all([
          api.get('/api/movies/trending/week').catch(() => ({ data: { results: [] } })),
          api.get('/api/movies/popular').catch(() => ({ data: { results: [] } })),
          api.get('/api/movies/popular?page=2').catch(() => ({ data: { results: [] } })),
        ]);

        const urls = [
          ...collectBackdropUrls(trending.data?.results),
          ...collectBackdropUrls(popular.data?.results),
          ...collectBackdropUrls(page2.data?.results),
        ];

        // Dedupe while preserving variety
        const unique = [...new Set(urls)];
        if (!cancelled && unique.length > 0) {
          const mixed = shuffle(unique).slice(0, 24);
          setBackdrops(mixed);
          setActiveIndex(Math.floor(Math.random() * mixed.length));
          recentRef.current = [];
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

    const pickNext = (current) => {
      const recent = recentRef.current;
      const avoid = new Set([current, ...recent]);
      const candidates = backdrops
        .map((_, i) => i)
        .filter((i) => !avoid.has(i));
      const pool = candidates.length > 0 ? candidates : backdrops.map((_, i) => i).filter((i) => i !== current);
      const next = pool[Math.floor(Math.random() * pool.length)] ?? current;
      recentRef.current = [...recent, next].slice(-Math.min(8, Math.max(3, Math.floor(backdrops.length / 3))));
      return next;
    };

    const id = setInterval(() => {
      setActiveIndex((i) => pickNext(i));
    }, 3200);
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
          key={`${src}-${index}`}
          component="img"
          src={src}
          alt=""
          loading={index < 3 ? 'eager' : 'lazy'}
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
            transform: index === activeIndex ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 0.55s ease, transform 3.2s ease-out',
            filter: 'saturate(0.85) contrast(1.05)',
          }}
          onLoad={() => {
            if (index === activeIndex) setLoaded(true);
          }}
        />
      ))}

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
