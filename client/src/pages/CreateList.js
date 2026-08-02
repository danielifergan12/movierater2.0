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
      navigate(`/list/${response.data._id}`);
    } catch (err) {
      console.error('Error creating list:', err);
      setError(err.response?.data?.message || 'Error creating list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={socialPageShellSx}>
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Typography sx={{ ...socialTitleSx, mb: 0.5 }}>Create New List</Typography>
        <Typography sx={{ ...socialSubtitleSx, mb: 3.5 }}>
          Give it a name — then add films from anywhere in ReelList.
        </Typography>

        <Box sx={{ ...socialCardSx, p: { xs: 2.5, sm: 3.5 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="List Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              inputProps={{ maxLength: 100 }}
              sx={{
                mb: 2.5,
                ...socialFieldSx,
                '& .MuiInputLabel-root': { color: 'var(--rl-muted)' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'var(--rl-accent)' },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              inputProps={{ maxLength: 500 }}
              helperText={`${description.length}/500 characters`}
              FormHelperTextProps={{ sx: { color: 'var(--rl-muted)' } }}
              sx={{
                mb: 2.5,
                ...socialFieldSx,
                '& .MuiInputLabel-root': { color: 'var(--rl-muted)' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'var(--rl-accent)' },
              }}
            />

            <FormControlLabel
              control={
                <Switch
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
              label="Make this list public"
              sx={{ mb: 2.5, color: 'var(--rl-cream)', ml: 0 }}
            />

            {error && (
              <Typography sx={{ color: '#e07050', mb: 2, fontSize: '0.9rem' }}>{error}</Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" onClick={() => navigate('/lists')} sx={socialGhostBtn}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ ...socialAccentBtn, flex: 1 }}>
                {loading ? <CircularProgress size={22} sx={{ color: 'var(--rl-ink)' }} /> : 'Create List'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CreateList;
