import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import api from '../config/axios';

const tmdb = (path) => `https://image.tmdb.org/t/p/w780${path}`;

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

const preload = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });

const AnimatedMovieBackground = () => {
  const poolRef = useRef(shuffle(FAMOUS_BACKDROPS));
  const recentRef = useRef([]);
  const [current, setCurrent] = useState(poolRef.current[0]);
  const [incoming, setIncoming] = useState(null);
  const [incomingVisible, setIncomingVisible] = useState(false);

  const pickNextUrl = () => {
    const pool = poolRef.current;
    if (pool.length < 2) return pool[0];
    const avoid = new Set([current, incoming, ...recentRef.current].filter(Boolean));
    let candidates = pool.filter((url) => !avoid.has(url));
    if (candidates.length === 0) {
      candidates = pool.filter((url) => url !== current);
    }
    const next = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
    recentRef.current = [...recentRef.current, next].slice(-8);
    return next;
  };

  // Enrich pool with famous API titles (doesn't interrupt current image)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [trending, popular] = await Promise.all([
          api.get('/api/movies/trending/week').catch(() => ({ data: { results: [] } })),
          api.get('/api/movies/popular').catch(() => ({ data: { results: [] } })),
        ]);
        const fromApi = [...(trending.data?.results || []), ...(popular.data?.results || [])]
          .filter((m) => m?.backdrop_path && (m.vote_count || 0) >= 5000)
          .map((m) => tmdb(m.backdrop_path));
        if (!cancelled) {
          poolRef.current = shuffle([...new Set([...FAMOUS_BACKDROPS, ...fromApi])]);
        }
      } catch (e) {
        console.error('Error fetching hero backdrops:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Preload first image, then rotate with dual-buffer (current stays until next is ready)
  useEffect(() => {
    let cancelled = false;
    let timer;

    const advance = async () => {
      const nextUrl = pickNextUrl();
      const ok = await preload(nextUrl);
      if (cancelled || !ok) {
        timer = setTimeout(advance, 1200);
        return;
      }

      setIncoming(nextUrl);
      // Let the browser paint the incoming img at opacity 0, then fade it in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          setIncomingVisible(true);
          // After crossfade, promote incoming → current (no black gap)
          setTimeout(() => {
            if (cancelled) return;
            setCurrent(nextUrl);
            setIncoming(null);
            setIncomingVisible(false);
            timer = setTimeout(advance, 2600);
          }, 700);
        });
      });
    };

    (async () => {
      await preload(current);
      if (!cancelled) timer = setTimeout(advance, 2400);
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frameSx = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 30%',
    filter: 'saturate(0.85) contrast(1.05)',
  };

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
      {/* Base frame — always fully visible */}
      <Box
        component="img"
        src={current}
        alt=""
        sx={{
          ...frameSx,
          opacity: 1,
          transform: 'scale(1.03)',
          zIndex: 0,
        }}
      />

      {/* Incoming frame fades over the base — never leaves a black hole */}
      {incoming && (
        <Box
          component="img"
          src={incoming}
          alt=""
          sx={{
            ...frameSx,
            opacity: incomingVisible ? 1 : 0,
            transform: incomingVisible ? 'scale(1.03)' : 'scale(1)',
            transition: 'opacity 0.7s ease, transform 2.6s ease-out',
            zIndex: 1,
          }}
        />
      )}

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background: `
            linear-gradient(90deg, rgba(12, 11, 10, 0.92) 0%, rgba(12, 11, 10, 0.55) 42%, rgba(12, 11, 10, 0.25) 70%, rgba(12, 11, 10, 0.45) 100%),
            linear-gradient(0deg, rgba(12, 11, 10, 0.88) 0%, rgba(12, 11, 10, 0.35) 45%, rgba(12, 11, 10, 0.55) 100%)
          `,
        }}
      />
    </Box>
  );
};

export default AnimatedMovieBackground;
