import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Rating,
  Chip,
  Button,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Movie as MovieIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

const FollowingRankings = () => {
  const { user } = useAuth();
  const [followingRankings, setFollowingRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowingRankings();
  }, []);

  const fetchFollowingRankings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users/following/rankings');
      setFollowingRankings(response.data.rankings || []);
    } catch (error) {
      console.error('Error fetching following rankings:', error);
      setFollowingRankings([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankingColor = (position) => {
    if (position === 0) return '#ffd700'; // Gold for #1
    if (position < 3) return '#c0c0c0'; // Silver for top 3
    if (position < 5) return '#cd7f32'; // Bronze for top 5
    return '#00d4ff'; // Default cyan
  };

  const computeEvenScore = (index, total) => {
    if (total <= 1) return 10.0;
    const raw = 10 - (9 * index) / (total - 1);
    return Math.round(raw * 10) / 10;
  };

  const getRankingIcon = (position) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return `#${position + 1}`;
  };

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  if (followingRankings.length === 0) {
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
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: 'rgba(0, 212, 255, 0.3)', mb: 3 }} />
            <Typography variant="h3" gutterBottom sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
            }}>
              No Rankings from Following
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              mb: 4,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              {user?.following?.length === 0 
                ? "You're not following anyone yet. Discover users and follow them to see their rankings here!"
                : "The users you follow haven't rated any movies yet."}
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/discover"
              size="large"
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                px: { xs: 4, sm: 6 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
              }}
            >
              Discover Users
            </Button>
          </Box>
        </Container>
      </Box>
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
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
          <Typography variant="h2" gutterBottom sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            Following Rankings
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Movie rankings from users you follow
          </Typography>
        </Box>

        {/* Rankings grouped by user */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {followingRankings.map((userRankings) => (
            <Accordion
              key={userRankings.userId}
              defaultExpanded={followingRankings.length <= 3}
              sx={{
                background: 'rgba(26, 26, 26, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: 3,
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: '16px 0',
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#00d4ff' }} />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    py: 2
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                  <Avatar
                    src={userRankings.profilePicture}
                    sx={{
                      width: { xs: 40, sm: 50 },
                      height: { xs: 40, sm: 50 },
                      backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    }}
                  >
                    {userRankings.username?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h6" sx={{ 
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}>
                        {userRankings.username}'s Rankings
                      </Typography>
                      <Chip
                        label={`${userRankings.followersCount || 0} followers`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          color: '#00d4ff',
                          border: '1px solid rgba(0, 212, 255, 0.3)',
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          height: { xs: 20, sm: 24 }
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      mt: 0.5
                    }}>
                      {userRankings.ratings.length} movie{userRankings.ratings.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Button
                    component={Link}
                    to={`/profile/${userRankings.userId}`}
                    variant="outlined"
                    size="small"
                    sx={{
                      ml: 'auto',
                      borderColor: '#00d4ff',
                      color: '#00d4ff',
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      '&:hover': {
                        borderColor: '#66e0ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      },
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Profile
                  </Button>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {/* Full Rankings List */}
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: '#ffffff', 
                      mb: 2,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      Complete Rankings
                    </Typography>
                    <Card sx={{
                      background: 'rgba(10, 10, 10, 0.6)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: 3,
                    }}>
                      <List sx={{ p: 0 }}>
                        {userRankings.ratings.map((ranking, index) => (
                          <React.Fragment key={ranking.id}>
                            <ListItem sx={{ 
                              py: { xs: 1.5, sm: 2 },
                              px: { xs: 2, sm: 3 },
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
                                      width: { xs: 50, sm: 70 }, 
                                      height: { xs: 75, sm: 105 },
                                      borderRadius: 2,
                                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                                    }}
                                  >
                                    🎬
                                  </Avatar>
                                  <Box sx={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    backgroundColor: getRankingColor(index),
                                    color: index < 3 ? '#000' : '#fff',
                                    borderRadius: '50%',
                                    width: { xs: 20, sm: 26 },
                                    height: { xs: 20, sm: 26 },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
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
                                    mb: 0.5,
                                    fontSize: { xs: '0.9rem', sm: '1.1rem' }
                                  }}>
                                    {ranking.title}
                                  </Typography>
                                }
                                secondary={
                                  <Box>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: { xs: 1, sm: 1.5 },
                                      flexWrap: 'wrap'
                                    }}>
                                      <Rating
                                        precision={0.1}
                                        value={computeEvenScore(index, userRankings.ratings.length) / 2}
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
                                        fontSize: { xs: '0.7rem', sm: '0.8rem' }
                                      }}>
                                        {computeEvenScore(index, userRankings.ratings.length).toFixed(1)}/10
                                      </Typography>
                                      <Chip
                                        label={`#${index + 1}`}
                                        size="small"
                                        sx={{
                                          backgroundColor: getRankingColor(index),
                                          color: index < 3 ? '#000' : '#fff',
                                          fontWeight: 'bold',
                                          fontSize: { xs: '0.65rem', sm: '0.7rem' }
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                }
                              />
                              <Box sx={{ 
                                display: 'flex', 
                                gap: 1,
                                mt: { xs: 1.5, sm: 0 },
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
                                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
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
                            {index < userRankings.ratings.length - 1 && (
                              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                            )}
                          </React.Fragment>
                        ))}
                      </List>
                    </Card>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default FollowingRankings;

