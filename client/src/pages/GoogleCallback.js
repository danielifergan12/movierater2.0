import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=google_auth_failed');
      return;
    }

    if (token) {
      loginWithToken(token)
        .then((result) => {
          if (result.success) {
            const needsOnboarding = !localStorage.getItem('onboardingComplete');
            navigate(needsOnboarding ? '/onboarding' : '/');
          } else {
            navigate('/login?error=google_auth_failed');
          }
        })
        .catch(() => {
          navigate('/login?error=google_auth_failed');
        });
    } else {
      navigate('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0c0b0a',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={28} sx={{ color: 'var(--rl-accent)', mb: 2 }} />
        <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.9rem' }}>
          Signing you in…
        </Typography>
      </Box>
    </Box>
  );
};

export default GoogleCallback;
