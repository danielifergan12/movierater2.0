import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import {
  socialPageShellSx,
  socialTitleSx,
  socialSubtitleSx,
  socialAccentBtn,
  socialGhostBtn,
  socialCardSx,
  socialFieldSx,
} from '../components/SocialPageShell';

const CreateList = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('List name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/lists', {
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });
      navigate(`/list/${response.data._id}?add=1`);
    } catch (err) {
      console.error('Error creating list:', err);
      setError(err.response?.data?.message || 'Error creating list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={socialPageShellSx}>
      <Container maxWidth="xs" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Typography sx={{ ...socialTitleSx, fontSize: { xs: '1.75rem', sm: '2.1rem' }, mb: 0.35 }}>
          New list
        </Typography>
        <Typography sx={{ ...socialSubtitleSx, mb: 2.5 }}>
          Name it — then pick films right away.
        </Typography>

        <Box sx={{ ...socialCardSx, p: { xs: 2, sm: 2.5 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              size="small"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              inputProps={{ maxLength: 100 }}
              sx={{
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
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  size="small"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--rl-accent)' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'var(--rl-accent)',
                    },
                  }}
                />
              }
              label={<Typography sx={{ fontSize: '0.85rem' }}>Public</Typography>}
              sx={{ mb: 2, color: 'var(--rl-cream)', ml: 0 }}
            />

            {error && (
              <Typography sx={{ color: '#e07050', mb: 1.5, fontSize: '0.85rem' }}>{error}</Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={() => navigate('/lists')} sx={{ ...socialGhostBtn, py: 0.65 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ ...socialAccentBtn, flex: 1, py: 0.75 }}>
                {loading ? <CircularProgress size={20} sx={{ color: 'var(--rl-ink)' }} /> : 'Create & add movies'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CreateList;
