import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const authFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(244,239,230,0.04)',
    color: 'var(--rl-cream)',
    borderRadius: 1,
    '& fieldset': { borderColor: 'rgba(244,239,230,0.14)' },
    '&:hover fieldset': { borderColor: 'rgba(212,160,23,0.4)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(212,160,23,0.65)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--rl-muted)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--rl-accent)' },
  '& .MuiFormHelperText-root': { color: 'var(--rl-muted)' },
};

export const authAccentBtn = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 1,
  backgroundImage: 'none',
  backgroundColor: 'var(--rl-accent)',
  color: 'var(--rl-ink)',
  py: 1.15,
  fontSize: '0.95rem',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: 'var(--rl-accent-hover)',
    boxShadow: 'none',
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(212,160,23,0.35)',
    color: 'rgba(12,11,10,0.55)',
  },
};

export const authGhostBtn = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 1,
  borderColor: 'rgba(244, 239, 230, 0.22)',
  color: 'var(--rl-cream)',
  py: 1.05,
  fontSize: '0.9rem',
  '&:hover': {
    borderColor: 'rgba(212, 160, 23, 0.55)',
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
  },
};

const AuthShell = ({ children, title, subtitle, maxWidth = 'xs' }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      zIndex: 2,
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(212,160,23,0.1), transparent 55%)',
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}
  >
    <Container maxWidth={maxWidth} sx={{ py: { xs: 5, sm: 6 }, position: 'relative', zIndex: 1 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography
          component={RouterLink}
          to="/"
          sx={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: { xs: '2.8rem', sm: '3.2rem' },
            letterSpacing: '0.06em',
            color: 'var(--rl-cream)',
            textDecoration: 'none',
            lineHeight: 1,
            display: 'inline-block',
            '&:hover': { color: 'var(--rl-accent)' },
          }}
        >
          ReelList
        </Typography>
        {title && (
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: { xs: '1.55rem', sm: '1.7rem' },
              letterSpacing: '0.04em',
              color: 'var(--rl-cream)',
              mt: 2,
              lineHeight: 1.1,
            }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography sx={{ color: 'var(--rl-muted)', mt: 0.75, fontSize: '0.9rem', maxWidth: 320, mx: 'auto' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          p: { xs: 2.5, sm: 3 },
          border: '1px solid rgba(244,239,230,0.12)',
          borderRadius: 1.5,
          bgcolor: 'rgba(12,11,10,0.72)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {children}
      </Box>
    </Container>
  </Box>
);

export default AuthShell;
