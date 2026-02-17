import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Movie as MovieIcon, Star as StarIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AutocompleteSearch from './AutocompleteSearch';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleMovieSelect = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <AppBar position="sticky" sx={{ 
      background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 107, 53, 0.1))',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
    }}>
      <Toolbar>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 3,
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            <MovieIcon sx={{ mr: 1, color: '#00d4ff' }} />
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 'bold',
              fontSize: '1.5rem',
            }}>
              MovieRate
            </Typography>
          </Box>
        </Link>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', maxWidth: 600 }}>
          <AutocompleteSearch 
            onMovieSelect={handleMovieSelect}
            placeholder="Search movies"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          {isAuthenticated ? (
            <>
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#66e0ff' }}>
                  {user?.username}
                </Typography>
              </Box>
              <Button
                color="inherit"
                startIcon={<StarIcon />}
                component={Link}
                to="/rankings"
                sx={{ mr: 1 }}
              >
                My Rankings
              </Button>
              <Button color="inherit" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login" sx={{ mr: 1 }}>
                Login
              </Button>
              <Button variant="contained" component={Link} to="/register">
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
