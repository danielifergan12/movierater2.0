import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Movie as MovieIcon
} from '@mui/icons-material';
import { useRatings } from '../hooks/useRatings';

const MyRankings = () => {
  const { rawRatings, setRatingsArray } = useRatings();
  const location = useLocation();
  const navigate = useNavigate();
  const [snack, setSnack] = useState({ open: Boolean(location.state?.message), message: location.state?.message || '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, movieId: null });

  useEffect(() => {
    if (location.state?.message) {
      // clear nav state so it doesn't persist
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleDeleteMovie = (movieId) => {
    setDeleteDialog({ open: true, movieId });
  };

  const confirmDelete = () => {
    const updatedRankings = rawRatings.filter(ranking => ranking.id !== deleteDialog.movieId);
    setRatingsArray(updatedRankings);
    setDeleteDialog({ open: false, movieId: null });
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

  if (rawRatings.length === 0) {
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
            No Movies Rated Yet
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Start rating movies to build your personal ranking list!
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
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: 300, sm: 'none' }
            }}
          >
            Start Rating Movies
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
        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ open: false, message: '' })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnack({ open: false, message: '' })} severity="success" sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
          <Typography variant="h2" gutterBottom sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            My Movie Rankings
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Your personal ranking of {rawRatings.length} rated movies
          </Typography>
        </Box>

        {/* Top 3 Movies */}
        {rawRatings.length >= 3 && (
          <Box sx={{ mb: { xs: 4, sm: 6 } }}>
            <Typography variant="h4" gutterBottom sx={{ 
              color: '#ffffff', 
              mb: { xs: 3, sm: 4 },
              textAlign: 'center',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              🏆 Top 3 Movies
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {rawRatings.slice(0, 3).map((ranking, index) => (
                <Grid item xs={12} sm={6} md={4} key={ranking.id}>
                  <Card sx={{
                    background: 'rgba(26, 26, 26, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-8px)' },
                      boxShadow: { xs: 'none', sm: '0 20px 40px rgba(0, 212, 255, 0.3)' },
                    }
                  }}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height={{ xs: 300, sm: 350, md: 400 }}
                        image={ranking.posterUrl || '/placeholder-movie.jpg'}
                        alt={ranking.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        top: { xs: 8, sm: 16 },
                        left: { xs: 8, sm: 16 },
                        backgroundColor: getRankingColor(index),
                        color: index === 0 ? '#000' : '#fff',
                        borderRadius: '50%',
                        width: { xs: 40, sm: 50 },
                        height: { xs: 40, sm: 50 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                      }}>
                        {getRankingIcon(index)}
                      </Box>
                    </Box>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography variant="h6" sx={{ 
                        color: '#ffffff', 
                        mb: 1,
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}>
                        {ranking.title}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        mb: 2 
                      }}>
                        
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Rating
                          precision={0.1}
                          value={computeEvenScore(index, rawRatings.length) / 2}
                          readOnly
                          size="small"
                          sx={{
                            '& .MuiRating-iconFilled': {
                              color: '#00d4ff',
                            },
                          }}
                        />
                        <Typography variant="body2" sx={{ 
                          ml: 1, 
                          color: '#00d4ff',
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          {computeEvenScore(index, rawRatings.length).toFixed(1)}/10
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        component={Link}
                        to={`/movie/${ranking.id}`}
                        fullWidth
                        sx={{
                          borderColor: '#00d4ff',
                          color: '#00d4ff',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          py: { xs: 0.75, sm: 1 },
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
              ))}
            </Grid>
          </Box>
        )}

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
              {rawRatings.map((ranking, index) => (
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
                              value={computeEvenScore(index, rawRatings.length) / 2}
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
                              {computeEvenScore(index, rawRatings.length).toFixed(1)}/10
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
                      <IconButton
                        onClick={() => handleDeleteMovie(ranking.id)}
                        sx={{ color: '#ff6b35' }}
                        size="small"
                      >
                        <DeleteIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < rawRatings.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, movieId: null })}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          Remove from Rankings?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Are you sure you want to remove this movie from your rankings? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, movieId: null })}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #ff6b35, #e64a19)',
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyRankings;

