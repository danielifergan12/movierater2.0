import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import AuthShell, { authFieldSx, authAccentBtn, authGhostBtn } from '../components/AuthShell';

const HEAR_OPTIONS = [
  'Friend',
  'Instagram',
  'TikTok',
  'Twitter/X',
  'Reddit',
  'Google',
  'Letterboxd',
  'Campus',
  'Other',
];

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    heardAboutUs: '',
    heardAboutUsDetail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/api/auth/providers')
      .then((res) => setGoogleEnabled(Boolean(res.data?.google)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!formData.heardAboutUs) {
      setError('Please tell us how you heard about ReelList.');
      setLoading(false);
      return;
    }

    if (formData.heardAboutUs === 'Other' && !formData.heardAboutUsDetail.trim()) {
      setError('Please add a short note for “Other”.');
      setLoading(false);
      return;
    }

    const result = await register(
      formData.username.trim(),
      formData.email.trim(),
      formData.password,
      formData.heardAboutUs,
      formData.heardAboutUsDetail.trim()
    );

    if (result.success) {
      localStorage.removeItem('onboardingComplete');
      navigate('/onboarding');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <AuthShell title="Create account" subtitle="Then rank a few films so ReelList can learn your taste.">
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
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          margin="dense"
          required
          autoComplete="username"
          autoFocus
          sx={authFieldSx}
        />
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="dense"
          required
          autoComplete="email"
          sx={authFieldSx}
        />
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          margin="dense"
          required
          autoComplete="new-password"
          helperText="At least 6 characters"
          sx={authFieldSx}
        />
        <TextField
          fullWidth
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          margin="dense"
          required
          autoComplete="new-password"
          sx={authFieldSx}
        />

        <TextField
          select
          fullWidth
          required
          label="How did you hear about us?"
          name="heardAboutUs"
          value={formData.heardAboutUs}
          onChange={handleChange}
          margin="dense"
          sx={{
            ...authFieldSx,
            mt: 1.5,
            '& .MuiSelect-select': { color: 'var(--rl-cream)' },
            '& .MuiSvgIcon-root': { color: 'var(--rl-muted)' },
          }}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  bgcolor: '#171512',
                  border: '1px solid rgba(244,239,230,0.12)',
                  '& .MuiMenuItem-root': { color: 'var(--rl-cream)' },
                  '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(212,160,23,0.1)' },
                  '& .Mui-selected': { bgcolor: 'rgba(212,160,23,0.18) !important' },
                },
              },
            },
          }}
        >
          <MenuItem value="" disabled>
            Select one
          </MenuItem>
          {HEAR_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        {formData.heardAboutUs === 'Other' && (
          <TextField
            fullWidth
            label="Tell us more"
            name="heardAboutUsDetail"
            value={formData.heardAboutUsDetail}
            onChange={handleChange}
            margin="dense"
            required
            placeholder="Podcast, article, classmate…"
            sx={authFieldSx}
          />
        )}

        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ ...authAccentBtn, mt: 2.5, mb: 1.5 }}>
          {loading ? <CircularProgress size={22} sx={{ color: 'var(--rl-ink)' }} /> : 'Continue'}
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
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--rl-accent)', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </Link>
      </Typography>
    </AuthShell>
  );
};

export default Register;
