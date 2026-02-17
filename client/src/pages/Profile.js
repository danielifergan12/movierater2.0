import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  Chip,
  Rating,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Divider
} from '@mui/material';
import {
  PersonAdd,
  PersonRemove,
  Favorite,
  FavoriteBorder,
  Comment,
  Share
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileResponse, reviewsResponse] = await Promise.all([
        api.get(`/api/users/${userId}`),
        api.get(`/api/reviews/user/${userId}`)
      ]);

      setProfileUser(profileResponse.data.user);
      setReviews(profileResponse.data.recentReviews);
      setIsFollowing(profileResponse.data.user.followers?.some(f => f._id === currentUser?._id));
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await api.post(`/api/users/${userId}/follow`);
      setIsFollowing(response.data.isFollowing);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleLike = async (reviewId) => {
    try {
      const response = await api.post(`/api/reviews/${reviewId}/like`);
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
    <Card sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ width: 80, height: 120, mr: 2 }}>
          <img
            src={review.movie?.posterPath ? `https://image.tmdb.org/t/p/w500${review.movie.posterPath}` : '/placeholder-movie.jpg'}
            alt={review.movie?.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 8
            }}
          />
        </Box>
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
          <Typography variant="body2" color="text.secondary">
            {new Date(review.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      {review.reviewText && (
        <Typography variant="body1" paragraph>
          {review.reviewText}
        </Typography>
      )}

      {review.mood && (
        <Chip
          label={review.mood}
          size="small"
          color="primary"
          sx={{ mr: 1, mb: 1 }}
        />
      )}

      {review.tags?.map(tag => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          variant="outlined"
          sx={{ mr: 1, mb: 1 }}
        />
      ))}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
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
      </Box>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!profileUser) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4">User not found</Typography>
      </Container>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                src={profileUser.profilePicture}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              >
                {profileUser.username?.charAt(0).toUpperCase()}
              </Avatar>
              
              <Typography variant="h4" gutterBottom>
                {profileUser.username}
              </Typography>
              
              {profileUser.bio && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {profileUser.bio}
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {profileUser.movieStats?.totalMoviesWatched || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Movies Watched
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {profileUser.followers?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Followers
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {profileUser.following?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Following
                  </Typography>
                </Box>
              </Box>

              {!isOwnProfile && isAuthenticated && (
                <Button
                  variant={isFollowing ? "outlined" : "contained"}
                  startIcon={isFollowing ? <PersonRemove /> : <PersonAdd />}
                  onClick={handleFollow}
                  fullWidth
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Recent Reviews" />
              <Tab label="Stats" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Recent Reviews ({reviews.length})
              </Typography>
              {reviews.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  No reviews yet
                </Typography>
              ) : (
                reviews.map(review => (
                  <ReviewCard key={review._id} review={review} />
                ))
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Movie Statistics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Movies Watched
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {profileUser.movieStats?.totalMoviesWatched || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Average Rating Given
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {profileUser.movieStats?.averageRating?.toFixed(1) || '0.0'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {profileUser.movieStats?.favoriteGenres && profileUser.movieStats.favoriteGenres.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Favorite Genres
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profileUser.movieStats.favoriteGenres.map((genre, index) => (
                      <Chip
                        key={index}
                        label={genre.name}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
