import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

const LandingHero = () => {
  return (
    <Box
      className="landing-hero"
      sx={{
        position: 'relative',
        zIndex: 2,
        minHeight: { xs: 'calc(100dvh - 64px)', sm: 'calc(100dvh - 72px)' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        px: { xs: 3, sm: 6, md: 10 },
        pb: { xs: 8, sm: 10, md: 12 },
        pt: { xs: 6, sm: 8 },
        maxWidth: 920,
        // Auditorium letterbox: soft top/bottom bars so the hero reads as a house, not a flat page
        '&::before': {
          content: '""',
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          height: { xs: 28, sm: 36 },
          zIndex: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(12,11,10,0.75) 0%, transparent 100%)',
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: { xs: '22%', sm: '26%' },
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(0deg, rgba(12,11,10,0.88) 0%, rgba(12,11,10,0.35) 60%, transparent 100%)',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Typography
        component="p"
        className="landing-hero__brand"
        sx={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: { xs: '4.5rem', sm: '6.5rem', md: '8rem' },
          lineHeight: 0.9,
          letterSpacing: '0.04em',
          color: 'var(--rl-cream)',
          mb: { xs: 2, sm: 2.5 },
          m: 0,
        }}
      >
        ReelList
      </Typography>

      <Typography
        component="h1"
        className="landing-hero__headline"
        sx={{
          fontFamily: '"Libre Baskerville", Georgia, serif',
          fontWeight: 400,
          fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2rem' },
          lineHeight: 1.35,
          color: 'var(--rl-cream)',
          maxWidth: 520,
          mb: { xs: 1.5, sm: 2 },
        }}
      >
        Rank the films you love. See who matches your taste.
      </Typography>

      <Typography
        className="landing-hero__support"
        sx={{
          fontFamily: '"Manrope", sans-serif',
          fontSize: { xs: '0.95rem', sm: '1.05rem' },
          lineHeight: 1.55,
          color: 'var(--rl-muted)',
          maxWidth: 440,
          mb: { xs: 3.5, sm: 4 },
        }}
      >
        A personal ranking list — not another star rating dump.
      </Typography>

      <Box
        className="landing-hero__cta"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Button
          component={RouterLink}
          to="/register"
          variant="contained"
          disableElevation
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontWeight: 700,
            fontSize: { xs: '0.95rem', sm: '1rem' },
            px: { xs: 3, sm: 3.5 },
            py: { xs: 1.25, sm: 1.4 },
            borderRadius: '4px',
            textTransform: 'none',
            color: '#140f0a',
            backgroundImage: 'none',
            backgroundColor: 'var(--rl-accent)',
            boxShadow: 'none',
            '&:hover': {
              backgroundImage: 'none',
              backgroundColor: 'var(--rl-accent-hover)',
              boxShadow: 'none',
            },
          }}
        >
          Get started
        </Button>
        <Button
          component={RouterLink}
          to="/login"
          variant="text"
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontWeight: 600,
            fontSize: { xs: '0.95rem', sm: '1rem' },
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1.25, sm: 1.4 },
            borderRadius: '4px',
            textTransform: 'none',
            color: 'var(--rl-cream)',
            '&:hover': {
              backgroundColor: 'rgba(244, 239, 230, 0.08)',
            },
          }}
        >
          Sign in
        </Button>
      </Box>
      </Box>
    </Box>
  );
};

export default LandingHero;
