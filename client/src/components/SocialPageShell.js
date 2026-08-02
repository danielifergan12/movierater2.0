import React from 'react';
import { Box, Container } from '@mui/material';

export const socialPageShellSx = {
  minHeight: '100vh',
  bgcolor: '#0c0b0a',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse 70% 45% at 12% 0%, rgba(212,160,23,0.09), transparent 60%), radial-gradient(ellipse 50% 40% at 92% 18%, rgba(244,239,230,0.04), transparent 55%)',
    pointerEvents: 'none',
  },
};

export const socialTitleSx = {
  fontFamily: '"Bebas Neue", sans-serif',
  fontSize: { xs: '2rem', sm: '2.5rem' },
  letterSpacing: '0.04em',
  color: 'var(--rl-cream)',
  lineHeight: 1.05,
};

export const socialSubtitleSx = {
  color: 'var(--rl-muted)',
  fontSize: '0.85rem',
  mt: 0.5,
};

export const socialGhostBtn = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 1,
  borderColor: 'rgba(244, 239, 230, 0.22)',
  color: 'var(--rl-cream)',
  px: 2,
  py: 0.75,
  fontSize: '0.82rem',
  boxShadow: 'none',
  '&:hover': {
    borderColor: 'rgba(212, 160, 23, 0.55)',
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    boxShadow: 'none',
  },
};

export const socialAccentBtn = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 1,
  backgroundImage: 'none',
  backgroundColor: 'var(--rl-accent)',
  color: 'var(--rl-ink)',
  px: 2.25,
  py: 0.85,
  fontSize: '0.85rem',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: 'var(--rl-accent-hover)',
    boxShadow: 'none',
  },
};

export const socialCardSx = {
  bgcolor: 'rgba(244,239,230,0.03)',
  border: '1px solid rgba(244,239,230,0.1)',
  borderRadius: 1,
  boxShadow: 'none',
};

export const socialFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(244,239,230,0.04)',
    color: 'var(--rl-cream)',
    borderRadius: 1,
    '& fieldset': { borderColor: 'rgba(244,239,230,0.14)' },
    '&:hover fieldset': { borderColor: 'rgba(212,160,23,0.4)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(212,160,23,0.65)' },
  },
};

const SocialPageShell = ({ children, maxWidth = 'md', centered = false }) => (
  <Box sx={socialPageShellSx}>
    <Container
      maxWidth={maxWidth}
      sx={{
        py: { xs: 3, sm: 4.5 },
        px: { xs: 2, sm: 3 },
        position: 'relative',
        zIndex: 1,
        ...(centered ? { textAlign: 'center' } : {}),
      }}
    >
      {children}
    </Container>
  </Box>
);

export default SocialPageShell;
