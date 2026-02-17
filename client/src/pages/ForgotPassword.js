import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import api from '../config/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setSuccess(true);
      // In development, show the reset link
      if (response.data.resetLink) {
        setResetLink(response.data.resetLink);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });

      // Handle validation errors (array format)
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        setError(errorMessages || 'Validation failed');
      } else {
        // Handle message format
        setError(error.response?.data?.message || error.message || 'Failed to send reset email. Please check your backend connection.');
      }
    } finally {
      setLoading(false);
    }
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
              Forgot Password
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 300,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}>
              Enter your email to receive a password reset link
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Password reset link has been sent to your email!
              </Alert>
              {resetLink && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 212, 255, 0.1)', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                    Development Mode - Reset Link:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#00d4ff',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}>
                    <a href={resetLink} style={{ color: '#00d4ff' }}>{resetLink}</a>
                  </Typography>
                </Box>
              )}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Link to="/login" style={{ 
                  textDecoration: 'none',
                  color: '#00d4ff',
                  fontWeight: 600,
                }}>
                  Back to Login
                </Link>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
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
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Remember your password?{' '}
                  <Link to="/login" style={{ 
                    textDecoration: 'none',
                    color: '#00d4ff',
                    fontWeight: 600,
                  }}>
                    Back to Login
                  </Link>
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;

