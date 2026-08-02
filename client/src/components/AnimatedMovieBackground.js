import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import api from '../config/axios';

/** High-res TMDB stills (w1280). Paths verified against the API. */
const tmdb = (path) => `https://image.tmdb.org/t/p/w1280${path}`;

const FAMOUS_BACKDROPS = [
  tmdb('/62HCnUTziyWcpDaBO2i1DX17ljH.jpg'), // The Dark Knight
  tmdb('/qJ2tW6WMUDux911r6m7haRef0WH.jpg'), // The Dark Knight Rises
  tmdb('/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg'), // Interstellar
  tmdb('/s3TBrRGB1iav7gFOCNx3H31MoES.jpg'), // Inception
  tmdb('/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg'), // The Matrix
  tmdb('/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg'), // Pulp Fiction
  tmdb('/qVgZu5BTx6pu4owCvVOm4zjTfOi.jpg'), // Dune
  tmdb('/eZ239CUp1d6OryZEBPnO2n87gMG.jpg'), // Dune: Part Two
  tmdb('/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'), // Oppenheimer
  tmdb('/nHf61UzkfFno5X1ofIhugCPus2R.jpg'), // Barbie
  tmdb('/91iy9F1JOG1dvM6M6JNYgvScZpK.jpg'), // Avengers: Endgame
  tmdb('/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg'), // Avengers: Infinity War
  tmdb('/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg'), // LOTR: Return of the King
  tmdb('/mWDdRXTivGE7aaY2vo1Ie0PfCX5.jpg'), // LOTR: Fellowship
  tmdb('/1XAC6RPT01UX9EQGy2JVn5c8pgy.jpg'), // Harry Potter
  tmdb('/66Kn4XWhkuPkJxOJyPEx4U2CUfN.jpg'), // Forrest Gump
  tmdb('/vbC0rzdrb7Ohc2TkbEbxtOABECe.jpg'), // Parasite
  tmdb('/jhk6D8pim3yaByu1801kMoxXFaX.jpg'), // Gladiator
  tmdb('/yYrvN5WFeGYjJnRzhY0QXuo4Isw.jpg'), // Black Panther
  tmdb('/AeK2MPOpYrOOgZNfFnfwp0L8tNn.jpg'), // Spider-Man: No Way Home
  tmdb('/yUiXA68FfQeA8cRBhd0Ao0jIRZt.jpg'), // Star Wars
  tmdb('/5Iw7zQTHVRBOYpA0V6z0yypOPZh.jpg'), // The Empire Strikes Back
  tmdb('/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg'), // Top Gun: Maverick
  tmdb('/rlay2M5QYvi6igbGcFjq8jxeusY.jpg'), // Joker
  tmdb('/vVpEOvdxVBP2aV166j5Xlvb5Cdc.jpg'), // John Wick
  tmdb('/8mnXR9rey5uQ08rZAvzojKWbDQS.jpg'), // Spider-Verse
  tmdb('/tSPT36ZKlP2WVHJLM4cQPLSzv3b.jpg'), // The Godfather
  tmdb('/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg'), // The Shawshank Redemption
  tmdb('/kGzFbGhp99zva6oZODW5atUtnqi.jpg'), // The Godfather Part II
  tmdb('/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg'), // Spirited Away
  tmdb('/c6OLXfKAk5BKeR6broC8pYiCquX.jpg'), // Fight Club
  tmdb('/gILte6Zd7m1YneIr6MVhh30S9pr.jpg'), // Goodfellas
  tmdb('/2lBOQK06tltt8SQaswgb8d657Mv.jpg'), // 1917
  tmdb('/vmBSlRZYKfNdaDZ7wGkrSNbmdMI.jpg'), // Guardians of the Galaxy
  tmdb('/nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg'), // La La Land
  tmdb('/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg'), // Whiplash
  tmdb('/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg'), // The Green Mile
  tmdb('/6WRrGYalXXveItfpnipYdayFkQB.jpg'), // The Departed
  tmdb('/xnHVX37XZEp33hhCbYlQFq7ux1J.jpg'), // Titanic
  tmdb('/nv5wwZou159v5OC61i4ElR7OqyY.jpg'), // Howl's Moving Castle
];

const STARTER = FAMOUS_BACKDROPS[3]; // Inception — always show a known-good still first

