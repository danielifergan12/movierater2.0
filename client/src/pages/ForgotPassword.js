import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import api from '../config/axios';
import AuthShell, { authFieldSx, authAccentBtn } from '../components/AuthShell';

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
      const response = await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
      if (response.data.resetLink) {
        setResetLink(response.data.resetLink);
      }
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors.map((x) => x.msg || x.message).join(', ');
        setError(errorMessages || 'Validation failed');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We’ll email you a link to choose a new password.">
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, bgcolor: 'rgba(229,115,115,0.1)', color: '#ffcdd2', '& .MuiAlert-icon': { color: '#ef9a9a' } }}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2, bgcolor: 'rgba(212,160,23,0.1)', color: 'var(--rl-cream)', '& .MuiAlert-icon': { color: 'var(--rl-accent)' } }}
        >
          If that email exists, a reset link is on the way.
        </Alert>
      )}

      {!success ? (
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            required
            margin="dense"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={authFieldSx}
          />
          <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ ...authAccentBtn, mt: 2.5, mb: 1.5 }}>
            {loading ? <CircularProgress size={22} sx={{ color: 'var(--rl-ink)' }} /> : 'Send reset link'}
          </Button>
        </Box>
      ) : resetLink ? (
        <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.82rem', mb: 2, wordBreak: 'break-all' }}>
          Dev reset link:{' '}
          <a href={resetLink} style={{ color: 'var(--rl-accent)' }}>
            {resetLink}
          </a>
        </Typography>
      ) : null}

      <Typography sx={{ textAlign: 'center', color: 'var(--rl-muted)', fontSize: '0.85rem' }}>
        <Link to="/login" style={{ color: 'var(--rl-accent)', textDecoration: 'none', fontWeight: 600 }}>
          Back to sign in
        </Link>
      </Typography>
    </AuthShell>
  );
};

export default ForgotPassword;
