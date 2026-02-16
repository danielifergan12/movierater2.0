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

  // Debug: Log user info to help troubleshoot admin button visibility
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Navbar - Current user:', user.username);
      console.log('Navbar - Is admin?', user?.username && user.username.toLowerCase() === 'danielifergan');
    }
  }, [user, isAuthenticated]);

  const handleMovieSelect = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  const handleNavigation = (path) => {
    // When navigating from home page, ensure React Router detects the change
    // by using state to force a remount if needed
    if (location.pathname === '/' && path !== '/') {
      // Navigate with state to ensure React Router detects the change
      navigate(path, { replace: false, state: { fromHome: true, timestamp: Date.now() } });
    } else {
      navigate(path, { replace: false });
    }
  };

  return (
    <>
      {/* Admin Button - Fixed position in top left, below navbar */}
      {isAuthenticated && user?.username && user.username.toLowerCase() === 'danielifergan' && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 80, sm: 64 },
            left: { xs: 8, sm: 16 },
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1
          }}
        >
          <Button
            variant="contained"
            startIcon={<AdminIcon />}
            onClick={() => handleNavigation('/admin/users')}
            size="small"
            sx={{
              background: 'linear-gradient(45deg, #ff6b35, #e64a19)',
              color: '#ffffff',
              fontSize: '0.75rem',
              px: 2,
              py: 0.75,
              minHeight: 32,
              boxShadow: '0 2px 8px rgba(255, 107, 53, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #e64a19, #cc3d0f)',
                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.6)',
              },
            }}
          >
            Admin
          </Button>
        </Box>
      )}

      <AppBar position="sticky" sx={{ 
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 107, 53, 0.1))',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
      }}>
        <Toolbar sx={{ 
          flexDirection: { xs: 'column', sm: 'row' },
          py: { xs: 1.5, sm: 0 },
          gap: { xs: 1.5, sm: 0 },
          minHeight: { xs: 'auto', sm: 64 }
        }}>
          <Box
            onClick={() => handleNavigation('/')}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              mr: { xs: 0, sm: 2 },
              order: { xs: 1, sm: 0 },
              minHeight: { xs: 44, sm: 'auto' },
              minWidth: { xs: 44, sm: 'auto' },
              cursor: 'pointer'
            }}
          >
            <MovieIcon sx={{ mr: 1, color: '#00d4ff', fontSize: { xs: '1.75rem', sm: '2rem' } }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00d4ff 0%, #ff6b35 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              ReelList
            </Typography>
          </Box>

          {/* Search - only show for authenticated users */}
          {isAuthenticated && (
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              maxWidth: { xs: '100%', sm: 600 },
              width: { xs: '100%', sm: 'auto' },
              ml: { xs: 0, sm: 3 },
              mr: { xs: 0, sm: 4 },
              order: { xs: 3, sm: 0 },
              mb: { xs: 1, sm: 0 }
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
          ml: { xs: 0, sm: isAuthenticated ? 'auto' : 0 },
          gap: { xs: 1, sm: 1 },
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
                alignItems: 'center',
                gap: 1
              }}>
                <Typography variant="body1" sx={{ 
                  fontWeight: 600, 
                  color: '#66e0ff',
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  {user?.username}
                </Typography>
                {user?.followers && (
                  <Chip
                    label={`${user.followers.length} followers`}
                    size="small"
                    onClick={() => handleNavigation(`/profile/${user._id}/followers`)}
                    sx={{
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      color: '#00d4ff',
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                      fontSize: '0.7rem',
                      height: 22,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 212, 255, 0.2)',
                        border: '1px solid rgba(0, 212, 255, 0.5)',
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                )}
              </Box>
              <Button
                color="inherit"
                startIcon={<StarIcon />}
                onClick={() => handleNavigation('/rankings')}
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 2 },
                  py: { xs: 1.25, sm: 1 },
                  minHeight: { xs: 44, sm: 36 },
                  minWidth: { xs: 44, sm: 'auto' }
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
                startIcon={<BookmarkIcon />}
                onClick={() => handleNavigation('/watchlist')}
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 2 },
                  py: { xs: 1.25, sm: 1 },
                  minHeight: { xs: 44, sm: 36 },
                  minWidth: { xs: 44, sm: 'auto' }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Watchlist
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Watch
                </Box>
              </Button>
              <Button
                color="inherit"
                startIcon={<ListIcon />}
                onClick={() => handleNavigation('/lists')}
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 2 },
                  py: { xs: 1.25, sm: 1 },
                  minHeight: { xs: 44, sm: 36 },
                  minWidth: { xs: 44, sm: 'auto' }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Lists
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Lists
                </Box>
              </Button>
              <Button
                color="inherit"
                startIcon={<PeopleIcon />}
                onClick={() => handleNavigation('/discover')}
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 2 },
                  py: { xs: 1.25, sm: 1 },
                  minHeight: { xs: 44, sm: 36 },
                  minWidth: { xs: 44, sm: 'auto' }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Discover
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Users
                </Box>
              </Button>
              <Button
                color="inherit"
                startIcon={<FavoriteIcon />}
                onClick={() => handleNavigation('/following')}
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 2 },
                  py: { xs: 1.25, sm: 1 },
                  minHeight: { xs: 44, sm: 36 },
                  minWidth: { xs: 44, sm: 'auto' }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Following
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Follow
                </Box>
              </Button>
              <Button 
                color="inherit" 
                onClick={() => { logout(); navigate('/'); }}
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 2 },
                  py: { xs: 1.25, sm: 1 },
                  minHeight: { xs: 44, sm: 36 },
                  minWidth: { xs: 44, sm: 'auto' }
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => handleNavigation('/login')}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                px: { xs: 2, sm: 3 },
                py: { xs: 1.25, sm: 1 },
                minHeight: { xs: 44, sm: 36 },
                minWidth: { xs: 44, sm: 'auto' },
                color: '#00d4ff',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                }
              }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
    </>
  );
};

export default Navbar;
