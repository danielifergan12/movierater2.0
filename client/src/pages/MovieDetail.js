import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
  Rating,
} from '@mui/material';
import { Star, Bookmark, BookmarkBorder, Edit as EditIcon, Person as PersonIcon } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';
import ReviewForm from '../components/ReviewForm';
import AddToListDialog from '../components/AddToListDialog';
import { Link } from 'react-router-dom';
import { Avatar, Divider } from '@mui/material';
import { List as ListIcon } from '@mui/icons-material';
import api from '../config/axios';

const MovieDetail = () => {
  const { movieId } = useParams();
  const { getMovieDetails } = useMovies();
  const { isAuthenticated } = useAuth();
  const { ratings, rawRatings, computeScore } = useRatings();
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
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  
  // Check if movie is already rated (handle both number and string IDs)
  const movieIdNum = parseInt(movieId);
  const movieRating = rawRatings.find(r => {
    const rId = typeof r.id === 'string' ? parseInt(r.id) : r.id;
    return rId === movieIdNum || r.id?.toString() === movieId?.toString();
  });
  const ratingIndex = rawRatings.findIndex(r => {
    const rId = typeof r.id === 'string' ? parseInt(r.id) : r.id;
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
    setLoadingExtras(true);
    try {
      const [creditsRes, similarRes, reviewsRes] = await Promise.all([
        api.get(`/api/movies/${movieId}/credits`).catch(() => ({ data: { cast: [], crew: [] } })),
        api.get(`/api/movies/${movieId}/similar`).catch(() => ({ data: { results: [] } })),
        api.get(`/api/reviews/movie/${movie._id}`).catch(() => ({ data: { reviews: [] } }))
      ]);
      
      setCast(creditsRes.data.cast?.slice(0, 10) || []);
      setCrew(creditsRes.data.crew?.filter(c => ['Director', 'Producer', 'Writer'].includes(c.job)).slice(0, 5) || []);
      setSimilarMovies(similarRes.data.results?.slice(0, 6) || []);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching extras:', error);
    } finally {
      setLoadingExtras(false);
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
          releaseDate: movie.releaseDate
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleRatingComplete = () => {
    setShowRatingModal(false);
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!movie) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Movie not found
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
            }}>
              <CardMedia
                component="img"
                height={{ xs: 400, sm: 500, md: 600 }}
                image={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg'}
                alt={movie.title}
                sx={{ borderRadius: 4 }}
              />
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom sx={{ 
              color: '#ffffff',
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
            }}>
              {movie.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
              {movie.imdbRating ? (
                <>
                  <Box
                    component="img"
                    src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                    alt="IMDB"
                    sx={{
                      height: 32,
                      width: 'auto',
                    }}
                  />
                  <Typography variant="h5" sx={{ 
                    color: '#f5c518',
                    fontWeight: 700,
                  }}>
                    {movie.imdbRating.toFixed(1)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                }}>
                  IMDB rating not available
                </Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom sx={{ 
              color: '#ffffff',
              mb: 2,
            }}>
              Description
            </Typography>
            <Typography variant="body1" paragraph sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.8,
              mb: 4,
            }}>
              {movie.overview}
            </Typography>

            {movieRating && currentScore !== null ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Your Rating: ${currentScore.toFixed(1)}/10`}
                    sx={{
                      background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      px: 2,
                      py: 2.5,
                    }}
                  />
                  <Chip
                    label={`Rank: #${ratingIndex + 1}`}
                    sx={{
                      backgroundColor: 'rgba(0, 212, 255, 0.2)',
                      color: '#00d4ff',
                      border: '1px solid rgba(0, 212, 255, 0.5)',
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Star />}
                    size="large"
                    onClick={handleRateClick}
                    sx={{
                      borderColor: '#00d4ff',
                      color: '#00d4ff',
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                      fontWeight: 600,
                      width: { xs: '100%', sm: 'auto' },
                      '&:hover': {
                        borderColor: '#66e0ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      },
                    }}
                  >
                    {!isAuthenticated ? 'Sign in to Rate' : 'Rerate This Movie'}
                  </Button>
                  {isAuthenticated && (
                    <>
                      <Button
                        variant={inWatchlist ? "contained" : "outlined"}
                        startIcon={inWatchlist ? <Bookmark /> : <BookmarkBorder />}
                        size="large"
                        onClick={handleWatchlistToggle}
                        disabled={watchlistLoading}
                        sx={{
                          ...(inWatchlist ? {
                            background: 'linear-gradient(45deg, #ff6b35, #e64a19)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #e64a19, #cc3d0f)',
                            },
                          } : {
                            borderColor: '#ff6b35',
                            color: '#ff6b35',
                            '&:hover': {
                              borderColor: '#ff8a65',
                              backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            },
                          }),
                          px: { xs: 3, sm: 4 },
                          py: { xs: 1.25, sm: 1.5 },
                          fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                          fontWeight: 600,
                          width: { xs: '100%', sm: 'auto' },
                        }}
                      >
                        {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ListIcon />}
                        size="large"
                        onClick={() => setShowAddToListDialog(true)}
                        sx={{
                          borderColor: '#00d4ff',
                          color: '#00d4ff',
                          px: { xs: 3, sm: 4 },
                          py: { xs: 1.25, sm: 1.5 },
                          fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                          fontWeight: 600,
                          width: { xs: '100%', sm: 'auto' },
                          '&:hover': {
                            borderColor: '#66e0ff',
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          },
                        }}
                      >
                        Add to List
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Button
                  variant={movieRating ? "outlined" : "contained"}
                  startIcon={<Star />}
                  size="large"
                  onClick={handleRateClick}
                  disabled={!!movieRating && isAuthenticated}
                  sx={{
                    ...(movieRating ? {
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: 'rgba(0, 212, 255, 0.5)',
                      cursor: 'not-allowed',
                    } : {
                      background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #00a8cc, #e64a19)',
                      },
                    }),
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.25, sm: 1.5 },
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                    fontWeight: 600,
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  {!isAuthenticated ? 'Sign in to Rate This Movie' : (movieRating ? 'Already Rated' : 'Rate This Movie')}
                </Button>
                {isAuthenticated && (
                  <>
                    <Button
                      variant={inWatchlist ? "contained" : "outlined"}
                      startIcon={inWatchlist ? <Bookmark /> : <BookmarkBorder />}
                      size="large"
                      onClick={handleWatchlistToggle}
                      disabled={watchlistLoading}
                      sx={{
                        ...(inWatchlist ? {
                          background: 'linear-gradient(45deg, #ff6b35, #e64a19)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #e64a19, #cc3d0f)',
                          },
                        } : {
                          borderColor: '#ff6b35',
                          color: '#ff6b35',
                          '&:hover': {
                            borderColor: '#ff8a65',
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                          },
                        }),
                        px: { xs: 3, sm: 4 },
                        py: { xs: 1.25, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                        fontWeight: 600,
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ListIcon />}
                      size="large"
                      onClick={() => setShowAddToListDialog(true)}
                      sx={{
                        borderColor: '#00d4ff',
                        color: '#00d4ff',
                        px: { xs: 3, sm: 4 },
                        py: { xs: 1.25, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                        fontWeight: 600,
                        width: { xs: '100%', sm: 'auto' },
                        '&:hover': {
                          borderColor: '#66e0ff',
                          backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        },
                      }}
                    >
                      Add to List
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Grid>
        </Grid>

        {showRatingModal && (
          <RatingModal
            open={showRatingModal}
            movie={{
              id: movie.id || movie.tmdbId,
              title: movie.title,
              posterUrl: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg',
            }}
            onClose={() => setShowRatingModal(false)}
            onComplete={handleRatingComplete}
            allowRerate={false}
          />
        )}

        {/* Cast & Crew Section */}
        {(cast.length > 0 || crew.length > 0) && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h4" sx={{ color: '#ffffff', mb: 3 }}>
              Cast & Crew
            </Typography>
            {cast.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                  Cast
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
                  {cast.map((actor) => (
                    <Box key={actor.id} sx={{ minWidth: 120, textAlign: 'center' }}>
                      <Avatar
                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : undefined}
                        sx={{ width: 120, height: 120, mx: 'auto', mb: 1 }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        {actor.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {actor.character}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            {crew.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                  Crew
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {crew.map((member) => (
                    <Chip
                      key={`${member.id}-${member.job}`}
                      label={`${member.name} - ${member.job}`}
                      sx={{
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        color: '#00d4ff',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Reviews Section */}
        <Box sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ color: '#ffffff' }}>
              Reviews ({reviews.length})
            </Typography>
            {isAuthenticated && (
              <Button
                variant="contained"
                startIcon={userReview ? <EditIcon /> : <Star />}
                onClick={() => setShowReviewForm(true)}
                sx={{
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                }}
              >
                {userReview ? 'Edit Review' : 'Write Review'}
              </Button>
            )}
          </Box>

          {userReview && (
            <Card sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
              p: 3,
              mb: 3,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                    Your Review
                  </Typography>
                  <Rating value={userReview.rating} readOnly size="small" />
                </Box>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setShowReviewForm(true)}
                  sx={{ color: '#00d4ff' }}
                >
                  Edit
                </Button>
              </Box>
              {userReview.reviewText && (
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {userReview.reviewText}
                </Typography>
              )}
              {userReview.mood && (
                <Chip
                  label={userReview.mood}
                  size="small"
                  sx={{ mt: 2, backgroundColor: 'rgba(255, 107, 53, 0.2)', color: '#ff6b35' }}
                />
              )}
            </Card>
          )}

          {reviews.filter(r => !userReview || r._id !== userReview._id).length === 0 && !userReview ? (
            <Card sx={{
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
              p: 4,
              textAlign: 'center',
            }}>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No reviews yet. Be the first to review this movie!
              </Typography>
            </Card>
          ) : (
            <Box>
              {reviews.filter(r => !userReview || r._id !== userReview._id).map((review) => (
                <Card
                  key={review._id}
                  sx={{
                    background: 'rgba(26, 26, 26, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: 4,
                    p: 3,
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={review.user?.profilePicture}
                      sx={{ mr: 2 }}
                    >
                      {review.user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        {review.user?.username}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                  {review.reviewText && (
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                      {review.reviewText}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {review.mood && (
                      <Chip
                        label={review.mood}
                        size="small"
                        sx={{ backgroundColor: 'rgba(255, 107, 53, 0.2)', color: '#ff6b35' }}
                      />
                    )}
                    {review.tags?.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: 'rgba(0, 212, 255, 0.3)', color: '#00d4ff' }}
                      />
                    ))}
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* Similar Movies Section */}
        {similarMovies.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h4" sx={{ color: '#ffffff', mb: 3 }}>
              Similar Movies
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
              {similarMovies.map((similarMovie) => (
                <Card
                  key={similarMovie.id}
                  component={Link}
                  to={`/movie/${similarMovie.id}`}
                  sx={{
                    minWidth: 150,
                    background: 'rgba(26, 26, 26, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: 4,
                    textDecoration: 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 212, 255, 0.3)',
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="225"
                    image={similarMovie.poster_path ? `https://image.tmdb.org/t/p/w300${similarMovie.poster_path}` : '/placeholder-movie.jpg'}
                    alt={similarMovie.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#ffffff',
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {similarMovie.title}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Review Form Modal */}
        {showReviewForm && movie?._id && (
          <ReviewForm
            open={showReviewForm}
            onClose={() => {
              setShowReviewForm(false);
              fetchUserReview();
              fetchExtras();
            }}
            movie={{
              id: movie._id, // Use MongoDB _id for reviews
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

        {/* Add to List Dialog */}
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
              releaseDate: movie.releaseDate
            }}
          />
        )}
      </Container>
    </Box>
  );
};

export default MovieDetail;
