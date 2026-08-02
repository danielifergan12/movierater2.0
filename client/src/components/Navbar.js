import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Movie as MovieIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Favorite as FavoriteIcon,
  AdminPanelSettings as AdminIcon,
  Bookmark as BookmarkIcon,
  List as ListIcon,
  MoreVert as MoreIcon,
  DynamicFeed as FeedIcon,
  CompareArrows as TasteIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AutocompleteSearch from './AutocompleteSearch';

const iconNavSx = {
  color: 'var(--rl-cream)',
  p: 0.85,
  '&:hover': { color: 'var(--rl-accent)', backgroundColor: 'rgba(244,239,230,0.06)' },
};

const textNavSx = {
  textTransform: 'none',
  color: 'var(--rl-cream)',
  minWidth: 0,
  px: 1,
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMarketingHome = !isAuthenticated && location.pathname === '/';
  const [anchorEl, setAnchorEl] = useState(null);

  const go = (path) => {
    setAnchorEl(null);
    navigate(path);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const activeIcon = (path) => ({
    ...iconNavSx,
    color: isActive(path) ? 'var(--rl-accent)' : 'var(--rl-cream)',
  });

  return (
    <>
      {isAuthenticated && user?.username?.toLowerCase() === 'danielifergan' && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 'calc(112px + env(safe-area-inset-top, 0px))', sm: 'calc(72px + env(safe-area-inset-top, 0px))' },
            left: 'max(12px, env(safe-area-inset-left, 0px))',
            zIndex: 1100,
          }}
        >
          <Button
            size="small"
            startIcon={<AdminIcon />}
            onClick={() => go('/admin/users')}
            sx={{ backgroundColor: '#c45c26', color: '#fff', borderRadius: '4px', boxShadow: 'none', '&:hover': { backgroundColor: '#a34a1c', boxShadow: 'none' } }}
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
          borderBottom: isMarketingHome ? '1px solid transparent' : '1px solid rgba(244, 239, 230, 0.08)',
          pt: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, sm: 72 },
            px: {
              xs: 'max(12px, env(safe-area-inset-left, 0px))',
              sm: 3,
            },
            pr: {
              xs: 'max(8px, env(safe-area-inset-right, 0px))',
              sm: 3,
            },
            gap: { xs: 0.25, sm: 1.5 },
          }}
        >
          <Box
            onClick={() => go('/')}
            sx={{ display: isMarketingHome ? 'none' : 'flex', alignItems: 'center', cursor: 'pointer', mr: { xs: 0.25, sm: 1 }, flexShrink: 0 }}
          >
            <MovieIcon sx={{ mr: { xs: 0.5, sm: 1 }, color: 'var(--rl-accent)', fontSize: { xs: '1.25rem', sm: '1.4rem' } }} />
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: { xs: '1.25rem', sm: '1.45rem' },
                letterSpacing: '0.06em',
                color: 'var(--rl-cream)',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              ReelList
            </Typography>
          </Box>

          {isAuthenticated && (
            <Box sx={{ flexGrow: 1, maxWidth: 480, display: { xs: 'none', md: 'block' } }}>
              <AutocompleteSearch onMovieSelect={(m) => go(`/movie/${m.id}`)} placeholder="Search movies" />
            </Box>
          )}

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.5 } }}>
            {isAuthenticated ? (
              <>
                {/* iPhone / compact: icon-only shortcuts always visible */}
                <Tooltip title="Rankings">
                  <IconButton onClick={() => go('/rankings')} aria-label="Rankings" sx={{ ...activeIcon('/rankings'), display: { xs: 'inline-flex', sm: 'none' } }}>
                    <StarIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Lists">
                  <IconButton onClick={() => go('/lists')} aria-label="Lists" sx={{ ...activeIcon('/lists'), display: { xs: 'inline-flex', sm: 'none' } }}>
                    <ListIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Discover">
                  <IconButton onClick={() => go('/discover')} aria-label="Discover" sx={{ ...activeIcon('/discover'), display: { xs: 'inline-flex', md: 'none' } }}>
                    <PeopleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Feed">
                  <IconButton onClick={() => go('/feed')} aria-label="Feed" sx={{ ...activeIcon('/feed'), display: { xs: 'inline-flex', md: 'none' } }}>
                    <FeedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Tablet / desktop: labeled buttons */}
                <Button color="inherit" startIcon={<StarIcon />} onClick={() => go('/rankings')} sx={{ ...textNavSx, display: { xs: 'none', sm: 'inline-flex' }, color: isActive('/rankings') ? 'var(--rl-accent)' : 'var(--rl-cream)' }}>
                  Rankings
                </Button>
                <Button color="inherit" startIcon={<ListIcon />} onClick={() => go('/lists')} sx={{ ...textNavSx, display: { xs: 'none', sm: 'inline-flex' }, color: isActive('/lists') ? 'var(--rl-accent)' : 'var(--rl-cream)' }}>
                  Lists
                </Button>
                <Button color="inherit" startIcon={<PeopleIcon />} onClick={() => go('/discover')} sx={{ ...textNavSx, display: { xs: 'none', md: 'inline-flex' }, color: isActive('/discover') ? 'var(--rl-accent)' : 'var(--rl-cream)' }}>
                  Discover
                </Button>
                <Button color="inherit" startIcon={<FeedIcon />} onClick={() => go('/feed')} sx={{ ...textNavSx, display: { xs: 'none', md: 'inline-flex' }, color: isActive('/feed') ? 'var(--rl-accent)' : 'var(--rl-cream)' }}>
                  Feed
                </Button>

                <Typography sx={{ color: 'var(--rl-muted)', mx: 1, display: { xs: 'none', lg: 'block' }, fontSize: '0.9rem' }}>
                  {user?.username}
                </Typography>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'var(--rl-cream)' }} aria-label="More">
                  <MoreIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  PaperProps={{ sx: { bgcolor: '#171512', border: '1px solid rgba(244,239,230,0.1)', minWidth: 200 } }}
                >
                  <MenuItem onClick={() => go('/watchlist')}><ListItemIcon><BookmarkIcon fontSize="small" /></ListItemIcon><ListItemText>Watchlist</ListItemText></MenuItem>
                  <MenuItem onClick={() => go('/following')}><ListItemIcon><FavoriteIcon fontSize="small" /></ListItemIcon><ListItemText>Following</ListItemText></MenuItem>
                  <MenuItem onClick={() => go('/onboarding')}><ListItemIcon><TasteIcon fontSize="small" /></ListItemIcon><ListItemText>Taste setup</ListItemText></MenuItem>
                  {user?._id && (
                    <MenuItem onClick={() => go(`/profile/${user._id}`)}><ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon><ListItemText>Profile</ListItemText></MenuItem>
                  )}
                  <Divider sx={{ borderColor: 'rgba(244,239,230,0.08)' }} />
                  <MenuItem onClick={() => { logout(); go('/'); }}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon><ListItemText>Log out</ListItemText></MenuItem>
                </Menu>
              </>
            ) : (
              <Button onClick={() => go('/login')} sx={{ color: 'var(--rl-cream)', textTransform: 'none', fontWeight: 600 }}>
                Sign in
              </Button>
            )}
          </Box>
        </Toolbar>
        {isAuthenticated && (
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              px: { xs: 'max(12px, env(safe-area-inset-left, 0px))', sm: 2 },
              pr: { xs: 'max(12px, env(safe-area-inset-right, 0px))', sm: 2 },
              pb: 1.25,
            }}
          >
            <AutocompleteSearch onMovieSelect={(m) => go(`/movie/${m.id}`)} placeholder="Search movies" />
          </Box>
        )}
      </AppBar>
    </>
  );
};

export default Navbar;
