import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [copied, setCopied] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublic, setEditPublic] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [flashIds, setFlashIds] = useState(() => new Set());
  const flashTimers = useRef({});
  const openedAddRef = useRef(false);

  useEffect(() => {
    fetchList();
  }, [listId]);

  useEffect(() => {
    if (!list || openedAddRef.current) return;
    const isOwner = isAuthenticated && user && list.user?._id === user._id;
    if (isOwner && searchParams.get('add') === '1') {
      openedAddRef.current = true;
      setAddOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('add');
      setSearchParams(next, { replace: true });
    }
  }, [list, isAuthenticated, user, searchParams, setSearchParams]);

  useEffect(() => () => {
    Object.values(flashTimers.current).forEach(clearTimeout);
  }, []);

  const fetchList = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await api.get(`/api/lists/${listId}`);
      setList(response.data);
    } catch (error) {
      console.error('Error fetching list:', error);
      const status = error.response?.status;
      if (status === 404) {
        navigate('/lists');
        return;
      }
      setList(null);
      setFetchError(
        status === 403
          ? 'This list is private.'
          : (error.response?.data?.message || 'Could not load this list.')
      );
    } finally {
      setLoading(false);
    }
  };

  const flashMovie = (id) => {
    const key = String(id);
    setFlashIds((prev) => new Set([...prev, key]));
    if (flashTimers.current[key]) clearTimeout(flashTimers.current[key]);
    flashTimers.current[key] = setTimeout(() => {
      setFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 1200);
  };

  const handleDeleteMovie = async (movieId) => {
    if (!isAuthenticated || !user || String(list.user?._id) !== String(user._id)) return;

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
    flashMovie(payload.movieId);
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
    return (
      <Box sx={{ ...socialPageShellSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography sx={{ ...socialTitleSx, fontSize: '1.6rem', mb: 1 }}>
            {fetchError || 'List not found'}
          </Typography>
          <Typography sx={{ ...socialSubtitleSx, mb: 2.5 }}>
            Head back to your lists and try again.
          </Typography>
          <Button
            onClick={() => navigate('/lists')}
            startIcon={<ArrowBackIcon />}
            sx={socialAccentBtn}
          >
            Back to lists
          </Button>
        </Container>
      </Box>
    );
  }

  const isOwner = isAuthenticated && user && String(list.user?._id) === String(user._id);
  const movies = list.movies || [];

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
        maxWidth="md"
        sx={{
          py: { xs: 1.5, sm: 2.5 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={() => navigate('/lists')}
            sx={{
              color: 'var(--rl-cream)',
              '&:hover': { color: 'var(--rl-accent)', backgroundColor: 'rgba(244,239,230,0.06)' },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                ...socialTitleSx,
                fontSize: { xs: '1.55rem', sm: '1.9rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {list.name}
            </Typography>
          </Box>
          {isOwner && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
              <IconButton size="small" onClick={openEdit} title="Edit list" sx={{ color: 'var(--rl-muted)', '&:hover': { color: 'var(--rl-accent)' } }}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleShare} title="Share" sx={{ color: 'var(--rl-muted)', '&:hover': { color: 'var(--rl-accent)' } }}>
                <ShareIcon fontSize="small" />
              </IconButton>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={() => setAddOpen(true)}
                sx={{ ...socialAccentBtn, py: 0.55, px: 1.5, fontSize: '0.78rem', ml: 0.5 }}
              >
                Add
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25, flexShrink: 0, flexWrap: 'wrap', pl: { xs: 5, sm: 5.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Avatar src={list.user?.profilePicture} sx={{ width: 22, height: 22, fontSize: '0.7rem' }}>
              {list.user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.78rem' }}>{list.user?.username}</Typography>
          </Box>
          <Chip
            label={list.isPublic ? 'Public' : 'Private'}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 600,
              backgroundColor: list.isPublic ? 'rgba(212, 160, 23, 0.18)' : 'rgba(244,239,230,0.08)',
              color: list.isPublic ? 'var(--rl-accent)' : 'var(--rl-muted)',
            }}
          />
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.78rem' }}>
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
          </Typography>
          {copied && (
            <Typography sx={{ color: 'var(--rl-accent)', fontSize: '0.75rem' }}>Link copied</Typography>
          )}
        </Box>

        {list.description && (
          <Typography sx={{ ...socialSubtitleSx, mb: 1.25, pl: { xs: 5, sm: 5.5 }, mt: 0, fontSize: '0.82rem' }}>
            {list.description}
          </Typography>
        )}

        <CinemaScreen scrollable maxWidth={820} sx={{ flex: 1, minHeight: 0, px: 0, pb: 0 }}>
          {movies.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
              {movies.map((movie, index) => {
                const id = movie.movieId || movie.tmdbId;
                const flashing = flashIds.has(String(id));
                return (
                  <Box
                    key={id || index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      px: 0.75,
                      py: 0.55,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: flashing ? 'rgba(212,160,23,0.45)' : 'transparent',
                      backgroundColor: flashing ? 'rgba(212,160,23,0.12)' : 'transparent',
                      transition: 'background-color 0.35s ease, border-color 0.35s ease',
                      animation: flashing ? 'rowFlash 1.1s ease' : undefined,
                      '@keyframes rowFlash': {
                        '0%': { backgroundColor: 'rgba(212,160,23,0.28)' },
                        '100%': { backgroundColor: 'rgba(212,160,23,0.08)' },
                      },
                      '&:hover': {
                        backgroundColor: flashing ? 'rgba(212,160,23,0.14)' : 'rgba(244,239,230,0.04)',
                        borderColor: flashing ? 'rgba(212,160,23,0.45)' : 'rgba(244,239,230,0.08)',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        width: 26,
                        flexShrink: 0,
                        textAlign: 'right',
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: '1rem',
                        letterSpacing: '0.02em',
                        color: 'var(--rl-accent)',
                        lineHeight: 1,
                      }}
                    >
                      {index + 1}
                    </Typography>

                    <Box
                      component={Link}
                      to={`/movie/${id}`}
                      sx={{
                        width: 34,
                        height: 51,
                        flexShrink: 0,
                        borderRadius: '3px',
                        overflow: 'hidden',
                        border: '1px solid rgba(244,239,230,0.12)',
                        display: 'block',
                      }}
                    >
                      <Box
                        component="img"
                        src={
                          movie.posterPath
                            ? `https://image.tmdb.org/t/p/w92${movie.posterPath}`
                            : '/placeholder-movie.jpg'
                        }
                        alt=""
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        component={Link}
                        to={`/movie/${id}`}
                        sx={{
                          color: 'var(--rl-cream)',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.86rem',
                          lineHeight: 1.3,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          '&:hover': { color: 'var(--rl-accent)' },
                        }}
                      >
                        {movie.title}
                      </Typography>
                      <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.7rem', mt: 0.1 }}>
                        {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '—'}
                        {movie.note ? ` · ${movie.note}` : ''}
                      </Typography>
                    </Box>

                    {isOwner && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMovie(id)}
                        sx={{
                          color: 'rgba(244,239,230,0.3)',
                          opacity: { xs: 1, sm: 0.55 },
                          transition: 'opacity 0.15s ease, color 0.15s ease',
                          '.MuiBox-root:hover &': { opacity: 1 },
                          '&:hover': { color: '#e07050', backgroundColor: 'rgba(224,112,80,0.08)' },
                        }}
                        aria-label={`Remove ${movie.title}`}
                      >
                        <DeleteIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
              <Typography
                sx={{
                  color: 'var(--rl-cream)',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '1.35rem',
                  letterSpacing: '0.04em',
                  mb: 0.75,
                }}
              >
                Empty list
              </Typography>
              <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem', mb: isOwner ? 2 : 0 }}>
                {isOwner
                  ? 'Add films — if you’ve ranked them, they’ll slot into place automatically.'
                  : 'No movies yet.'}
              </Typography>
              {isOwner && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddOpen(true)}
                  sx={{ ...socialAccentBtn, py: 0.7 }}
                >
                  Add movies
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: dialogPaperSx }}>
        <DialogTitle sx={{ color: 'var(--rl-cream)', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em', fontSize: '1.4rem' }}>
          Edit list
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
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
            size="small"
            multiline
            rows={2}
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            inputProps={{ maxLength: 500 }}
            sx={{
              mb: 1.5,
              ...socialFieldSx,
              '& .MuiInputLabel-root': { color: 'var(--rl-muted)' },
              '& .MuiInputLabel-root.Mui-focused': { color: 'var(--rl-accent)' },
            }}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
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
            label={<Typography sx={{ fontSize: '0.85rem' }}>Public list</Typography>}
            sx={{ color: 'var(--rl-cream)', ml: 0 }}
          />
          {editError && (
            <Typography sx={{ color: '#e07050', mt: 1.5, fontSize: '0.85rem' }}>{editError}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ ...socialGhostBtn, border: 'none', py: 0.5 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={editSaving} sx={{ ...socialAccentBtn, py: 0.6 }}>
            {editSaving ? <CircularProgress size={18} sx={{ color: 'var(--rl-ink)' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
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
