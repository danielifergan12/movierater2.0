import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { Movie as MovieIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await register(formData.username, formData.email, formData.password);
    
    if (result.success) {
      // Small delay to ensure auth state is updated before navigation
      setTimeout(() => {
        navigate('/');
      }, 100);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };


  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, px: { xs: 2, sm: 3 } }}>
        {/* ReelList Logo - Large and Centered */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: { xs: 4, sm: 6 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: { xs: 1.5, sm: 2 },
            mb: 2
          }}>
            <MovieIcon sx={{ 
              color: '#00d4ff', 
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.5))'
            }} />
            <Typography variant="h1" component="h1" sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              letterSpacing: { xs: '0.05em', sm: '0.1em' },
              textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            }}>
              ReelList
            </Typography>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ 
          p: { xs: 3, sm: 4, md: 6 },
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 4,
        }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            }}>
              Create Account
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 300,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}>
              Join ReelList and start rating movies today!
            </Typography>
          </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="username"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: { xs: '1rem', sm: '1rem' },
                minHeight: { xs: 56, sm: 56 }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '1rem', sm: '1rem' }
              }
            }}
          />
          
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: { xs: '1rem', sm: '1rem' },
                minHeight: { xs: 56, sm: 56 }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '1rem', sm: '1rem' }
              }
            }}
          />
          
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: { xs: '1rem', sm: '1rem' },
                minHeight: { xs: 56, sm: 56 }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '1rem', sm: '1rem' }
              }
            }}
          />
          
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: { xs: '1rem', sm: '1rem' },
                minHeight: { xs: 56, sm: 56 }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '1rem', sm: '1rem' }
              }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 3, 
              mb: 2,
              py: { xs: 1.75, sm: 1.5 },
              fontSize: { xs: '1rem', sm: '1rem' },
              minHeight: { xs: 52, sm: 48 },
              fontWeight: 600
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Account'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ 
                textDecoration: 'none',
                color: '#00d4ff',
                fontWeight: 600,
              }}>
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  </Box>
  );
};

export default Register;
