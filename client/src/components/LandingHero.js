import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const LandingHero = ({ onStartRanking }) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 3 },
        maxWidth: '800px',
        mx: 'auto',
      }}
    >
      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          fontWeight: 700,
          mb: 2,
          background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}
      >
        Search and rank 5 movies. Build your personal list.
      </Typography>

      <Typography
        variant="h6"
        component="p"
        sx={{
          fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
          color: 'rgba(255, 255, 255, 0.8)',
          mb: { xs: 3, sm: 4 },
          fontWeight: 300,
          fontStyle: 'italic',
        }}
      >
        Your rankings say who you are.
      </Typography>

      <Button
        variant="contained"
        onClick={onStartRanking}
        sx={{
          background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
          color: '#ffffff',
          fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
          fontWeight: 700,
          px: { xs: 4, sm: 6, md: 8 },
          py: { xs: 1.5, sm: 2, md: 2.5 },
          borderRadius: 3,
          textTransform: 'none',
          boxShadow: '0 8px 24px rgba(0, 212, 255, 0.4)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0, 212, 255, 0.6)',
            background: 'linear-gradient(45deg, #66e0ff, #ff8a65)',
          },
          '&:active': {
            transform: 'translateY(-2px)',
          },
        }}
      >
        Start Ranking
      </Button>
    </Box>
  );
};

export default LandingHero;

