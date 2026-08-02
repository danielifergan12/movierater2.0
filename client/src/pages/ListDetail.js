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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import CinemaScreen from '../components/CinemaScreen';
import AddMoviesToListDialog from '../components/AddMoviesToListDialog';
import {
  socialPageShellSx,
  socialTitleSx,
  socialSubtitleSx,
  socialGhostBtn,
  socialAccentBtn,
  socialFieldSx,
} from '../components/SocialPageShell';

const dialogPaperSx = {
  backgroundColor: 'rgba(12, 11, 10, 0.97)',
  border: '1px solid rgba(244, 239, 230, 0.12)',
  borderRadius: 1.5,
  boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
};

const ListDetail = () => {
  const { listId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublic, setEditPublic] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

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

  const openEdit = () => {
    setEditName(list.name || '');
    setEditDescription(list.description || '');
    setEditPublic(list.isPublic !== false);
    setEditError('');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setEditError('List name is required');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      const response = await api.put(`/api/lists/${listId}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        isPublic: editPublic,
      });
      setList((prev) => ({ ...prev, ...response.data, user: prev.user }));
      setEditOpen(false);
      setToast({ open: true, message: 'List updated', severity: 'success' });
    } catch (error) {
      console.error('Error updating list:', error);
      setEditError(error.response?.data?.message || 'Could not update list');
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddMoviePayload = async (payload) => {
    const response = await api.post(`/api/lists/${listId}/movies`, payload);
    setList((prev) => ({
      ...prev,
      ...response.data,
      user: prev.user,
    }));
    setToast({ open: true, message: `Added “${payload.title}”`, severity: 'success' });
    return response.data;
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5, gap: 1.5, flexShrink: 0 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
              <IconButton
                onClick={openEdit}
                title="Edit list"
                sx={{
                  color: 'var(--rl-cream)',
                  '&:hover': { color: 'var(--rl-accent)', backgroundColor: 'rgba(244,239,230,0.06)' },
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={handleShare}
                title="Share list"
                sx={{
                  color: 'var(--rl-cream)',
                  '&:hover': { color: 'var(--rl-accent)', backgroundColor: 'rgba(244,239,230,0.06)' },
                }}
              >
                <ShareIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        {isOwner && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexShrink: 0, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={socialAccentBtn}
            >
              Add movies to your list
            </Button>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={openEdit} sx={socialGhostBtn}>
              Edit list
            </Button>
          </Box>
        )}

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
              <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.9rem', mb: isOwner ? 2.5 : 0 }}>
                {isOwner
                  ? 'Add movies to your list to get started.'
                  : "This list doesn't have any movies yet."}
              </Typography>
              {isOwner && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddOpen(true)}
                  sx={socialAccentBtn}
                >
                  Add movies to your list
                </Button>
              )}
            </Box>
          )}
        </CinemaScreen>
      </Container>

      <AddMoviesToListDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        list={list}
        onAdded={handleAddMoviePayload}
      />

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: dialogPaperSx }}>
        <DialogTitle sx={{ color: 'var(--rl-cream)', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em' }}>
          Edit list
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="List name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            inputProps={{ maxLength: 100 }}
            sx={{
              mt: 1,
              mb: 2,
              ...socialFieldSx,
              '& .MuiInputLabel-root': { color: 'var(--rl-muted)' },
              '& .MuiInputLabel-root.Mui-focused': { color: 'var(--rl-accent)' },
            }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            inputProps={{ maxLength: 500 }}
            sx={{
              mb: 2,
              ...socialFieldSx,
              '& .MuiInputLabel-root': { color: 'var(--rl-muted)' },
              '& .MuiInputLabel-root.Mui-focused': { color: 'var(--rl-accent)' },
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editPublic}
                onChange={(e) => setEditPublic(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--rl-accent)' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'var(--rl-accent)',
                  },
                }}
              />
            }
            label="Public list"
            sx={{ color: 'var(--rl-cream)', ml: 0 }}
          />
          {editError && (
            <Typography sx={{ color: '#e07050', mt: 1.5, fontSize: '0.9rem' }}>{editError}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ ...socialGhostBtn, border: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={editSaving} sx={socialAccentBtn}>
            {editSaving ? <CircularProgress size={20} sx={{ color: 'var(--rl-ink)' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ bgcolor: toast.severity === 'success' ? 'rgba(212,160,23,0.15)' : undefined }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ListDetail;
