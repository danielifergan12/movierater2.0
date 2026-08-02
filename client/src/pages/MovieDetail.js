import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
  Rating,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Star,
  Bookmark,
  BookmarkBorder,
  Edit as EditIcon,
  Person as PersonIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';
import ReviewForm from '../components/ReviewForm';
import AddToListDialog from '../components/AddToListDialog';
import api from '../config/axios';

const sectionTitleSx = {
  fontFamily: '"Bebas Neue", sans-serif',
  fontSize: { xs: '1.35rem', sm: '1.55rem' },
  letterSpacing: '0.04em',
  color: 'var(--rl-cream)',
  mb: 2,
};

const ghostBtn = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 1,
  borderColor: 'rgba(244, 239, 230, 0.22)',
  color: 'var(--rl-cream)',
  px: 2,
  py: 0.85,
  fontSize: '0.85rem',
  boxShadow: 'none',
  '&:hover': {
    borderColor: 'rgba(212, 160, 23, 0.55)',
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    boxShadow: 'none',
  },
};

const accentBtn = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 1,
  backgroundImage: 'none',
  backgroundColor: 'var(--rl-accent)',
  color: 'var(--rl-ink)',
  px: 2.25,
  py: 0.85,
  fontSize: '0.85rem',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: 'var(--rl-accent-hover)',
    boxShadow: 'none',
  },
};

