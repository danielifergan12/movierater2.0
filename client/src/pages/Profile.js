import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  CardMedia,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PersonAdd,
  PersonRemove,
  Favorite,
  FavoriteBorder,
  Comment,
  Movie as MovieIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
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
  const [rankings, setRankings] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (activeTab === 2 && userId) {
      fetchRankings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId]);

  const fetchRankings = async () => {
    setLoadingRankings(true);
    try {
      const response = await api.get(`/api/users/${userId}/rankings`);
      setRankings(response.data.ratings || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setRankings([]);
    } finally {
      setLoadingRankings(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileResponse, reviewsResponse] = await Promise.all([
        api.get(`/api/users/${userId}`),
        api.get(`/api/reviews/user/${userId}`)
      ]);

      setProfileUser(profileResponse.data.user);
      setReviews(reviewsResponse.data.reviews || profileResponse.data.recentReviews || []);
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
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!profileUser) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          User not found
        </Typography>
      </Container>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Avatar
                src={profileUser.profilePicture}
                sx={{ 
                  width: { xs: 80, sm: 100, md: 120 }, 
                  height: { xs: 80, sm: 100, md: 120 }, 
                  mx: 'auto', 
                  mb: 2 
                }}
              >
                {profileUser.username?.charAt(0).toUpperCase()}
              </Avatar>
              
              <Typography variant="h4" gutterBottom sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}>
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
              <Tab label="Rankings" />
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

          {activeTab === 2 && (
            <Box>
              {loadingRankings ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#00d4ff' }} />
                </Box>
              ) : rankings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MovieIcon sx={{ fontSize: 60, color: 'rgba(0, 212, 255, 0.3)', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                    No rankings yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    This user hasn't rated any movies yet.
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Top 3 Movies */}
                  {rankings.length >= 3 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        color: '#ffffff', 
                        mb: 3,
                        textAlign: 'center',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }}>
                        🏆 Top 3 Movies
                      </Typography>
                      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        {rankings.slice(0, 3).map((ranking, index) => {
                          const getRankingColor = (pos) => {
                            if (pos === 0) return '#ffd700';
                            if (pos < 3) return '#c0c0c0';
                            if (pos < 5) return '#cd7f32';
                            return '#00d4ff';
                          };
                          const computeEvenScore = (idx, total) => {
                            if (total <= 1) return 10.0;
                            const raw = 10 - (9 * idx) / (total - 1);
                            return Math.round(raw * 10) / 10;
                          };
                          const getRankingIcon = (pos) => {
                            if (pos === 0) return '🥇';
                            if (pos === 1) return '🥈';
                            if (pos === 2) return '🥉';
                            return `#${pos + 1}`;
                          };
                          return (
                            <Grid item xs={12} sm={6} md={4} key={ranking.id}>
                              <Card sx={{
                                background: 'rgba(26, 26, 26, 0.8)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(0, 212, 255, 0.2)',
                                borderRadius: 3,
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: { xs: 'none', sm: 'translateY(-6px)' },
                                  boxShadow: { xs: 'none', sm: '0 15px 30px rgba(0, 212, 255, 0.3)' },
                                }
                              }}>
                                <Box sx={{ position: 'relative' }}>
                                  <CardMedia
                                    component="img"
                                    height={{ xs: 200, sm: 240, md: 280 }}
                                    image={ranking.posterUrl || '/placeholder-movie.jpg'}
                                    alt={ranking.title}
                                    sx={{ objectFit: 'cover' }}
                                  />
                                  <Box sx={{
                                    position: 'absolute',
                                    top: { xs: 6, sm: 10 },
                                    left: { xs: 6, sm: 10 },
                                    backgroundColor: getRankingColor(index),
                                    color: index === 0 ? '#000' : '#fff',
                                    borderRadius: '50%',
                                    width: { xs: 32, sm: 40 },
                                    height: { xs: 32, sm: 40 },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: { xs: '1rem', sm: '1.2rem' },
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                                  }}>
                                    {getRankingIcon(index)}
                                  </Box>
                                </Box>
                                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                  <Typography variant="h6" sx={{ 
                                    color: '#ffffff', 
                                    mb: 1,
                                    fontWeight: 600,
                                    fontSize: { xs: '0.9rem', sm: '1rem' }
                                  }}>
                                    {ranking.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <Rating
                                      precision={0.1}
                                      value={computeEvenScore(index, rankings.length) / 2}
                                      readOnly
                                      size="small"
                                      sx={{
                                        '& .MuiRating-iconFilled': {
                                          color: '#00d4ff',
                                        },
                                        '& .MuiRating-icon': {
                                          fontSize: { xs: '0.875rem', sm: '1rem' }
                                        }
                                      }}
                                    />
                                    <Typography variant="body2" sx={{ 
                                      ml: 1, 
                                      color: '#00d4ff',
                                      fontWeight: 600,
                                      fontSize: { xs: '0.7rem', sm: '0.8rem' }
                                    }}>
                                      {computeEvenScore(index, rankings.length).toFixed(1)}/10
                                    </Typography>
                                  </Box>
                                  <Button
                                    variant="outlined"
                                    component={Link}
                                    to={`/movie/${ranking.id}`}
                                    fullWidth
                                    size="small"
                                    sx={{
                                      borderColor: '#00d4ff',
                                      color: '#00d4ff',
                                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                      py: { xs: 0.5, sm: 0.75 },
                                      '&:hover': {
                                        borderColor: '#66e0ff',
                                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                                      },
                                    }}
                                  >
                                    View Details
                                  </Button>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  )}

                  {/* Full Rankings List */}
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ 
                      color: '#ffffff', 
                      mb: 3,
                      textAlign: 'center',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}>
                      Complete Rankings
                    </Typography>
                    
                    <Card sx={{
                      background: 'rgba(26, 26, 26, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: 4,
                    }}>
                      <List sx={{ p: 0 }}>
                        {rankings.map((ranking, index) => {
                          const getRankingColor = (pos) => {
                            if (pos === 0) return '#ffd700';
                            if (pos < 3) return '#c0c0c0';
                            if (pos < 5) return '#cd7f32';
                            return '#00d4ff';
                          };
                          const computeEvenScore = (idx, total) => {
                            if (total <= 1) return 10.0;
                            const raw = 10 - (9 * idx) / (total - 1);
                            return Math.round(raw * 10) / 10;
                          };
                          return (
                            <React.Fragment key={ranking.id}>
                              <ListItem sx={{ 
                                py: { xs: 2, sm: 3 },
                                px: { xs: 2, sm: 4 },
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 212, 255, 0.05)',
                                }
                              }}>
                                <ListItemAvatar sx={{ mr: { xs: 2, sm: 3 }, mb: { xs: 1, sm: 0 } }}>
                                  <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                      src={ranking.posterUrl || null}
                                      sx={{ 
                                        width: { xs: 60, sm: 80 }, 
                                        height: { xs: 90, sm: 120 },
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                                      }}
                                    >
                                      🎬
                                    </Avatar>
                                    <Box sx={{
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                      backgroundColor: getRankingColor(index),
                                      color: index < 3 ? '#000' : '#fff',
                                      borderRadius: '50%',
                                      width: { xs: 24, sm: 30 },
                                      height: { xs: 24, sm: 30 },
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                      fontWeight: 'bold',
                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                    }}>
                                      {index + 1}
                                    </Box>
                                  </Box>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="h6" sx={{ 
                                      color: '#ffffff', 
                                      fontWeight: 600,
                                      mb: 1,
                                      fontSize: { xs: '1rem', sm: '1.25rem' }
                                    }}>
                                      {ranking.title}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: { xs: 1, sm: 2 },
                                        flexWrap: 'wrap'
                                      }}>
                                        <Rating
                                          precision={0.1}
                                          value={computeEvenScore(index, rankings.length) / 2}
                                          readOnly
                                          size="small"
                                          sx={{
                                            '& .MuiRating-iconFilled': {
                                              color: '#00d4ff',
                                            },
                                          }}
                                        />
                                        <Typography variant="body2" sx={{ 
                                          color: '#00d4ff',
                                          fontWeight: 600,
                                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                        }}>
                                          {computeEvenScore(index, rankings.length).toFixed(1)}/10
                                        </Typography>
                                        <Chip
                                          label={`#${index + 1}`}
                                          size="small"
                                          sx={{
                                            backgroundColor: getRankingColor(index),
                                            color: index < 3 ? '#000' : '#fff',
                                            fontWeight: 'bold',
                                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  }
                                />
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 1,
                                  mt: { xs: 2, sm: 0 },
                                  width: { xs: '100%', sm: 'auto' },
                                  justifyContent: { xs: 'flex-end', sm: 'flex-start' }
                                }}>
                                  <Button
                                    variant="outlined"
                                    component={Link}
                                    to={`/movie/${ranking.id}`}
                                    size="small"
                                    sx={{
                                      borderColor: '#00d4ff',
                                      color: '#00d4ff',
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                      px: { xs: 1.5, sm: 2 },
                                      '&:hover': {
                                        borderColor: '#66e0ff',
                                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                                      },
                                    }}
                                  >
                                    View
                                  </Button>
                                </Box>
                              </ListItem>
                              {index < rankings.length - 1 && (
                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    </Card>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
