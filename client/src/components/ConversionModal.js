import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ConversionModal = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  const handleEmailSignUp = () => {
    onClose();
    navigate('/register');
  };

  const handleSignIn = () => {
    onClose();
    navigate('/login');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          }}
        >
          You've ranked 5 movies! Sign in to save your list.
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            mb: 4,
            textAlign: 'center',
            fontSize: '1rem',
          }}
        >
          Save your 5 movies! Sign in now to keep your rankings safe and discover what others think.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleGoogleSignIn}
            fullWidth
            sx={{
              background: '#ffffff',
              color: '#000000',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            Continue with Google
          </Button>

          <Button
            variant="outlined"
            onClick={handleEmailSignUp}
            fullWidth
            sx={{
              borderColor: '#00d4ff',
              color: '#00d4ff',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#66e0ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
              },
            }}
          >
            Sign up with Email
          </Button>

          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem',
              }}
            >
              Already have an account?{' '}
              <Button
                onClick={handleSignIn}
                sx={{
                  color: '#00d4ff',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  minWidth: 'auto',
                  p: 0,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign in
              </Button>
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ConversionModal;