const MovieDetail = () => {
  const { movieId } = useParams();
  const { getMovieDetails } = useMovies();
  const { isAuthenticated } = useAuth();
  const { rawRatings, computeScore } = useRatings();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);

  const movieIdNum = parseInt(movieId, 10);
  const movieRating = rawRatings.find((r) => {
    const rId = typeof r.id === 'string' ? parseInt(r.id, 10) : r.id;
    return rId === movieIdNum || r.id?.toString() === movieId?.toString();
  });
  const ratingIndex = rawRatings.findIndex((r) => {
    const rId = typeof r.id === 'string' ? parseInt(r.id, 10) : r.id;
    return rId === movieIdNum || r.id?.toString() === movieId?.toString();
  });
  const currentScore = ratingIndex >= 0 ? computeScore(ratingIndex, rawRatings.length) : null;

  useEffect(() => {
    fetchMovieDetails();
    if (isAuthenticated && movieId) {
      checkWatchlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, isAuthenticated]);

  useEffect(() => {
    if (movie?._id) {
      fetchExtras();
      if (isAuthenticated) {
        fetchUserReview();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?._id, isAuthenticated]);

  const fetchExtras = async () => {
    if (!movieId || !movie?._id) return;
    try {
      const [creditsRes, similarRes, reviewsRes] = await Promise.all([
        api.get(`/api/movies/${movieId}/credits`).catch(() => ({ data: { cast: [], crew: [] } })),
        api.get(`/api/movies/${movieId}/similar`).catch(() => ({ data: { results: [] } })),
        api.get(`/api/reviews/movie/${movie._id}`).catch(() => ({ data: { reviews: [] } })),
      ]);

      setCast(creditsRes.data.cast?.slice(0, 10) || []);
      setCrew(
        creditsRes.data.crew?.filter((c) => ['Director', 'Producer', 'Writer'].includes(c.job)).slice(0, 5) || []
      );
      setSimilarMovies(similarRes.data.results?.slice(0, 6) || []);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching extras:', error);
    }
  };

  const fetchUserReview = async () => {
    if (!isAuthenticated || !movie?._id) return;
    try {
      const response = await api.get(`/api/reviews/user/${movie._id}`);
      if (response.data.reviews && response.data.reviews.length > 0) {
        setUserReview(response.data.reviews[0]);
      }
    } catch (error) {
      // User may not have a review yet
    }
  };

  const checkWatchlist = async () => {
    try {
      const response = await api.get(`/api/watchlist/check/${movieId}`);
      setInWatchlist(response.data.inWatchlist);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/movie/${movieId}`)}`;
      return;
    }

    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await api.delete(`/api/watchlist/${movieId}`);
        setInWatchlist(false);
      } else {
        await api.post('/api/watchlist', {
          movieId: movie.id || movie.tmdbId?.toString(),
          tmdbId: movie.tmdbId || movie.id,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseDate: movie.releaseDate,
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleRateClick = () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/movie/${movieId}`)}`;
      return;
    }
    setShowRatingModal(true);
  };

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const movieData = await getMovieDetails(movieId);
      setMovie(movieData);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const year = movie?.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : movie?.release_date
      ? new Date(movie.release_date).getFullYear()
      : null;

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0c0b0a' }}>
        <CircularProgress sx={{ color: 'var(--rl-accent)' }} size={28} />
      </Box>
    );
  }

  if (!movie) {
    return (
      <Box sx={{ minHeight: '60vh', bgcolor: '#0c0b0a', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ color: 'var(--rl-cream)', fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.8rem', mb: 1 }}>
            Movie not found
          </Typography>
          <Button component={Link} to="/" sx={{ ...ghostBtn, mt: 1 }} variant="outlined">
            Back home
          </Button>
        </Container>
      </Box>
    );
  }

  const otherReviews = reviews.filter((r) => !userReview || r._id !== userReview._id);

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
            'radial-gradient(ellipse 70% 45% at 15% 0%, rgba(212,160,23,0.09), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 20%, rgba(244,239,230,0.04), transparent 55%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '160px 1fr', md: '200px 1fr' },
            gap: { xs: 2.5, sm: 3.5 },
            alignItems: 'start',
            mb: { xs: 4, sm: 5 },
          }}
        >
          <Box
            sx={{
              width: { xs: 148, sm: '100%' },
              mx: { xs: 'auto', sm: 0 },
              aspectRatio: '2 / 3',
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid rgba(244, 239, 230, 0.12)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
              backgroundColor: 'rgba(244,239,230,0.04)',
            }}
          >
            <Box
              component="img"
              src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg'}
              alt={movie.title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>

          <Box sx={{ minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: { xs: '2rem', sm: '2.45rem', md: '2.75rem' },
                letterSpacing: '0.03em',
                color: 'var(--rl-cream)',
                lineHeight: 1.05,
                mb: 1,
              }}
            >
              {movie.title}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                flexWrap: 'wrap',
                gap: 1.25,
                mb: 2,
                color: 'var(--rl-muted)',
                fontSize: '0.85rem',
              }}
            >
              {year && <Typography component="span" sx={{ color: 'var(--rl-muted)', fontSize: 'inherit' }}>{year}</Typography>}
              {movie.imdbRating != null && (
                <>
                  {year && <Box component="span" sx={{ opacity: 0.4 }}>·</Box>}
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                    <Typography component="span" sx={{ color: 'var(--rl-accent)', fontWeight: 700, fontSize: 'inherit' }}>
                      {Number(movie.imdbRating).toFixed(1)}
                    </Typography>
                    <Typography component="span" sx={{ color: 'var(--rl-muted)', fontSize: 'inherit' }}>
                      IMDb
                    </Typography>
                  </Box>
                </>
              )}
              {movieRating && currentScore != null && (
                <>
                  <Box component="span" sx={{ opacity: 0.4 }}>·</Box>
                  <Typography component="span" sx={{ color: 'var(--rl-cream)', fontWeight: 600, fontSize: 'inherit' }}>
                    Yours {currentScore.toFixed(1)} · #{ratingIndex + 1}
                  </Typography>
                </>
              )}
            </Box>

            {movie.overview && (
              <Typography
                sx={{
                  color: 'rgba(244,239,230,0.72)',
                  fontSize: { xs: '0.88rem', sm: '0.95rem' },
                  lineHeight: 1.65,
                  mb: 2.5,
                  maxWidth: 560,
                  mx: { xs: 'auto', sm: 0 },
                }}
              >
                {movie.overview}
              </Typography>
            )}

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: { xs: 'center', sm: 'flex-start' },
              }}
            >
              <Button
                variant="contained"
                startIcon={<Star sx={{ fontSize: '1rem !important' }} />}
                onClick={handleRateClick}
                sx={accentBtn}
              >
                {!isAuthenticated
                  ? 'Sign in to rate'
                  : movieRating
                    ? 'Re-rank'
                    : 'Rate'}
              </Button>

              {isAuthenticated && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={
                      inWatchlist
                        ? <Bookmark sx={{ fontSize: '1rem !important' }} />
                        : <BookmarkBorder sx={{ fontSize: '1rem !important' }} />
                    }
                    onClick={handleWatchlistToggle}
                    disabled={watchlistLoading}
                    sx={{
                      ...ghostBtn,
                      ...(inWatchlist
                        ? {
                            borderColor: 'rgba(212, 160, 23, 0.45)',
                            color: 'var(--rl-accent)',
                            backgroundColor: 'rgba(212, 160, 23, 0.08)',
                          }
                        : {}),
                    }}
                  >
                    {inWatchlist ? 'Saved' : 'Watchlist'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ListIcon sx={{ fontSize: '1rem !important' }} />}
                    onClick={() => setShowAddToListDialog(true)}
                    sx={ghostBtn}
                  >
                    Add to list
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {(cast.length > 0 || crew.length > 0) && (
          <Box sx={{ mb: { xs: 4, sm: 5 } }}>
            <Typography sx={sectionTitleSx}>Cast & crew</Typography>
            {cast.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  overflowX: 'auto',
                  pb: 1.5,
                  mb: crew.length > 0 ? 2.5 : 0,
                  mx: { xs: -2, sm: 0 },
                  px: { xs: 2, sm: 0 },
                  '&::-webkit-scrollbar': { height: 4 },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(244,239,230,0.15)', borderRadius: 2 },
                }}
              >
                {cast.map((actor) => (
                  <Box
                    key={actor.id}
                    component={Link}
                    to={`/person/${actor.id}`}
                    sx={{
                      minWidth: 88,
                      maxWidth: 88,
                      textAlign: 'center',
                      flexShrink: 0,
                      textDecoration: 'none',
                      '&:hover .cast-name': { color: 'var(--rl-accent)' },
                      '&:hover .MuiAvatar-root': { borderColor: 'rgba(212,160,23,0.45)' },
                    }}
                  >
                    <Avatar
                      src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : undefined}
                      sx={{
                        width: 72,
                        height: 72,
                        mx: 'auto',
                        mb: 0.75,
                        border: '1px solid rgba(244,239,230,0.12)',
                        bgcolor: 'rgba(244,239,230,0.06)',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <PersonIcon sx={{ color: 'var(--rl-muted)' }} />
                    </Avatar>
                    <Typography
                      className="cast-name"
                      sx={{
                        color: 'var(--rl-cream)',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {actor.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'var(--rl-muted)',
                        fontSize: '0.65rem',
                        lineHeight: 1.25,
                        mt: 0.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {actor.character}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            {crew.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {crew.map((member) => (
                  <Chip
                    key={`${member.id}-${member.job}`}
                    component={Link}
                    to={`/person/${member.id}`}
                    clickable
                    label={`${member.name} · ${member.job}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(244,239,230,0.05)',
                      color: 'var(--rl-muted)',
                      border: '1px solid rgba(244,239,230,0.1)',
                      fontSize: '0.72rem',
                      height: 26,
                      textDecoration: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(212,160,23,0.12)',
                        color: 'var(--rl-accent)',
                        borderColor: 'rgba(212,160,23,0.35)',
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ mb: { xs: 4, sm: 5 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              gap: 1,
            }}
          >
            <Typography sx={{ ...sectionTitleSx, mb: 0 }}>
              Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}
            </Typography>
            {isAuthenticated && (
              <Button
                size="small"
                startIcon={userReview ? <EditIcon sx={{ fontSize: '0.95rem !important' }} /> : <Star sx={{ fontSize: '0.95rem !important' }} />}
                onClick={() => setShowReviewForm(true)}
                sx={{ ...ghostBtn, py: 0.55, px: 1.5, fontSize: '0.78rem' }}
                variant="outlined"
              >
                {userReview ? 'Edit' : 'Write'}
              </Button>
            )}
          </Box>

          {userReview && (
            <Box
              sx={{
                mb: 1.5,
                p: 2,
                borderRadius: 1,
                border: '1px solid rgba(212, 160, 23, 0.25)',
                backgroundColor: 'rgba(212, 160, 23, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography sx={{ color: 'var(--rl-accent)', fontWeight: 700, fontSize: '0.78rem', mb: 0.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Your review
                  </Typography>
                  <Rating value={userReview.rating} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: 'var(--rl-accent)' } }} />
                </Box>
                <IconButton size="small" onClick={() => setShowReviewForm(true)} sx={{ color: 'var(--rl-muted)' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              {userReview.reviewText && (
                <Typography sx={{ color: 'rgba(244,239,230,0.8)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                  {userReview.reviewText}
                </Typography>
              )}
              {userReview.mood && (
                <Chip
                  label={userReview.mood}
                  size="small"
                  sx={{ mt: 1.25, bgcolor: 'rgba(212,160,23,0.12)', color: 'var(--rl-accent)', height: 24, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}

          {otherReviews.length === 0 && !userReview ? (
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.88rem', py: 1 }}>
              No reviews yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {otherReviews.map((review) => (
                <Box
                  key={review._id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid rgba(244,239,230,0.08)',
                    backgroundColor: 'rgba(244,239,230,0.03)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.25, gap: 1.25 }}>
                    <Avatar
                      src={review.user?.profilePicture}
                      sx={{ width: 32, height: 32, bgcolor: 'rgba(244,239,230,0.08)', fontSize: '0.8rem' }}
                    >
                      {review.user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {review.user?.username}
                      </Typography>
                      <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.7rem' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Rating value={review.rating} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: 'var(--rl-accent)' } }} />
                  </Box>
                  {review.reviewText && (
                    <Typography sx={{ color: 'rgba(244,239,230,0.78)', fontSize: '0.88rem', lineHeight: 1.55, mb: review.mood || review.tags?.length ? 1 : 0 }}>
                      {review.reviewText}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {review.mood && (
                      <Chip
                        label={review.mood}
                        size="small"
                        sx={{ bgcolor: 'rgba(212,160,23,0.1)', color: 'var(--rl-accent)', height: 22, fontSize: '0.68rem' }}
                      />
                    )}
                    {review.tags?.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: 'rgba(244,239,230,0.15)', color: 'var(--rl-muted)', height: 22, fontSize: '0.68rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {similarMovies.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={sectionTitleSx}>Similar</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(3, minmax(0, 1fr))',
                  sm: 'repeat(4, minmax(0, 1fr))',
                  md: 'repeat(6, minmax(0, 1fr))',
                },
                gap: { xs: 1, sm: 1.25 },
              }}
            >
              {similarMovies.map((similarMovie) => (
                <Box
                  key={similarMovie.id}
                  component={Link}
                  to={`/movie/${similarMovie.id}`}
                  sx={{
                    textDecoration: 'none',
                    minWidth: 0,
                    '&:hover .poster': { borderColor: 'rgba(212, 160, 23, 0.55)' },
                    '&:hover .title': { color: 'var(--rl-accent)' },
                  }}
                >
                  <Box
                    className="poster"
                    sx={{
                      aspectRatio: '2 / 3',
                      borderRadius: 0.75,
                      overflow: 'hidden',
                      border: '1px solid rgba(244, 239, 230, 0.12)',
                      backgroundColor: 'rgba(244,239,230,0.04)',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <Box
                      component="img"
                      src={
                        similarMovie.poster_path
                          ? `https://image.tmdb.org/t/p/w185${similarMovie.poster_path}`
                          : '/placeholder-movie.jpg'
                      }
                      alt={similarMovie.title}
                      loading="lazy"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                  <Typography
                    className="title"
                    sx={{
                      mt: 0.6,
                      color: 'var(--rl-cream)',
                      fontWeight: 600,
                      fontSize: '0.68rem',
                      lineHeight: 1.25,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {similarMovie.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {showRatingModal && (
          <RatingModal
            open={showRatingModal}
            movie={{
              id: movie.id || movie.tmdbId,
              title: movie.title,
              posterUrl: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg',
              releaseDate: movie.releaseDate || movie.release_date || null,
              genres: movie.genres || null,
            }}
            onClose={() => setShowRatingModal(false)}
            onComplete={() => setShowRatingModal(false)}
            allowRerate={true}
          />
        )}

        {showReviewForm && movie?._id && (
          <ReviewForm
            open={showReviewForm}
            onClose={() => {
              setShowReviewForm(false);
              fetchUserReview();
              fetchExtras();
            }}
            movie={{
              id: movie._id,
              title: movie.title,
              posterUrl: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg',
            }}
            existingReview={userReview}
            onComplete={() => {
              fetchUserReview();
              fetchExtras();
            }}
          />
        )}

        {showAddToListDialog && movie && (
          <AddToListDialog
            open={showAddToListDialog}
            onClose={() => setShowAddToListDialog(false)}
            movie={{
              id: movie.id || movie.tmdbId,
              tmdbId: movie.tmdbId || movie.id,
              title: movie.title,
              posterPath: movie.posterPath,
              posterUrl: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg',
              releaseDate: movie.releaseDate,
            }}
          />
        )}
      </Container>
    </Box>
  );
};

export default MovieDetail;
