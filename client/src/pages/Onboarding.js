import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Fade,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import api from '../config/axios';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';

const TARGET = 5;

const Onboarding = () => {
  const navigate = useNavigate();
  const { rawRatings } = useRatings();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingMovie, setRatingMovie] = useState(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const rankedCount = rawRatings.length;
  const done = rankedCount >= TARGET;
  const remaining = Math.max(0, TARGET - rankedCount);

  useEffect(() => {
    if (done) {
      localStorage.setItem('onboardingComplete', '1');
      setJustCompleted(true);
    }
  }, [done]);

  useEffect(() => {
    const load = async () => {
      try {
        const [trending, popular] = await Promise.all([
          api.get('/api/movies/trending/week').catch(() => ({ data: { results: [] } })),
          api.get('/api/movies/popular').catch(() => ({ data: { results: [] } })),
        ]);
        const map = new Map();
        [...(trending.data?.results || []), ...(popular.data?.results || [])].forEach((m) => {
          if (m?.id && m?.poster_path && !map.has(m.id)) map.set(m.id, m);
        });
        setMovies(Array.from(map.values()).slice(0, 18));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rankedIds = useMemo(
    () => new Set(rawRatings.map((r) => String(r.id))),
    [rawRatings]
  );

  const skip = () => {
    localStorage.setItem('onboardingComplete', '1');
    navigate('/');
  };

  const openRate = (m) => {
    if (done || rankedIds.has(String(m.id))) return;
    setRatingMovie({
      id: m.id,
      title: m.title,
      posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      releaseDate: m.release_date,
      genres: m.genre_ids,
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0c0b0a',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(212,160,23,0.1), transparent 55%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(244,239,230,0.03), transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 }, maxWidth: 480, mx: 'auto' }}>
          <Typography
            sx={{
              display: 'inline-block',
              color: 'var(--rl-accent)',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              mb: 1.25,
            }}
          >
            Taste setup
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: { xs: '2.2rem', sm: '2.8rem' },
              color: 'var(--rl-cream)',
              letterSpacing: '0.04em',
              lineHeight: 1.05,
            }}
          >
            {done ? 'You’re ready' : 'Rank films you love'}
          </Typography>
          <Typography sx={{ color: 'var(--rl-muted)', mt: 1, fontSize: '0.9rem' }}>
            {done
              ? 'Your personal order is started. You can keep ranking anytime.'
              : 'Tap a poster, pick which film you prefer — ReelList builds your list from comparisons.'}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 0.85,
              mt: 2.5,
              mb: 1,
            }}
          >
            {Array.from({ length: TARGET }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: { xs: 28, sm: 36 },
                  height: 6,
                  borderRadius: 1,
                  bgcolor: i < rankedCount ? 'var(--rl-accent)' : 'rgba(244,239,230,0.12)',
                  transition: 'background-color 0.35s ease, transform 0.25s ease',
                  transform: i === rankedCount - 1 && rankedCount > 0 ? 'scaleY(1.25)' : 'none',
                }}
              />
            ))}
          </Box>
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.8rem' }}>
            {done ? `${TARGET} of ${TARGET} done` : `${remaining} more to go`}
          </Typography>
        </Box>

        {done ? (
          <Fade in={justCompleted || done}>
            <Box sx={{ textAlign: 'center', maxWidth: 360, mx: 'auto', py: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  mx: 'auto',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(212,160,23,0.15)',
                  border: '1px solid rgba(212,160,23,0.35)',
                }}
              >
                <CheckIcon sx={{ color: 'var(--rl-accent)', fontSize: '1.6rem' }} />
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 1,
                  backgroundImage: 'none',
                  backgroundColor: 'var(--rl-accent)',
                  color: 'var(--rl-ink)',
                  px: 3.5,
                  py: 1.15,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: 'var(--rl-accent-hover)', boxShadow: 'none' },
                }}
              >
                Enter ReelList
              </Button>
              <Button
                component={Link}
                to="/search"
                sx={{
                  display: 'block',
                  mt: 1.5,
                  color: 'var(--rl-muted)',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                }}
              >
                Or keep ranking more films
              </Button>
            </Box>
          </Fade>
        ) : (
          <Box sx={{ textAlign: 'center', mb: 2.5 }}>
            <Button
              component={Link}
              to="/search"
              sx={{ color: 'var(--rl-muted)', textTransform: 'none', fontSize: '0.82rem', mr: 1 }}
            >
              Search any movie
            </Button>
            <Typography component="span" sx={{ color: 'rgba(244,239,230,0.25)' }}>
              ·
            </Typography>
            <Button onClick={skip} sx={{ color: 'var(--rl-muted)', textTransform: 'none', fontSize: '0.82rem', ml: 1 }}>
              Skip for now
            </Button>
          </Box>
        )}

        {!done && (
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(3, minmax(0, 1fr))',
                  sm: 'repeat(4, minmax(0, 1fr))',
                  md: 'repeat(6, minmax(0, 1fr))',
                },
                gap: { xs: 1, sm: 1.25 },
                maxWidth: 900,
                mx: 'auto',
              }}
            >
              {movies.map((m) => {
                const already = rankedIds.has(String(m.id));
                return (
                  <Box
                    key={m.id}
                    onClick={() => openRate(m)}
                    sx={{
                      minWidth: 0,
                      cursor: already ? 'default' : 'pointer',
                      opacity: already ? 0.55 : 1,
                      transition: 'opacity 0.25s ease, transform 0.15s ease',
                      '&:hover .poster': !already
                        ? { borderColor: 'rgba(212, 160, 23, 0.6)', transform: { xs: 'none', sm: 'translateY(-2px)' } }
                        : {},
                      '&:hover .title': !already ? { color: 'var(--rl-accent)' } : {},
                    }}
                  >
                    <Box
                      className="poster"
                      sx={{
                        position: 'relative',
                        aspectRatio: '2 / 3',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '1px solid rgba(244, 239, 230, 0.12)',
                        backgroundColor: 'rgba(244, 239, 230, 0.04)',
                        transition: 'border-color 0.15s ease, transform 0.15s ease',
                      }}
                    >
                      <Box
                        component="img"
                        src={
                          m.poster_path
                            ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
                            : '/placeholder-movie.jpg'
                        }
                        alt={m.title}
                        loading="lazy"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {already && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(12,11,10,0.55)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: 'var(--rl-accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CheckIcon sx={{ color: 'var(--rl-ink)', fontSize: '1rem' }} />
                          </Box>
                        </Box>
                      )}
                    </Box>
                    <Typography
                      className="title"
                      sx={{
                        display: 'block',
                        mt: 0.55,
                        color: already ? 'var(--rl-muted)' : 'var(--rl-cream)',
                        fontWeight: 600,
                        fontSize: { xs: '0.62rem', sm: '0.72rem' },
                        lineHeight: 1.25,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {already ? 'Ranked' : m.title}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )
        )}
      </Container>

      {ratingMovie && (
        <RatingModal
          open={!!ratingMovie}
          movie={ratingMovie}
          onClose={() => setRatingMovie(null)}
          onComplete={() => setRatingMovie(null)}
          allowRerate={false}
        />
      )}
    </Box>
  );
};

export default Onboarding;
