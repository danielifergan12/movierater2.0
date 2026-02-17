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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PersonAdd,
  PersonRemove,
  Movie as MovieIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
      const profileResponse = await api.get(`/api/users/${userId}`);
      setProfileUser(profileResponse.data.user);
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
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                  onClick={() => navigate(`/profile/${userId}/followers`)}
                >
                  <Typography variant="h6" sx={{ color: '#00d4ff' }}>
                    {profileUser.followers?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Followers
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                  onClick={() => navigate(`/profile/${userId}/following`)}
                >
                  <Typography variant="h6" sx={{ color: '#00d4ff' }}>
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
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
