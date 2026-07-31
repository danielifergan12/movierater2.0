import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import api from '../config/axios';
import RatingModal from '../components/RatingModal';
import { useRatings } from '../hooks/useRatings';

const Rate = () => {
  const { rawRatings } = useRatings();
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [ratingMovie, setRatingMovie] = useState(null);

  useEffect(() => {
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPage = async (nextPage, replace = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/movies/popular?page=${nextPage}`);
      const newMovies = res.data.results || [];
      setMovies((prev) => (replace ? newMovies : [...prev, ...newMovies]));
      setHasMore(newMovies.length > 0);
      setPage(nextPage);
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const openRate = (movie) => {
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : '/placeholder-movie.jpg',
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: movie.vote_average,
    });
  };

  const ratedIds = new Set(rawRatings.map((r) => r.id?.toString()).filter(Boolean));

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--rl-ink)' }}>
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box sx={{ mb: { xs: 3, sm: 3.5 } }}>
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: { xs: '2.4rem', sm: '3.2rem' },
              letterSpacing: '0.04em',
              color: 'var(--rl-cream)',
              lineHeight: 1,
              mb: 1,
            }}
          >
            Rate
          </Typography>
          <Typography sx={{ color: 'var(--rl-muted)', maxWidth: 480, fontSize: '0.95rem' }}>
            Tap a poster to place it in your ranking.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 1.25, sm: 1.75 }}>
          {movies.map((movie) => {
            const isRated = ratedIds.has(movie.id?.toString());
            const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

            return (
              <Grid key={movie.id} item xs={4} sm={3} md={2}>
                <Box
                  onClick={() => !isRated && openRate(movie)}
                  role="button"
                  tabIndex={isRated ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!isRated && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      openRate(movie);
                    }
                  }}
                  sx={{
                    cursor: isRated ? 'default' : 'pointer',
                    opacity: isRated ? 0.45 : 1,
                    transition: 'transform 0.2s ease, opacity 0.2s ease',
                    '&:hover': isRated
                      ? undefined
                      : {
                          transform: { xs: 'none', sm: 'translateY(-3px)' },
                          '& .poster-frame': {
                            borderColor: 'rgba(212, 160, 23, 0.55)',
                          },
                        },
                  }}
                >
                  <Box
                    className="poster-frame"
                    sx={{
                      position: 'relative',
                      aspectRatio: '2 / 3',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid rgba(244, 239, 230, 0.12)',
                      backgroundColor: 'rgba(244, 239, 230, 0.04)',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <Box
                      component="img"
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                          : '/placeholder-movie.jpg'
                      }
                      alt={movie.title}
                      loading="lazy"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    {isRated && (
                      <Chip
                        icon={<CheckIcon sx={{ fontSize: '0.85rem !important' }} />}
                        label="Rated"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          height: 22,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(12, 11, 10, 0.82)',
                          color: 'var(--rl-accent)',
                          border: '1px solid rgba(212, 160, 23, 0.35)',
                          '& .MuiChip-icon': { color: 'var(--rl-accent)', ml: 0.5 },
                        }}
                      />
                    )}
                    {!isRated && movie.vote_average > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 6,
                          right: 6,
                          px: 0.6,
                          py: 0.15,
                          borderRadius: 0.75,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          color: 'var(--rl-cream)',
                          backgroundColor: 'rgba(12, 11, 10, 0.78)',
                          border: '1px solid rgba(244, 239, 230, 0.15)',
                        }}
                      >
                        {movie.vote_average.toFixed(1)}
                      </Box>
                    )}
                  </Box>
                  <Typography
                    noWrap
                    sx={{
                      mt: 0.75,
                      fontSize: { xs: '0.72rem', sm: '0.8rem' },
                      fontWeight: 600,
                      color: 'var(--rl-cream)',
                      lineHeight: 1.25,
                    }}
                  >
                    {movie.title}
                  </Typography>
                  {year && (
                    <Typography
                      sx={{
                        fontSize: '0.68rem',
                        color: 'rgba(244, 239, 230, 0.45)',
                        lineHeight: 1.2,
                      }}
                    >
                      {year}
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 } }}>
          <Button
            variant="outlined"
            onClick={() => loadPage(page + 1)}
            disabled={!hasMore || loading}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              px: 3,
              py: 0.9,
              borderColor: 'rgba(244, 239, 230, 0.22)',
              color: 'var(--rl-cream)',
              '&:hover': {
                borderColor: 'var(--rl-accent)',
                backgroundColor: 'rgba(212, 160, 23, 0.08)',
              },
              '&.Mui-disabled': {
                borderColor: 'rgba(244, 239, 230, 0.1)',
                color: 'rgba(244, 239, 230, 0.35)',
              },
            }}
          >
            {loading ? <CircularProgress size={16} sx={{ color: 'var(--rl-accent)' }} /> : hasMore ? 'Load more' : 'No more'}
          </Button>
        </Box>
      </Container>

      {ratingMovie && (
        <RatingModal
          open={Boolean(ratingMovie)}
          movie={ratingMovie}
          onClose={() => setRatingMovie(null)}
          onComplete={() => setRatingMovie(null)}
        />
      )}
    </Box>
  );
};

export default Rate;
