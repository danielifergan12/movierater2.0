import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';
import api from '../config/axios';

const GenreMovies = () => {
  const { genreId } = useParams();
  const [searchParams] = useSearchParams();
  const genreName = searchParams.get('name') || 'Genre';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { rawRatings } = useRatings();
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [ratingMovie, setRatingMovie] = useState(null);

  useEffect(() => {
    loadMovies(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreId]);

  const loadMovies = async (nextPage, replace = false) => {
    if (!genreId) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/movies/genre/${genreId}/highly-rated?page=${nextPage}`);
      const newMovies = response.data.results || [];
      setMovies((prev) => (replace ? newMovies : [...prev, ...newMovies]));
      const totalPages = response.data.total_pages || 0;
      setHasMore(nextPage < totalPages && newMovies.length > 0);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading genre movies:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRateClick = (movie) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/genre/${genreId}?name=${encodeURIComponent(genreName)}`)}`;
      return;
    }
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg',
      releaseDate: movie.release_date || null,
      genres: movie.genre_ids || null,
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
            'radial-gradient(ellipse 70% 45% at 12% 0%, rgba(212,160,23,0.09), transparent 60%), radial-gradient(ellipse 50% 40% at 92% 18%, rgba(244,239,230,0.04), transparent 55%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4.5 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ position: 'relative', textAlign: 'center', mb: 1, px: { xs: 4, sm: 5 } }}>
          <IconButton
            onClick={() => navigate('/?tab=2')}
            size="small"
            sx={{
              position: 'absolute',
              left: 0,
              top: 0.25,
              color: 'var(--rl-muted)',
              '&:hover': { color: 'var(--rl-cream)', backgroundColor: 'rgba(244,239,230,0.06)' },
            }}
            aria-label="Back to genres"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: { xs: '2rem', sm: '2.5rem' },
              letterSpacing: '0.04em',
              color: 'var(--rl-cream)',
              lineHeight: 1.05,
            }}
          >
            {genreName}
          </Typography>
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem', mt: 0.5 }}>
            Highly rated {genreName.toLowerCase()} films
          </Typography>
        </Box>

        {loading && movies.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
            <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
          </Box>
        ) : movies.length === 0 ? (
          <Typography sx={{ color: 'var(--rl-muted)', textAlign: 'center', py: 8 }}>
            No movies found for this genre.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(3, minmax(0, 1fr))',
                  sm: 'repeat(4, minmax(0, 1fr))',
                  md: 'repeat(5, minmax(0, 1fr))',
                  lg: 'repeat(6, minmax(0, 1fr))',
                },
                gap: { xs: 1, sm: 1.25, md: 1.5 },
                mt: { xs: 2.5, sm: 3 },
                mx: 'auto',
                justifyItems: 'center',
                maxWidth: 1100,
              }}
            >
              {movies.map((movie) => {
                const isAlreadyRated = rawRatings.some((r) => r.id?.toString() === movie.id?.toString());
                const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

                return (
                  <Box
                    key={movie.id}
                    sx={{
                      minWidth: 0,
                      width: '100%',
                      '&:hover .action-btn': { opacity: 1 },
                      '&:hover .poster-frame': { borderColor: 'rgba(212, 160, 23, 0.55)' },
                      '&:hover .title': { color: 'var(--rl-accent)' },
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
                        boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                        transition: 'border-color 0.15s ease, transform 0.15s ease',
                        '&:hover': {
                          transform: { xs: 'none', sm: 'translateY(-2px)' },
                        },
                      }}
                    >
                      <Box
                        component={Link}
                        to={`/movie/${movie.id}`}
                        sx={{ display: 'block', width: '100%', height: '100%' }}
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
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </Box>

                      {movie.vote_average > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 5,
                            left: 5,
                            px: 0.65,
                            py: 0.15,
                            borderRadius: 0.5,
                            backgroundColor: 'rgba(12,11,10,0.78)',
                            color: 'var(--rl-accent)',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            lineHeight: 1.4,
                          }}
                        >
                          {movie.vote_average.toFixed(1)}
                        </Box>
                      )}

                      {!isAlreadyRated && (
                        <Button
                          className="action-btn"
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRateClick(movie);
                          }}
                          sx={{
                            position: 'absolute',
                            left: 5,
                            right: 5,
                            bottom: 5,
                            minWidth: 0,
                            py: 0.35,
                            px: 0.5,
                            textTransform: 'none',
                            fontSize: { xs: '0.6rem', sm: '0.72rem' },
                            fontWeight: 700,
                            lineHeight: 1.2,
                            borderRadius: 0.75,
                            color: 'var(--rl-ink)',
                            backgroundColor: 'var(--rl-accent)',
                            opacity: { xs: 1, sm: 0 },
                            transition: 'opacity 0.15s ease',
                            '&:hover': { backgroundColor: 'var(--rl-accent-hover)' },
                          }}
                        >
                          {isAuthenticated ? 'Rate' : 'Sign in'}
                        </Button>
                      )}

                      {isAlreadyRated && (
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 5,
                            bottom: 5,
                            px: 0.65,
                            py: 0.2,
                            borderRadius: 0.5,
                            backgroundColor: 'rgba(12,11,10,0.78)',
                            color: 'var(--rl-muted)',
                            fontSize: '0.62rem',
                            fontWeight: 600,
                          }}
                        >
                          Ranked
                        </Box>
                      )}
                    </Box>

                    <Typography
                      className="title"
                      component={Link}
                      to={`/movie/${movie.id}`}
                      title={movie.title}
                      sx={{
                        display: 'block',
                        mt: 0.6,
                        color: 'var(--rl-cream)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        lineHeight: 1.25,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {movie.title}
                    </Typography>
                    {year && (
                      <Typography
                        sx={{
                          display: 'block',
                          color: 'var(--rl-muted)',
                          fontSize: { xs: '0.58rem', sm: '0.68rem' },
                          textAlign: 'center',
                          mt: 0.15,
                        }}
                      >
                        {year}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>

            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 } }}>
                <Button
                  variant="outlined"
                  onClick={() => loadMovies(page + 1)}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1,
                    borderColor: 'rgba(244, 239, 230, 0.2)',
                    color: 'var(--rl-cream)',
                    px: 2.5,
                    py: 0.85,
                    fontSize: '0.85rem',
                    '&:hover': {
                      borderColor: 'rgba(212, 160, 23, 0.5)',
                      backgroundColor: 'rgba(212, 160, 23, 0.08)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={18} sx={{ color: 'var(--rl-accent)' }} /> : 'Load more'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>

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

export default GenreMovies;
