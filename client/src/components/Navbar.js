import React from 'react';
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
      <Toolbar sx={{ 
        flexDirection: { xs: 'column', sm: 'row' },
        py: { xs: 1, sm: 0 },
        gap: { xs: 1, sm: 0 }
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: { xs: 0, sm: 3 },
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            <MovieIcon sx={{ mr: 1, color: '#00d4ff', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
            }}>
              MovieRate
            </Typography>
          </Box>
        </Link>

        {isAuthenticated && (
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            maxWidth: { xs: '100%', sm: 600 },
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 3, sm: 0 }
          }}>
            <AutocompleteSearch 
              onMovieSelect={handleMovieSelect}
              placeholder="Search movies"
            />
          </Box>
        )}

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          ml: { xs: 0, sm: 'auto' },
          gap: { xs: 0.5, sm: 1 },
          flexWrap: 'wrap',
          justifyContent: { xs: 'center', sm: 'flex-end' },
          width: { xs: '100%', sm: 'auto' },
          order: { xs: 2, sm: 0 }
        }}>
          {isAuthenticated ? (
            <>
              <Box sx={{ 
                mr: { xs: 1, sm: 2 }, 
                display: { xs: 'none', sm: 'flex' }, 
                alignItems: 'center' 
              }}>
                <Typography variant="body1" sx={{ 
                  fontWeight: 600, 
                  color: '#66e0ff',
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  {user?.username}
                </Typography>
              </Box>
              <Button
                color="inherit"
                startIcon={<StarIcon />}
                component={Link}
                to="/rankings"
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  My Rankings
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Rankings
                </Box>
              </Button>
              <Button 
                color="inherit" 
                onClick={() => { logout(); navigate('/'); }}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/login" 
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                component={Link} 
                to="/register"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 }
                }}
              >
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
