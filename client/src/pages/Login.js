import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'google_oauth_not_configured') {
      setError('Google sign-in is not available. Use email and password.');
    } else if (errorParam === 'google_auth_failed') {
      setError('Google sign-in failed. Try again or use email and password.');
    }
    api.get('/api/auth/providers').then((res) => {
      setGoogleEnabled(Boolean(res.data?.google));
    }).catch(() => setGoogleEnabled(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(formData.email, formData.password);
    if (result.success) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      const needsOnboarding = !localStorage.getItem('onboardingComplete');
      navigate(redirect?.startsWith('/') ? redirect : (needsOnboarding ? '/onboarding' : '/'));
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography sx={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '3.5rem', letterSpacing: '0.06em', color: 'var(--rl-cream)', textAlign: 'center', lineHeight: 1, mb: 1 }}>
          ReelList
        </Typography>
        <Typography sx={{ color: 'var(--rl-muted)', textAlign: 'center', mb: 4 }}>
          Welcome back
        </Typography>

        <Box sx={{ p: 3, border: '1px solid rgba(244,239,230,0.12)', borderRadius: '8px', bgcolor: 'rgba(12,11,10,0.72)' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" name="email" type="email" required margin="normal" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <TextField fullWidth label="Password" name="password" type="password" required margin="normal" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 2, mb: 2, backgroundImage: 'none' }}>
              {loading ? <CircularProgress size={22} /> : 'Sign in'}
            </Button>
          </Box>
          {googleEnabled && (
            <Button
              fullWidth
              variant="outlined"
              href={`${process.env.REACT_APP_API_URL || ''}/api/auth/google`}
              sx={{ mb: 2 }}
            >
              Continue with Google
            </Button>
          )}
          <Typography sx={{ textAlign: 'center', color: 'var(--rl-muted)', fontSize: '0.9rem' }}>
            No account? <Link to="/register" style={{ color: 'var(--rl-accent)' }}>Sign up</Link>
            {' · '}
            <Link to="/forgot-password" style={{ color: 'var(--rl-accent)' }}>Forgot password</Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
