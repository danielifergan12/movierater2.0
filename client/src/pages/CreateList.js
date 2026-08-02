import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

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
        isPublic
      });
      navigate(`/list/${response.data._id}`);
    } catch (error) {
      console.error('Error creating list:', error);
      setError(error.response?.data?.message || 'Error creating list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Typography variant="h2" sx={{
          background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          mb: 4,
        }}>
          Create New List
        </Typography>

        <Card sx={{
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 4,
          p: 4,
        }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="List Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              sx={{
                mb: 3,
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

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                mb: 3,
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
              inputProps={{ maxLength: 500 }}
              helperText={`${description.length}/500 characters`}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00d4ff',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00d4ff',
                    },
                  }}
                />
              }
              label="Make this list public"
              sx={{ mb: 3, color: '#ffffff' }}
            />

            {error && (
              <Typography variant="body2" sx={{ color: '#ff6b35', mb: 2 }}>
                {error}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/lists')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                  flex: 1,
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Create List'}
              </Button>
            </Box>
          </form>
        </Card>
      </Container>
    </Box>
  );
};

export default CreateList;

