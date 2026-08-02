import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import CinemaScreen from '../components/CinemaScreen';
import {
  socialPageShellSx,
  socialTitleSx,
  socialSubtitleSx,
  socialGhostBtn,
} from '../components/SocialPageShell';

const ListDetail = () => {
  const { listId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
      setList((prev) => ({
        ...prev,
        movies: prev.movies.filter((m) => m.movieId !== movieId && m.tmdbId?.toString() !== movieId),
      }));
    } catch (error) {
      console.error('Error removing movie:', error);
    }
  };

  const handleShare = async () => {
    try {
      const response = await api.post(`/api/lists/${listId}/share`);
      const shareUrl = response.data.shareUrl || `${window.location.origin}/list/${response.data.shareCode}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error generating share code:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ ...socialPageShellSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'var(--rl-accent)' }} />
      </Box>
    );
  }

  if (!list) {
    return null;
  }

  const isOwner = isAuthenticated && user && list.user._id === user._id;

  return (
    <Box
      sx={{
        ...socialPageShellSx,
        minHeight: { xs: 'calc(100dvh - 64px)', sm: 'calc(100dvh - 72px)' },
        height: { xs: 'calc(100dvh - 64px)', sm: 'calc(100dvh - 72px)' },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 1.5, flexShrink: 0 }}>
          <IconButton
            onClick={() => navigate('/lists')}
            sx={{
              color: 'var(--rl-cream)',
              mt: 0.5,
              '&:hover': { color: 'var(--rl-accent)', backgroundColor: 'rgba(244,239,230,0.06)' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ ...socialTitleSx, fontSize: { xs: '1.85rem', sm: '2.4rem' } }}>
              {list.name}
            </Typography>
            {list.description && (
              <Typography sx={{ ...socialSubtitleSx, mt: 0.75, fontSize: '0.9rem' }}>
                {list.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={list.user?.profilePicture} sx={{ width: 28, height: 28, fontSize: '0.85rem' }}>
                  {list.user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem' }}>
                  {list.user?.username}
                </Typography>
              </Box>
              <Chip
                label={list.isPublic ? 'Public' : 'Private'}
                size="small"
                sx={{
                  backgroundColor: list.isPublic ? 'rgba(212, 160, 23, 0.2)' : 'rgba(244,239,230,0.08)',
                  color: list.isPublic ? 'var(--rl-accent)' : 'var(--rl-muted)',
                  fontWeight: 600,
                  height: 24,
                }}
              />
              <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem' }}>
                {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
              </Typography>
              {copied && (
                <Typography sx={{ color: 'var(--rl-accent)', fontSize: '0.8rem' }}>Link copied</Typography>
              )}
            </Box>
          </Box>
          {isOwner && (
            <IconButton
              onClick={handleShare}
              sx={{
                color: 'var(--rl-cream)',
                '&:hover': { color: 'var(--rl-accent)', backgroundColor: 'rgba(244,239,230,0.06)' },
              }}
            >
              <ShareIcon />
            </IconButton>
          )}
        </Box>

        <CinemaScreen scrollable maxWidth={1100} sx={{ flex: 1, minHeight: 0, px: 0, pb: 0 }}>
          {list.movies && list.movies.length > 0 ? (
            <Grid container spacing={1.5}>
              {list.movies.map((movie, index) => (
                <Grid item xs={6} sm={4} md={3} key={movie.movieId || movie.tmdbId || index}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid rgba(244,239,230,0.1)',
                      bgcolor: 'rgba(244,239,230,0.03)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'border-color 0.2s ease',
                      '&:hover': { borderColor: 'rgba(212, 160, 23, 0.4)' },
                    }}
                  >
                    <Box sx={{ position: 'relative', aspectRatio: '2 / 3' }}>
                      <Box
                        component={Link}
                        to={`/movie/${movie.movieId || movie.tmdbId}`}
                        sx={{ display: 'block', width: '100%', height: '100%' }}
                      >
                        <Box
                          component="img"
                          src={
                            movie.posterPath
                              ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                              : '/placeholder-movie.jpg'
                          }
                          alt={movie.title}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </Box>
                      {isOwner && (
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            backgroundColor: 'rgba(12, 11, 10, 0.75)',
                            color: 'var(--rl-muted)',
                            '&:hover': {
                              backgroundColor: 'rgba(12, 11, 10, 0.9)',
                              color: '#e07050',
                            },
                          }}
                          onClick={() => handleDeleteMovie(movie.movieId || movie.tmdbId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          backgroundColor: 'rgba(212, 160, 23, 0.9)',
                          color: '#0c0b0a',
                          fontWeight: 700,
                          height: 22,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <Box sx={{ p: 1.25, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        component={Link}
                        to={`/movie/${movie.movieId || movie.tmdbId}`}
                        sx={{
                          color: 'var(--rl-cream)',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          lineHeight: 1.3,
                          mb: 0.35,
                          '&:hover': { color: 'var(--rl-accent)' },
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {movie.title}
                      </Typography>
                      {movie.releaseDate && (
                        <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.75rem', mb: 0.75 }}>
                          {new Date(movie.releaseDate).getFullYear()}
                        </Typography>
                      )}
                      {movie.note && (
                        <Typography
                          sx={{
                            color: 'var(--rl-muted)',
                            fontStyle: 'italic',
                            fontSize: '0.75rem',
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          &ldquo;{movie.note}&rdquo;
                        </Typography>
                      )}
                      <Button
                        size="small"
                        component={Link}
                        to={`/movie/${movie.movieId || movie.tmdbId}`}
                        sx={{ ...socialGhostBtn, mt: 'auto', alignSelf: 'flex-start', px: 1.25, py: 0.35, fontSize: '0.75rem' }}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <Typography
                sx={{
                  color: 'var(--rl-cream)',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '1.5rem',
                  letterSpacing: '0.04em',
                  mb: 1,
                }}
              >
                This list is empty
              </Typography>
              <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.9rem' }}>
                {isOwner ? 'Start adding movies to your list.' : "This list doesn't have any movies yet."}
              </Typography>
            </Box>
          )}
        </CinemaScreen>
      </Container>
    </Box>
  );
};

export default ListDetail;
