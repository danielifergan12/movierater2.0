import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Rating,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Movie as MovieIcon
} from '@mui/icons-material';
import { publicApi } from '../config/axios';

const SharedRankings = () => {
  const { shareCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sharedData, setSharedData] = useState(null);

  useEffect(() => {
    const fetchSharedRankings = async () => {
      try {
        setLoading(true);
        // Use publicApi to avoid sending auth token for public share links
        const response = await publicApi.get(`/api/share/${shareCode}`);
        setSharedData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching shared rankings:', err);
        // Handle 401/403 errors gracefully - they shouldn't happen for public share links
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('This share link is invalid or has expired.');
        } else {
          setError(err.response?.data?.message || 'Failed to load shared rankings');
        }
        setSharedData(null);
      } finally {
        setLoading(false);
      }
    };

    if (shareCode) {
      fetchSharedRankings();
    }
  }, [shareCode]);

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

  if (error || !sharedData) {
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
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
          <MovieIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: '#ff6b35', mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            Share Link Not Found
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'The share link you are looking for does not exist or has been removed.'}
          </Alert>
          <Button
            variant="contained"
            component={Link}
            to="/"
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              px: { xs: 4, sm: 6 },
              py: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
            }}
          >
            Go to Home
          </Button>
        </Container>
      </Box>
    );
  }

  const ratings = sharedData.ratings || [];

  if (ratings.length === 0) {
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
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
          <MovieIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: '#00d4ff', mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            {sharedData.username}'s Rankings
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            This user hasn't rated any movies yet.
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/"
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              px: { xs: 4, sm: 6 },
              py: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
            }}
          >
            Go to Home
          </Button>
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
            {sharedData.username}'s Movie Rankings
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Personal ranking of {ratings.length} rated movies
          </Typography>
        </Box>

        {/* Full Rankings List */}
        <Box>
          <Typography variant="h4" gutterBottom sx={{ 
            color: '#ffffff', 
            mb: { xs: 3, sm: 4 },
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
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
              {ratings.map((ranking, index) => (
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
                              value={computeEvenScore(index, ratings.length) / 2}
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
                              {computeEvenScore(index, ratings.length).toFixed(1)}/10
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
                  {index < ratings.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default SharedRankings;