// Kick off the first high-res download as soon as this module loads
if (typeof window !== 'undefined') {
  const warm = new Image();
  warm.src = STARTER;
}

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
  const poolRef = useRef([...FAMOUS_BACKDROPS]);
  const recentRef = useRef([STARTER]);
  const readyRef = useRef(new Set([STARTER]));
  const [current, setCurrent] = useState(STARTER);
  const [incoming, setIncoming] = useState(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [firstReady, setFirstReady] = useState(false);

  const pickNextUrl = () => {
    const pool = poolRef.current;
    if (pool.length < 2) return pool[0];
    const avoid = new Set([current, incoming, ...recentRef.current].filter(Boolean));
    let candidates = pool.filter((url) => !avoid.has(url) && readyRef.current.has(url));
    if (candidates.length === 0) {
      candidates = pool.filter((url) => url !== current && readyRef.current.has(url));
    }
    if (candidates.length === 0) {
      candidates = pool.filter((url) => url !== current);
    }
    const next = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
    recentRef.current = [...recentRef.current, next].slice(-8);
    return next;
  };

  // Enrich + warm the rest of the pool (never interrupts the visible still)
  useEffect(() => {
    let cancelled = false;

    const warmPool = async (urls) => {
      for (const url of urls) {
        if (cancelled) return;
        if (readyRef.current.has(url)) continue;
        const ok = await preload(url);
        if (ok) readyRef.current.add(url);
      }
    };

    (async () => {
      // Warm famous stills in the background
      warmPool(shuffle(FAMOUS_BACKDROPS.filter((u) => u !== STARTER)));

      try {
        const [trending, popular] = await Promise.all([
          api.get('/api/movies/trending/week').catch(() => ({ data: { results: [] } })),
          api.get('/api/movies/popular').catch(() => ({ data: { results: [] } })),
        ]);
        const fromApi = [...(trending.data?.results || []), ...(popular.data?.results || [])]
          .filter((m) => m?.backdrop_path && (m.vote_count || 0) >= 5000)
          .map((m) => tmdb(m.backdrop_path));
        if (cancelled) return;
        const merged = [...new Set([...FAMOUS_BACKDROPS, ...fromApi])];
        poolRef.current = merged;
        warmPool(fromApi);
      } catch (e) {
        console.error('Error fetching hero backdrops:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dual-buffer rotation: current stays up until the next high-res still is fully loaded
  useEffect(() => {
    let cancelled = false;
    let timer;

    const advance = async () => {
      const nextUrl = pickNextUrl();
      const ok = readyRef.current.has(nextUrl) || (await preload(nextUrl));
      if (cancelled) return;
      if (!ok) {
        timer = setTimeout(advance, 800);
        return;
      }
      readyRef.current.add(nextUrl);

      setIncoming(nextUrl);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          setIncomingVisible(true);
          setTimeout(() => {
            if (cancelled) return;
            setCurrent(nextUrl);
            setIncoming(null);
            setIncomingVisible(false);
            timer = setTimeout(advance, 2800);
          }, 750);
        });
      });
    };

    (async () => {
      const ok = await preload(STARTER);
      if (cancelled) return;
      if (ok) {
        readyRef.current.add(STARTER);
        setFirstReady(true);
      }
      timer = setTimeout(advance, 2600);
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
    filter: 'saturate(0.9) contrast(1.04)',
    // No per-image scale — zoom lives on the wrapper so swaps never jump
    transform: 'none',
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
        // Instant paint from CSS while the <img> decodes (same high-res URL, browser cache shared)
        backgroundImage: `url(${STARTER})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
      }}
    >
      {/* Continuous Ken Burns on a stable wrapper — never resets when images crossfade */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-4%',
          zIndex: 0,
          animation: 'landingKenBurns 28s ease-in-out infinite alternate',
          '@keyframes landingKenBurns': {
            from: { transform: 'scale(1) translate(0, 0)' },
            to: { transform: 'scale(1.06) translate(-1.2%, -0.8%)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            inset: 0,
          },
        }}
      >
        <Box
          component="img"
          src={current}
          alt=""
          decoding="async"
          fetchPriority="high"
          onLoad={() => setFirstReady(true)}
          sx={{
            ...frameSx,
            opacity: firstReady || current !== STARTER ? 1 : 0.001,
            zIndex: 0,
            transition: 'opacity 0.35s ease',
          }}
        />

        {incoming && (
          <Box
            component="img"
            src={incoming}
            alt=""
            decoding="async"
            sx={{
              ...frameSx,
              opacity: incomingVisible ? 1 : 0,
              transition: 'opacity 0.75s ease',
              zIndex: 1,
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background: `
            linear-gradient(90deg, rgba(12, 11, 10, 0.94) 0%, rgba(12, 11, 10, 0.55) 38%, rgba(12, 11, 10, 0.22) 68%, rgba(12, 11, 10, 0.5) 100%),
            linear-gradient(0deg, rgba(12, 11, 10, 0.94) 0%, rgba(12, 11, 10, 0.4) 42%, rgba(12, 11, 10, 0.55) 100%),
            radial-gradient(ellipse 80% 55% at 50% 45%, transparent 0%, rgba(12, 11, 10, 0.35) 100%)
          `,
        }}
      />
    </Box>
  );
};

export default AnimatedMovieBackground;
