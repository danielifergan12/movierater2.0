import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import AuthShell, { authFieldSx, authAccentBtn, authGhostBtn } from '../components/AuthShell';

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
    api
      .get('/api/auth/providers')
      .then((res) => setGoogleEnabled(Boolean(res.data?.google)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(formData.email.trim(), formData.password);
    if (result.success) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      const needsOnboarding = !localStorage.getItem('onboardingComplete');
      navigate(redirect?.startsWith('/') ? redirect : needsOnboarding ? '/onboarding' : '/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to keep ranking and following friends.">
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, bgcolor: 'rgba(229,115,115,0.1)', color: '#ffcdd2', '& .MuiAlert-icon': { color: '#ef9a9a' } }}
        >
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          required
          margin="dense"
          autoComplete="email"
          autoFocus
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          sx={authFieldSx}
        />
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          required
          margin="dense"
          autoComplete="current-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          sx={authFieldSx}
        />
        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ ...authAccentBtn, mt: 2.5, mb: 1.5 }}>
          {loading ? <CircularProgress size={22} sx={{ color: 'var(--rl-ink)' }} /> : 'Sign in'}
        </Button>
      </Box>

      {googleEnabled && (
        <Button
          fullWidth
          variant="outlined"
          href={`${process.env.REACT_APP_API_URL || ''}/api/auth/google`}
          sx={{ ...authGhostBtn, mb: 2 }}
        >
          Continue with Google
        </Button>
      )}

      <Typography sx={{ textAlign: 'center', color: 'var(--rl-muted)', fontSize: '0.85rem' }}>
        No account?{' '}
        <Link to="/register" style={{ color: 'var(--rl-accent)', textDecoration: 'none', fontWeight: 600 }}>
          Sign up
        </Link>
        {' · '}
        <Link to="/forgot-password" style={{ color: 'var(--rl-accent)', textDecoration: 'none', fontWeight: 600 }}>
          Forgot password
        </Link>
      </Typography>
    </AuthShell>
  );
};

export default Login;
