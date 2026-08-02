import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import {
  socialPageShellSx,
  socialTitleSx,
  socialAccentBtn,
  socialGhostBtn,
  socialFieldSx,
} from '../components/SocialPageShell';

const dialogPaperSx = {
  backgroundColor: 'rgba(12, 11, 10, 0.97)',
  border: '1px solid rgba(244, 239, 230, 0.12)',
  borderRadius: 1.5,
  boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
};

const coverUrl = (list) => {
  if (list.coverImage) return `https://image.tmdb.org/t/p/w185${list.coverImage}`;
  if (list.movies?.[0]?.posterPath) return `https://image.tmdb.org/t/p/w185${list.movies[0].posterPath}`;
  return null;
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

  const handleShare = async (list, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
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
      <Container maxWidth="md" sx={{ py: { xs: 2.5, sm: 3.5 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Typography sx={{ ...socialTitleSx, fontSize: { xs: '1.75rem', sm: '2.2rem' } }}>
            {activeTab === 0 ? 'My Lists' : 'Public Lists'}
          </Typography>
          {activeTab === 0 && isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/lists/create"
              sx={{ ...socialAccentBtn, py: 0.7 }}
            >
              New list
            </Button>
          )}
        </Box>

        <Box sx={{ borderBottom: '1px solid rgba(244,239,230,0.12)', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                color: 'var(--rl-muted)',
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 36,
                fontSize: '0.85rem',
                '&.Mui-selected': { color: 'var(--rl-cream)' },
              },
              '& .MuiTabs-indicator': { backgroundColor: 'var(--rl-accent)' },
            }}
          >
            <Tab label="Mine" disabled={!isAuthenticated} />
            <Tab label="Public" />
          </Tabs>
        </Box>

        {displayed.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.95rem', mb: 2 }}>
              {activeTab === 0 ? 'No ranking lists yet — start a themed one.' : 'No public lists yet.'}
            </Typography>
            {activeTab === 0 && isAuthenticated && (
              <Button variant="contained" component={Link} to="/lists/create" sx={socialAccentBtn}>
                New list
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {displayed.map((list, i) => {
              const listUserId = typeof list.user === 'object' ? list.user?._id : list.user;
              const isOwner = isAuthenticated && user && listUserId === user._id;
              const cover = coverUrl(list);
              const count = list.movies?.length || 0;

              return (
                <Box
                  key={list._id}
                  component={Link}
                  to={`/list/${list._id}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.25,
                    py: 1,
                    textDecoration: 'none',
                    borderRadius: 1,
                    border: '1px solid rgba(244,239,230,0.1)',
                    bgcolor: 'rgba(244,239,230,0.03)',
                    animation: 'listTileIn 0.4s ease both',
                    animationDelay: `${Math.min(i, 12) * 0.035}s`,
                    '@keyframes listTileIn': {
                      from: { opacity: 0, transform: 'translateY(8px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                    transition: 'border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease',
                    '&:hover': {
                      borderColor: 'rgba(212, 160, 23, 0.4)',
                      bgcolor: 'rgba(244,239,230,0.05)',
                      transform: 'translateY(-1px)',
                      '& .list-actions': { opacity: 1 },
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 84,
                      flexShrink: 0,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid rgba(244,239,230,0.12)',
                      bgcolor: 'rgba(244,239,230,0.06)',
                    }}
                  >
                    {cover ? (
                      <Box component="img" src={cover} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.65rem' }}>Empty</Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: 'var(--rl-cream)',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {list.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
                      <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.75rem' }}>
                        {count} {count === 1 ? 'movie' : 'movies'}
                      </Typography>
                      <Chip
                        label={list.isPublic ? 'Public' : 'Private'}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          backgroundColor: list.isPublic ? 'rgba(212, 160, 23, 0.18)' : 'rgba(244,239,230,0.08)',
                          color: list.isPublic ? 'var(--rl-accent)' : 'var(--rl-muted)',
                        }}
                      />
                      {activeTab === 1 && list.user?.username && (
                        <Typography sx={{ color: 'rgba(244,239,230,0.45)', fontSize: '0.72rem' }}>
                          by {list.user.username}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {isOwner && (
                    <Box
                      className="list-actions"
                      sx={{
                        display: 'flex',
                        gap: 0.25,
                        flexShrink: 0,
                        opacity: { xs: 1, sm: 0 },
                        transition: 'opacity 0.15s ease',
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleShare(list, e)}
                        sx={{ color: 'var(--rl-muted)', '&:hover': { color: 'var(--rl-accent)' } }}
                      >
                        <ShareIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteDialog({ open: true, list });
                        }}
                        sx={{ color: 'var(--rl-muted)', '&:hover': { color: '#e07050' } }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, list: null })} PaperProps={{ sx: dialogPaperSx }}>
          <DialogTitle sx={{ color: 'var(--rl-cream)', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em' }}>
            Delete list?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'var(--rl-muted)' }}>
              Delete &ldquo;{deleteDialog.list?.name}&rdquo;? This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialog({ open: false, list: null })} sx={{ ...socialGhostBtn, border: 'none' }}>
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="contained" sx={{ ...socialAccentBtn, bgcolor: '#c45a3a', '&:hover': { bgcolor: '#d46848' } }}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={shareDialog.open} onClose={() => setShareDialog({ open: false, list: null, shareUrl: '' })} PaperProps={{ sx: dialogPaperSx }}>
          <DialogTitle sx={{ color: 'var(--rl-cream)', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.04em' }}>
            Share list
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              size="small"
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
            <Button onClick={() => setShareDialog({ open: false, list: null, shareUrl: '' })} sx={{ ...socialGhostBtn, border: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Lists;
