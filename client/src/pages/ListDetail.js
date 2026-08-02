import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

const ListDetail = () => {
  const { listId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchList();
  }, [listId]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/lists/${listId}`);
      setList(response.data);
    } catch (error) {
      console.error('Error fetching list:', error);
      if (error.response?.status === 404) {
        navigate('/lists');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!isAuthenticated || !user || list.user._id !== user._id) return;

    try {
      await api.delete(`/api/lists/${listId}/movies/${movieId}`);
      setList(prev => ({
        ...prev,
        movies: prev.movies.filter(m => m.movieId !== movieId && m.tmdbId?.toString() !== movieId)
      }));
    } catch (error) {
      console.error('Error removing movie:', error);
    }
  };

  const handleShare = async () => {
    try {
      const response = await api.post(`/api/lists/${listId}/share`);
      const shareUrl = response.data.shareUrl || `${window.location.origin}/list/${response.data.shareCode}`;
      navigator.clipboard.writeText(shareUrl);
      // Could show a toast notification here
    } catch (error) {
      console.error('Error generating share code:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!list) {
    return null;
  }

  const isOwner = isAuthenticated && user && list.user._id === user._id;

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <IconButton
            onClick={() => navigate('/lists')}
            sx={{ color: '#00d4ff' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h2" sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
            }}>
              {list.name}
            </Typography>
            {list.description && (
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                {list.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={list.user?.profilePicture} sx={{ width: 32, height: 32 }}>
                  {list.user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {list.user?.username}
                </Typography>
              </Box>
              <Chip
                label={list.isPublic ? 'Public' : 'Private'}
                size="small"
                sx={{
                  backgroundColor: list.isPublic ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: list.isPublic ? '#00d4ff' : 'rgba(255, 255, 255, 0.7)',
                }}
              />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
              </Typography>
            </Box>
          </Box>
          {isOwner && (
            <Box>
              <IconButton
                onClick={() => handleShare()}
                sx={{ color: '#00d4ff' }}
              >
                <ShareIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        {list.movies && list.movies.length > 0 ? (
          <Grid container spacing={3}>
            {list.movies.map((movie, index) => (
              <Grid item xs={6} sm={4} md={3} key={movie.movieId || movie.tmdbId || index}>
                <Card sx={{
                  background: 'rgba(26, 26, 26, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 212, 255, 0.3)',
                  }
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="400"
                      image={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg'}
                      alt={movie.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    {isOwner && (
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: '#ff6b35',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          }
                        }}
                        onClick={() => handleDeleteMovie(movie.movieId || movie.tmdbId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: 'rgba(0, 212, 255, 0.8)',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="h6"
                      component={Link}
                      to={`/movie/${movie.movieId || movie.tmdbId}`}
                      sx={{
                        color: '#ffffff',
                        textDecoration: 'none',
                        mb: 1,
                        fontWeight: 600,
                        '&:hover': { color: '#00d4ff' },
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {movie.title}
                    </Typography>
                    {movie.releaseDate && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
                        {new Date(movie.releaseDate).getFullYear()}
                      </Typography>
                    )}
                    {movie.note && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', mb: 2 }}>
                        "{movie.note}"
                      </Typography>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to={`/movie/${movie.movieId || movie.tmdbId}`}
                      sx={{
                        mt: 'auto',
                        borderColor: '#00d4ff',
                        color: '#00d4ff',
                        '&:hover': {
                          borderColor: '#66e0ff',
                          backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        },
                      }}
                    >
                      View Movie
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card sx={{
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
            p: 4,
            textAlign: 'center'
          }}>
            <Typography variant="h5" sx={{ color: '#ffffff', mb: 2 }}>
              This list is empty
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {isOwner ? 'Start adding movies to your list!' : 'This list doesn\'t have any movies yet.'}
            </Typography>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default ListDetail;

