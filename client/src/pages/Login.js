import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check for error in URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'google_oauth_not_configured') {
      setError('Google sign-in is not available. Please use email and password to sign in.');
    } else if (errorParam === 'google_auth_failed') {
      setError('Google sign-in failed. Please try again or use email and password.');
    }
  }, []);

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

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    const backendUrl = process.env.REACT_APP_API_URL || '';
    const googleAuthUrl = backendUrl ? `${backendUrl}/api/auth/google` : '/api/auth/google';
    console.log('Redirecting to Google OAuth:', googleAuthUrl);
    
    // Add a small delay to show loading state, then redirect
    setTimeout(() => {
      window.location.href = googleAuthUrl;
    }, 100);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
        <Paper elevation={0} sx={{ 
          p: { xs: 3, sm: 4, md: 6 },
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 4,
        }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            }}>
              Login
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 300,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}>
              Welcome back! Sign in to your account.
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
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
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
            autoComplete="current-password"
          />

          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Link to="/forgot-password" style={{ 
              textDecoration: 'none',
              color: '#00d4ff',
              fontSize: '0.875rem',
            }}>
              Forgot Password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 3, 
              mb: 2,
              py: { xs: 1.25, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography variant="body2" sx={{ 
              px: 2, 
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}>
              OR
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              mb: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              py: { xs: 1.25, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              '&:hover': {
                borderColor: '#4285f4',
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
              },
            }}
          >
            Sign in with Google
          </Button>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ 
                textDecoration: 'none',
                color: '#00d4ff',
                fontWeight: 600,
              }}>
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  </Box>
  );
};

export default Login;
