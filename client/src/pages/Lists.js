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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { Tabs, Tab } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

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
      setLists(prev => prev.filter(l => l._id !== deleteDialog.list._id));
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
    // Could show a toast notification here
  };

  if (activeTab === 0 && !isAuthenticated) {
    return null;
  }

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h2" sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            {activeTab === 0 ? 'My Lists' : 'Public Lists'}
          </Typography>
          {activeTab === 0 && isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/lists/create"
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              }}
            >
              Create List
            </Button>
          )}
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#00d4ff',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00d4ff',
            },
          }}>
            <Tab label="My Lists" disabled={!isAuthenticated} />
            <Tab label="Public Lists" />
          </Tabs>
        </Box>

        {(activeTab === 0 ? lists : publicLists).length === 0 ? (
          <Card sx={{
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
            p: 4,
            textAlign: 'center'
          }}>
            <Typography variant="h5" sx={{ color: '#ffffff', mb: 2 }}>
              {activeTab === 0 ? 'No Lists Yet' : 'No Public Lists'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              {activeTab === 0 
                ? 'Create your first list to organize your favorite movies!'
                : 'No public lists available yet. Be the first to create one!'}
            </Typography>
            {activeTab === 0 && isAuthenticated && (
              <Button
                variant="contained"
                component={Link}
                to="/lists/create"
                sx={{
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                }}
              >
                Create Your First List
              </Button>
            )}
          </Card>
        ) : (
          <Grid container spacing={3}>
            {(activeTab === 0 ? lists : publicLists).map((list) => {
              const listUserId = typeof list.user === 'object' ? list.user?._id : list.user;
              const isOwner = isAuthenticated && user && listUserId === user._id;
              return (
              <Grid item xs={12} sm={6} md={4} key={list._id}>
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
                      height="200"
                      image={list.coverImage ? `https://image.tmdb.org/t/p/w500${list.coverImage}` : 
                        (list.movies?.[0]?.posterPath ? `https://image.tmdb.org/t/p/w500${list.movies[0].posterPath}` : '/placeholder-movie.jpg')}
                      alt={list.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                      {isOwner && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleShare(list)}
                            sx={{
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: '#00d4ff',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
                            }}
                          >
                            <ShareIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, list })}
                            sx={{
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: '#ff6b35',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                    {list.isPublic ? (
                      <Chip
                        icon={<VisibilityIcon />}
                        label="Public"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: 'rgba(0, 212, 255, 0.8)',
                          color: '#ffffff',
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<VisibilityOffIcon />}
                        label="Private"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          color: '#ffffff',
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="h6"
                      component={Link}
                      to={`/list/${list._id}`}
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
                      {list.name}
                    </Typography>
                    {list.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          mb: 2,
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
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
                        </Typography>
                        {activeTab === 1 && list.user && (
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                            by {list.user.username}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        component={Link}
                        to={`/list/${list._id}`}
                        sx={{ color: '#00d4ff' }}
                      >
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, list: null })}
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
            Delete List?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Are you sure you want to delete "{deleteDialog.list?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, list: null })}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #ff6b35, #e64a19)',
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Share Dialog */}
        <Dialog
          open={shareDialog.open}
          onClose={() => setShareDialog({ open: false, list: null, shareUrl: '' })}
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
            Share List
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              value={shareDialog.shareUrl}
              readOnly
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <Button onClick={handleCopyLink} sx={{ color: '#00d4ff' }}>
                    Copy
                  </Button>
                )
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShareDialog({ open: false, list: null, shareUrl: '' })}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
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

