import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import { Movie as MovieIcon, Star as StarIcon, People as PeopleIcon, Favorite as FavoriteIcon, AdminPanelSettings as AdminIcon, Bookmark as BookmarkIcon, List as ListIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AutocompleteSearch from './AutocompleteSearch';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMarketingHome = !isAuthenticated && location.pathname === '/';

  const handleMovieSelect = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  const handleNavigation = (path) => {
    if (location.pathname === '/' && path !== '/') {
      navigate(path, { replace: false, state: { fromHome: true, timestamp: Date.now() } });
    } else {
      navigate(path, { replace: false });
    }
  };

  return (
    <>
      {isAuthenticated && user?.username && user.username.toLowerCase() === 'danielifergan' && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 80, sm: 64 },
            left: { xs: 8, sm: 16 },
            zIndex: 1100,
          }}
        >
          <Button
            variant="contained"
            startIcon={<AdminIcon />}
            onClick={() => handleNavigation('/admin/users')}
            size="small"
            sx={{
              backgroundColor: '#c45c26',
              color: '#fff',
              fontSize: '0.75rem',
              px: 2,
              py: 0.75,
              minHeight: 32,
              borderRadius: '4px',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#a34a1c',
                boxShadow: 'none',
              },
            }}
          >
            Admin
          </Button>
        </Box>
      )}

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: isMarketingHome ? 'transparent' : 'rgba(12, 11, 10, 0.92)',
          backdropFilter: isMarketingHome ? 'none' : 'blur(12px)',
          borderBottom: isMarketingHome
            ? '1px solid transparent'
            : '1px solid rgba(244, 239, 230, 0.08)',
          boxShadow: 'none',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 72 },
            px: { xs: 2, sm: 3, md: 4 },
            gap: 2,
          }}
        >
          <Box
            onClick={() => handleNavigation('/')}
            sx={{
              display: isMarketingHome ? 'none' : 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <MovieIcon sx={{ mr: 1, color: 'var(--rl-accent)', fontSize: '1.5rem' }} />
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '1.5rem',
                letterSpacing: '0.06em',
                color: 'var(--rl-cream)',
                lineHeight: 1,
              }}
            >
              ReelList
            </Typography>
          </Box>

          {isAuthenticated && (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                maxWidth: 560,
                ml: { xs: 0, sm: 2 },
              }}
            >
              <AutocompleteSearch
                onMovieSelect={handleMovieSelect}
                placeholder="Search movies"
              />
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              ml: 'auto',
              gap: { xs: 0.5, sm: 1 },
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {isAuthenticated ? (
              <>
                <Box
                  sx={{
                    mr: 1,
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 600,
                      color: 'var(--rl-cream)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {user?.username}
                  </Typography>
                  {user?.followers && (
                    <Chip
                      label={`${user.followers.length} followers`}
                      size="small"
                      onClick={() => handleNavigation(`/profile/${user._id}/followers`)}
                      sx={{
                        backgroundColor: 'rgba(212, 160, 23, 0.12)',
                        color: 'var(--rl-accent)',
                        border: '1px solid rgba(212, 160, 23, 0.35)',
                        fontSize: '0.7rem',
                        height: 22,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                  )}
                </Box>
                <Button color="inherit" startIcon={<StarIcon />} onClick={() => handleNavigation('/rankings')}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>My Rankings</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Rankings</Box>
                </Button>
                <Button color="inherit" startIcon={<BookmarkIcon />} onClick={() => handleNavigation('/watchlist')}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Watchlist</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Watch</Box>
                </Button>
                <Button color="inherit" startIcon={<ListIcon />} onClick={() => handleNavigation('/lists')}>
                  Lists
                </Button>
                <Button color="inherit" startIcon={<PeopleIcon />} onClick={() => handleNavigation('/discover')}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Discover</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Users</Box>
                </Button>
                <Button color="inherit" startIcon={<FavoriteIcon />} onClick={() => handleNavigation('/following')}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Following</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Follow</Box>
                </Button>
                <Button color="inherit" onClick={() => { logout(); navigate('/'); }}>
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleNavigation('/login')}
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--rl-cream)',
                  textTransform: 'none',
                  borderRadius: '4px',
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(244, 239, 230, 0.08)',
                  },
                }}
              >
                Sign in
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Navbar;
