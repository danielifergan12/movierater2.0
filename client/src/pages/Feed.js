import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Box,
  Chip,
  Rating,
  Button,
  IconButton,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share
} from '@mui/icons-material';
import api from '../config/axios';

const Feed = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/feed/recent';
      
      switch (activeTab) {
        case 0:
          endpoint = '/api/feed/personal';
          break;
        case 1:
          endpoint = '/api/feed/trending';
          break;
        case 2:
          endpoint = '/api/feed/recent';
          break;
        default:
          endpoint = '/api/feed/recent';
      }

      const response = await api.get(`${endpoint}?page=${page}&limit=10`);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const handleLike = async (reviewId) => {
    try {
      const response = await api.post(`/api/reviews/${reviewId}/like`);
      // Update the review in the state
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? {
                ...review,
                likes: response.data.isLiked
                  ? [...review.likes, 'current-user']
                  : review.likes.filter(id => id !== 'current-user'),
                likeCount: response.data.likeCount
              }
            : review
        )
      );
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const ReviewCard = ({ review }) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={review.user?.profilePicture}
            sx={{ mr: 2 }}
          >
            {review.user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {review.user?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(review.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CardMedia
            component="img"
            sx={{ width: 80, height: 120, mr: 2, borderRadius: 1 }}
            image={review.movie?.posterPath ? `https://image.tmdb.org/t/p/w500${review.movie.posterPath}` : '/placeholder-movie.jpg'}
            alt={review.movie?.title}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {review.movie?.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating value={review.rating} readOnly size="small" />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {review.rating}/5
              </Typography>
            </Box>
            {review.mood && (
              <Chip
                label={review.mood}
                size="small"
                color="primary"
                sx={{ mr: 1 }}
              />
            )}
            {review.tags?.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ mr: 1, mt: 1 }}
              />
            ))}
          </Box>
        </Box>

        {review.reviewText && (
          <Typography variant="body1" paragraph>
            {review.reviewText}
          </Typography>
        )}

        {review.photos?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {review.photos.map((photo, index) => (
              <img
                key={index}
                src={photo.url}
                alt={`Review ${index + 1}`}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: 8
                }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => handleLike(review._id)}
            color="error"
          >
            {review.likes?.includes('current-user') ? (
              <Favorite />
            ) : (
              <FavoriteBorder />
            )}
          </IconButton>
          <Typography variant="body2">
            {review.likes?.length || 0} likes
          </Typography>
          
          <IconButton>
            <Comment />
          </IconButton>
          <Typography variant="body2">
            {review.comments?.length || 0} comments
          </Typography>
          
          <IconButton>
            <Share />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Movie Feed
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Following" />
          <Tab label="Trending" />
          <Tab label="Recent" />
        </Tabs>
      </Box>

      {reviews.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No reviews found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start following users or rate some movies to see content here!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {reviews.map((review) => (
            <Grid item xs={12} key={review._id}>
              <ReviewCard review={review} />
            </Grid>
          ))}
        </Grid>
      )}

      {reviews.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
          >
            Load More
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Feed;
