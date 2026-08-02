import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Avatar,
  Chip,
  Rating,
  Button,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import SocialPageShell, {
  socialTitleSx,
  socialSubtitleSx,
  socialGhostBtn,
  socialCardSx,
} from '../components/SocialPageShell';

const Feed = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [friendActivity, setFriendActivity] = useState([]);

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const res = await api.get('/api/users/following/rankings');
        const rows = (res.data?.rankings || [])
          .filter((u) => u.ratings?.length)
          .map((u) => ({
            userId: u.userId,
            username: u.username,
            movie: u.ratings[0],
          }))
          .slice(0, 8);
        setFriendActivity(rows);
      } catch (e) {
        console.error(e);
      }
    };
    loadFriends();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/feed/recent';
      if (activeTab === 0) endpoint = '/api/feed/personal';
      else if (activeTab === 1) endpoint = '/api/feed/trending';
      else endpoint = '/api/feed/recent';

      const response = await api.get(`${endpoint}?page=${page}&limit=10`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reviewId) => {
    try {
      const response = await api.post(`/api/reviews/${reviewId}/like`);
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                likes: response.data.isLiked
                  ? [...(review.likes || []), 'current-user']
                  : (review.likes || []).filter((id) => id !== 'current-user'),
                likeCount: response.data.likeCount,
              }
            : review
        )
      );
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  return (
    <SocialPageShell maxWidth="sm">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography sx={socialTitleSx}>Feed</Typography>
        <Typography sx={socialSubtitleSx}>
          Rankings and reviews from people you follow
        </Typography>
      </Box>

      {friendActivity.length > 0 && (
        <Box sx={{ mb: 3.5 }}>
          <Typography
            sx={{
              fontWeight: 700,
              mb: 1.25,
              color: 'var(--rl-accent)',
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Friends just ranked
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1.25,
              overflowX: 'auto',
              pb: 1,
              justifyContent: { xs: 'flex-start', sm: 'center' },
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(244,239,230,0.15)', borderRadius: 2 },
            }}
          >
            {friendActivity.map((row) => (
              <Box key={`${row.userId}-${row.movie?.id}`} sx={{ minWidth: 88, maxWidth: 88, textAlign: 'center', flexShrink: 0 }}>
                <Box
                  component={Link}
                  to={`/movie/${row.movie?.id}`}
                  sx={{
                    display: 'block',
                    aspectRatio: '2 / 3',
                    borderRadius: 0.75,
                    overflow: 'hidden',
                    border: '1px solid rgba(244,239,230,0.12)',
                    mb: 0.6,
                  }}
                >
                  <Box
                    component="img"
                    src={row.movie?.posterUrl || '/placeholder-movie.jpg'}
                    alt={row.movie?.title || ''}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
                <Typography
                  component={Link}
                  to={`/profile/${row.userId}`}
                  sx={{
                    color: 'var(--rl-cream)',
                    fontSize: '0.7rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    '&:hover': { color: 'var(--rl-accent)' },
                  }}
                >
                  {row.username}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => {
            setActiveTab(v);
            setPage(1);
          }}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              color: 'var(--rl-muted)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              minHeight: 36,
              px: 1.5,
              '&.Mui-selected': { color: 'var(--rl-cream)' },
            },
            '& .MuiTabs-indicator': { backgroundColor: 'var(--rl-accent)', height: 2 },
          }}
        >
          <Tab label="Following" />
          <Tab label="Trending" />
          <Tab label="Recent" />
        </Tabs>
      </Box>

      {loading && reviews.length === 0 ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
        </Box>
      ) : reviews.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 600, mb: 0.5 }}>
            Nothing here yet
          </Typography>
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.88rem', mb: 2 }}>
            Follow people or write a review to fill your feed.
          </Typography>
          <Button component={Link} to="/discover" variant="outlined" sx={socialGhostBtn}>
            Discover people
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {reviews.map((review) => (
            <Box key={review._id} sx={{ ...socialCardSx, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1.25 }}>
                <Avatar
                  src={review.user?.profilePicture}
                  component={Link}
                  to={`/profile/${review.user?._id}`}
                  sx={{ width: 34, height: 34, bgcolor: 'rgba(244,239,230,0.08)', textDecoration: 'none' }}
                >
                  {review.user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    component={Link}
                    to={`/profile/${review.user?._id}`}
                    sx={{
                      color: 'var(--rl-cream)',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                      '&:hover': { color: 'var(--rl-accent)' },
                    }}
                  >
                    {review.user?.username}
                  </Typography>
                  <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.7rem' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, mb: review.reviewText ? 1.5 : 1 }}>
                <Box
                  component={Link}
                  to={`/movie/${review.movie?.tmdbId || review.movie?.id}`}
                  sx={{
                    width: 56,
                    flexShrink: 0,
                    aspectRatio: '2 / 3',
                    borderRadius: 0.75,
                    overflow: 'hidden',
                    border: '1px solid rgba(244,239,230,0.12)',
                  }}
                >
                  <Box
                    component="img"
                    src={
                      review.movie?.posterPath
                        ? `https://image.tmdb.org/t/p/w185${review.movie.posterPath}`
                        : '/placeholder-movie.jpg'
                    }
                    alt={review.movie?.title || ''}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    component={Link}
                    to={`/movie/${review.movie?.tmdbId || review.movie?.id}`}
                    sx={{
                      color: 'var(--rl-cream)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textDecoration: 'none',
                      display: 'block',
                      mb: 0.5,
                      '&:hover': { color: 'var(--rl-accent)' },
                    }}
                  >
                    {review.movie?.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      sx={{ '& .MuiRating-iconFilled': { color: 'var(--rl-accent)' } }}
                    />
                    <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.75rem' }}>
                      {review.rating}/5
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {review.mood && (
                      <Chip
                        label={review.mood}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          bgcolor: 'rgba(212,160,23,0.1)',
                          color: 'var(--rl-accent)',
                        }}
                      />
                    )}
                    {review.tags?.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          borderColor: 'rgba(244,239,230,0.15)',
                          color: 'var(--rl-muted)',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>

              {review.reviewText && (
                <Typography sx={{ color: 'rgba(244,239,230,0.78)', fontSize: '0.88rem', lineHeight: 1.55, mb: 1 }}>
                  {review.reviewText}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => handleLike(review._id)}
                  sx={{ color: review.likes?.includes('current-user') ? '#e57373' : 'var(--rl-muted)' }}
                >
                  {review.likes?.includes('current-user') ? (
                    <Favorite fontSize="small" />
                  ) : (
                    <FavoriteBorder fontSize="small" />
                  )}
                </IconButton>
                <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.78rem' }}>
                  {review.likeCount ?? review.likes?.length ?? 0}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {reviews.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading}
            sx={socialGhostBtn}
          >
            {loading ? <CircularProgress size={18} sx={{ color: 'var(--rl-accent)' }} /> : 'Load more'}
          </Button>
        </Box>
      )}
    </SocialPageShell>
  );
};

export default Feed;
