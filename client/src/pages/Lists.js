import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import {
  socialPageShellSx,
  socialTitleSx,
  socialAccentBtn,
  socialGhostBtn,
  socialCardSx,
  socialFieldSx,
} from '../components/SocialPageShell';

const dialogPaperSx = {
  backgroundColor: 'rgba(12, 11, 10, 0.97)',
  border: '1px solid rgba(244, 239, 230, 0.12)',
  borderRadius: 1.5,
  boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
};

const Lists = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [publicLists, setPublicLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, list: null });
  const [shareDialog, setShareDialog] = useState({ open: false, list: null, shareUrl: '' });

  useEffect(() => {
    if (activeTab === 0) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      fetchMyLists();
    } else {
      fetchPublicLists();
    }
  }, [isAuthenticated, navigate, activeTab]);

  const fetchMyLists = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get('/api/lists/my');
      setLists(response.data.lists || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicLists = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/lists/public');
      setPublicLists(response.data.lists || []);
    } catch (error) {
      console.error('Error fetching public lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDelete = async () => {
    if (!deleteDialog.list) return;

    try {
      await api.delete(`/api/lists/${deleteDialog.list._id}`);
      setLists((prev) => prev.filter((l) => l._id !== deleteDialog.list._id));
      setDeleteDialog({ open: false, list: null });
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleShare = async (list) => {
    try {
      const response = await api.post(`/api/lists/${list._id}/share`);
      const shareUrl = response.data.shareUrl || `${window.location.origin}/list/${response.data.shareCode}`;
      setShareDialog({ open: true, list, shareUrl });
    } catch (error) {
      console.error('Error generating share code:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareDialog.shareUrl);
  };

  if (activeTab === 0 && !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ ...socialPageShellSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'var(--rl-accent)' }} />
      </Box>
    );
  }

  const displayed = activeTab === 0 ? lists : publicLists;

  return (
    <Box sx={socialPageShellSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4.5 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography sx={socialTitleSx}>
            {activeTab === 0 ? 'My Lists' : 'Public Lists'}
          </Typography>
          {activeTab === 0 && isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/lists/create"
              sx={socialAccentBtn}
            >
              Create List
            </Button>
          )}
        </Box>

        <Box sx={{ borderBottom: '1px solid rgba(244,239,230,0.12)', mb: 3.5 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                color: 'var(--rl-muted)',
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 40,
                '&.Mui-selected': { color: 'var(--rl-cream)' },
              },
              '& .MuiTabs-indicator': { backgroundColor: 'var(--rl-accent)' },
            }}
          >
            <Tab label="My Lists" disabled={!isAuthenticated} />
            <Tab label="Public Lists" />
          </Tabs>
        </Box>

        {displayed.length === 0 ? (
          <Box sx={{ ...socialCardSx, p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography sx={{ color: 'var(--rl-cream)', fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.6rem', letterSpacing: '0.04em', mb: 1 }}>
              {activeTab === 0 ? 'No Lists Yet' : 'No Public Lists'}
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', mb: 3, fontSize: '0.95rem' }}>
              {activeTab === 0
                ? 'Create your first list to organize your favorite movies.'
                : 'No public lists available yet. Be the first to create one.'}
            </Typography>
            {activeTab === 0 && isAuthenticated && (
              <Button variant="contained" component={Link} to="/lists/create" sx={socialAccentBtn}>
                Create Your First List
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {displayed.map((list) => {
              const listUserId = typeof list.user === 'object' ? list.user?._id : list.user;
              const isOwner = isAuthenticated && user && listUserId === user._id;
              return (
                <Grid item xs={12} sm={6} md={4} key={list._id}>
                  <Card
                    sx={{
                      ...socialCardSx,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s ease, transform 0.2s ease',
                      '&:hover': {
                        borderColor: 'rgba(212, 160, 23, 0.35)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={
                          list.coverImage
                            ? `https://image.tmdb.org/t/p/w500${list.coverImage}`
                            : list.movies?.[0]?.posterPath
                              ? `https://image.tmdb.org/t/p/w500${list.movies[0].posterPath}`
                              : '/placeholder-movie.jpg'
                        }
                        alt={list.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.75 }}>
                        {isOwner && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleShare(list)}
                              sx={{
                                backgroundColor: 'rgba(12, 11, 10, 0.75)',
                                color: 'var(--rl-cream)',
                                '&:hover': { backgroundColor: 'rgba(12, 11, 10, 0.9)', color: 'var(--rl-accent)' },
                              }}
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteDialog({ open: true, list })}
                              sx={{
                                backgroundColor: 'rgba(12, 11, 10, 0.75)',
                                color: 'var(--rl-muted)',
                                '&:hover': { backgroundColor: 'rgba(12, 11, 10, 0.9)', color: '#e07050' },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                      <Chip
                        icon={list.isPublic ? <VisibilityIcon sx={{ fontSize: 14 }} /> : <VisibilityOffIcon sx={{ fontSize: 14 }} />}
                        label={list.isPublic ? 'Public' : 'Private'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: list.isPublic ? 'rgba(212, 160, 23, 0.85)' : 'rgba(12, 11, 10, 0.7)',
                          color: list.isPublic ? '#0c0b0a' : 'var(--rl-cream)',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 24,
                          '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                        }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                      <Typography
                        component={Link}
                        to={`/list/${list._id}`}
                        sx={{
                          color: 'var(--rl-cream)',
                          textDecoration: 'none',
                          mb: 0.75,
                          fontWeight: 600,
                          fontSize: '1.05rem',
                          '&:hover': { color: 'var(--rl-accent)' },
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {list.name}
                      </Typography>
                      {list.description && (
                        <Typography
                          sx={{
                            color: 'var(--rl-muted)',
                            mb: 1.5,
                            fontSize: '0.85rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {list.description}
                        </Typography>
                      )}
                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.8rem' }}>
                            {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
                          </Typography>
                          {activeTab === 1 && list.user && (
                            <Typography sx={{ color: 'rgba(244,239,230,0.45)', fontSize: '0.75rem', display: 'block' }}>
                              by {list.user.username}
                            </Typography>
                          )}
                        </Box>
                        <Button size="small" component={Link} to={`/list/${list._id}`} sx={{ ...socialGhostBtn, px: 1.5, py: 0.4 }}>
                          View
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, list: null })}
          PaperProps={{ sx: dialogPaperSx }}
        >
          <DialogTitle sx={{ color: 'var(--rl-cream)', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em' }}>
            Delete List?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'var(--rl-muted)' }}>
              Are you sure you want to delete &ldquo;{deleteDialog.list?.name}&rdquo;? This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialog({ open: false, list: null })} sx={{ ...socialGhostBtn, border: 'none' }}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              sx={{ ...socialAccentBtn, bgcolor: '#c45a3a', '&:hover': { bgcolor: '#d46848' } }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={shareDialog.open}
          onClose={() => setShareDialog({ open: false, list: null, shareUrl: '' })}
          PaperProps={{ sx: dialogPaperSx }}
        >
          <DialogTitle sx={{ color: 'var(--rl-cream)', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em' }}>
            Share List
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              value={shareDialog.shareUrl}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Button onClick={handleCopyLink} sx={{ color: 'var(--rl-accent)', textTransform: 'none', fontWeight: 700 }}>
                    Copy
                  </Button>
                ),
              }}
              sx={{ mt: 1, ...socialFieldSx }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setShareDialog({ open: false, list: null, shareUrl: '' })}
              sx={{ ...socialGhostBtn, border: 'none' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Lists;
