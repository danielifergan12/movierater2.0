import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import api from '../config/axios';

const tmdb = (path) => `https://image.tmdb.org/t/p/w1280${path}`;

// Large pool of widely known films — famous titles only, not the same 4 on loop
const FAMOUS_BACKDROPS = [
  tmdb('/62HCnUTziyWcpDaBO2i1DX17ljH.jpg'), // The Dark Knight
  tmdb('/qJ2tW6WMUDux911r6m7haRef0WH.jpg'), // The Dark Knight Rises
  tmdb('/9BUvAuEgjPIbOcZD4VaUymGm5P5.jpg'), // Interstellar
  tmdb('/s3TBrRGB1iav7gFOCNx3H31MoES.jpg'), // Inception
  tmdb('/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg'), // The Matrix
  tmdb('/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg'), // Pulp Fiction
  tmdb('/sR0SpCrXamlIwDaEKzX8Y7zR3l.jpg'), // Dune
  tmdb('/xOMo8BhajgPeH3WoALzIxBo61bs.jpg'), // Dune: Part Two
  tmdb('/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'), // Oppenheimer
  tmdb('/nHf61UzkfFno5X1ofIhugCPus2R.jpg'), // Barbie
  tmdb('/5YZbUmjbMa3KiaT5FCvjYgXEUO.jpg'), // Avengers: Endgame
  tmdb('/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg'), // Avengers: Infinity War
  tmdb('/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg'), // LOTR: Return of the King
  tmdb('/x2RS3axTcjS7zlPCE7S6EclJbP7.jpg'), // LOTR: Fellowship
  tmdb('/6oom5QYQ2kQIg1B86jcV7pJWfB9.jpg'), // Harry Potter
  tmdb('/qdIMHd4sEfJSckfVJfKQvisLrpB.jpg'), // Forrest Gump
  tmdb('/aKuFifDtsTfTdKk08pCCuHnMd9e.jpg'), // Parasite
  tmdb('/2e7FcVW5CTyLpiRdM9ihzplOFw.jpg'), // Gladiator
  tmdb('/yYrvN5WFeGYjJnRzhY0QXuo4Isw.jpg'), // Black Panther
  tmdb('/14QbnygCuTO0vl7CAFmPf1fgZfP.jpg'), // Spider-Man: No Way Home
  tmdb('/ulMscezy9VXBgHRKQfXb7aqZ6z0.jpg'), // Star Wars
  tmdb('/5Iw7zQTHVRBOYpA0V6z0yypOPZh.jpg'), // The Empire Strikes Back
  tmdb('/tmU7GeK8LuqYZ5TvV9C2lWWq1gA.jpg'), // Top Gun: Maverick
  tmdb('/4GFaDkGJuAJfXUWj4WaCeYhqFy7.jpg'), // Joker
  tmdb('/vVpEOvdxVBP2aV166j5Xlvb5Cdc.jpg'), // John Wick
  tmdb('/6ELC905MDLy25ZVIgyNlfTC1LNV.jpg'), // Spider-Verse
  tmdb('/3bhkrj58Vtu7enJE8tqUynJsbCk.jpg'), // The Godfather
  tmdb('/kXfqcdQKsCnkOJ8dyICmDxls7PA.jpg'), // The Shawshank Redemption
  tmdb('/rSPw7tgCH9c6NqICZef4kNyF2Ac.jpg'), // The Godfather Part II
  tmdb('/uXDfjJbdP4aqTLka38Z4KkZxTe.jpg'), // Spirited Away
  tmdb('/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg'), // Fight Club
  tmdb('/pPHgeIAl1L0C3BEtd6n0uVoYDsE.jpg'), // Goodfellas
  tmdb('/9guoVF7zayOX0bdm7SeZCyfPBso.jpg'), // 1917
  tmdb('/kbHIb8v6Cb8slCjEV2GQJhEQo5G.jpg'), // Guardians of the Galaxy
  tmdb('/AmO8I38bkHwKhgxPNrdIkXc7cKV.jpg'), // La La Land
  tmdb('/qDQ8eIWcXjKPKcByVb08IUTlEJr.jpg'), // Whiplash
  tmdb('/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg'), // The Green Mile
  tmdb('/mfwq2nMBxSlGJyo7oDxKjtD9WtA.jpg'), // The Departed
  tmdb('/c7bglX1Id0r0Y6kfvJJdZBYdM8m.jpg'), // Titanic
  tmdb('/dIWwZW7dJJtqCtyKg4RVOwQHmBZ.jpg'), // Howl's Moving Castle
];

const shuffle = (items) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const AnimatedMovieBackground = () => {
  const [backdrops, setBackdrops] = useState(() => shuffle(FAMOUS_BACKDROPS));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const recentRef = useRef([]);

  useEffect(() => {
    let cancelled = false;

    const loadKnownBackdrops = async () => {
      try {
        const [trending, popular] = await Promise.all([
          api.get('/api/movies/trending/week').catch(() => ({ data: { results: [] } })),
          api.get('/api/movies/popular').catch(() => ({ data: { results: [] } })),
        ]);

        // Only add currently famous titles (very high vote counts)
        const fromApi = [...(trending.data?.results || []), ...(popular.data?.results || [])]
          .filter((m) => m?.backdrop_path && (m.vote_count || 0) >= 5000)
          .map((m) => tmdb(m.backdrop_path));

        const pool = shuffle([...new Set([...FAMOUS_BACKDROPS, ...fromApi])]);
        if (!cancelled && pool.length > 0) {
          setBackdrops(pool);
          setActiveIndex(Math.floor(Math.random() * pool.length));
          recentRef.current = [];
        }
      } catch (error) {
        console.error('Error fetching hero backdrops:', error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadKnownBackdrops();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (backdrops.length < 2) return undefined;

    const pickNext = (current) => {
      const recent = recentRef.current;
      const avoid = new Set([current, ...recent]);
      const candidates = backdrops.map((_, i) => i).filter((i) => !avoid.has(i));
      const pool =
        candidates.length > 0
          ? candidates
          : backdrops.map((_, i) => i).filter((i) => i !== current);
      const next = pool[Math.floor(Math.random() * pool.length)] ?? current;
      const memory = Math.min(12, Math.max(5, Math.floor(backdrops.length / 3)));
      recentRef.current = [...recent, next].slice(-memory);
      return next;
    };

    const id = setInterval(() => {
      setActiveIndex((i) => pickNext(i));
    }, 3400);
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
          loading={index < 4 ? 'eager' : 'lazy'}
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
            transition: 'opacity 0.55s ease, transform 3.4s ease-out',
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
