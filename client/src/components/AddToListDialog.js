import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  List as ListIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

const AddToListDialog = ({ open, onClose, movie }) => {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchLists();
      setShowCreateForm(false);
      setNewListName('');
      setError('');
    }
  }, [open]);

  const fetchLists = async () => {
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

  const handleAddToList = async (listId) => {
    if (!movie) return;

    try {
      await api.post(`/api/lists/${listId}/movies`, {
        movieId: movie.id || movie.tmdbId?.toString(),
        tmdbId: movie.tmdbId || movie.id,
        title: movie.title,
        posterPath: movie.posterPath || movie.posterUrl?.replace('https://image.tmdb.org/t/p/w500', ''),
        releaseDate: movie.releaseDate
      });
      onClose();
      // Could show success toast here
    } catch (error) {
      console.error('Error adding to list:', error);
      setError(error.response?.data?.message || 'Error adding movie to list');
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) {
      setError('List name is required');
      return;
    }

    if (!movie) return;

    setCreating(true);
    setError('');

    try {
      // Create the list
      const createResponse = await api.post('/api/lists', {
        name: newListName.trim(),
        isPublic: true
      });

      // Add movie to the new list
      await api.post(`/api/lists/${createResponse.data._id}/movies`, {
        movieId: movie.id || movie.tmdbId?.toString(),
        tmdbId: movie.tmdbId || movie.id,
        title: movie.title,
        posterPath: movie.posterPath || movie.posterUrl?.replace('https://image.tmdb.org/t/p/w500', ''),
        releaseDate: movie.releaseDate
      });

      onClose();
      navigate(`/list/${createResponse.data._id}`);
    } catch (error) {
      console.error('Error creating list:', error);
      setError(error.response?.data?.message || 'Error creating list');
    } finally {
      setCreating(false);
    }
  };

  const checkMovieInList = (list) => {
    if (!movie || !list.movies) return false;
    const movieId = movie.id || movie.tmdbId?.toString();
    return list.movies.some(m => 
      m.movieId === movieId || m.tmdbId?.toString() === movieId
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
        Add to List
      </DialogTitle>
      <DialogContent>
        {movie && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              component="img"
              src={movie.posterUrl || (movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg')}
              alt={movie.title}
              sx={{
                width: 60,
                height: 90,
                objectFit: 'cover',
                borderRadius: 1,
              }}
            />
            <Typography variant="h6" sx={{ color: '#ffffff' }}>
              {movie.title}
            </Typography>
          </Box>
        )}

        {error && (
          <Typography variant="body2" sx={{ color: '#ff6b35', mb: 2 }}>
            {error}
          </Typography>
        )}

        {!showCreateForm ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                Your Lists
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setShowCreateForm(true)}
                sx={{ color: '#00d4ff' }}
                size="small"
              >
                Create New
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : lists.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                  You don't have any lists yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCreateForm(true)}
                  sx={{
                    background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                  }}
                >
                  Create Your First List
                </Button>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {lists.map((list) => {
                  const alreadyInList = checkMovieInList(list);
                  return (
                    <ListItem key={list._id} disablePadding>
                      <ListItemButton
                        onClick={() => !alreadyInList && handleAddToList(list._id)}
                        disabled={alreadyInList}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          },
                          '&.Mui-disabled': {
                            opacity: 0.5,
                          }
                        }}
                      >
                        <ListItemIcon>
                          {alreadyInList ? (
                            <CheckIcon sx={{ color: '#00d4ff' }} />
                          ) : (
                            <ListIcon sx={{ color: '#00d4ff' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={list.name}
                          secondary={
                            alreadyInList
                              ? 'Already in this list'
                              : `${list.movies?.length || 0} movies`
                          }
                          primaryTypographyProps={{
                            sx: { color: '#ffffff' }
                          }}
                          secondaryTypographyProps={{
                            sx: { color: 'rgba(255, 255, 255, 0.6)' }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </>
        ) : (
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
              Create New List
            </Typography>
            <TextField
              fullWidth
              label="List Name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 212, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00d4ff',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#00d4ff',
                },
              }}
              inputProps={{ maxLength: 100 }}
            />
            <Button
              onClick={() => setShowCreateForm(false)}
              sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateAndAdd}
              disabled={creating || !newListName.trim()}
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              }}
            >
              {creating ? <CircularProgress size={24} /> : 'Create & Add'}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddToListDialog;

