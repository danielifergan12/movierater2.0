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

  return (
    <>
      {isAuthenticated && user?.username?.toLowerCase() === 'danielifergan' && (
        <Box sx={{ position: 'fixed', top: { xs: 72, sm: 64 }, left: 12, zIndex: 1100 }}>
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
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, px: { xs: 2, sm: 3 }, gap: 1.5 }}>
          <Box
            onClick={() => go('/')}
            sx={{ display: isMarketingHome ? 'none' : 'flex', alignItems: 'center', cursor: 'pointer', mr: 1 }}
          >
            <MovieIcon sx={{ mr: 1, color: 'var(--rl-accent)', fontSize: '1.4rem' }} />
            <Typography sx={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.45rem', letterSpacing: '0.06em', color: 'var(--rl-cream)' }}>
              ReelList
            </Typography>
          </Box>

          {isAuthenticated && (
            <Box sx={{ flexGrow: 1, maxWidth: 480, display: { xs: 'none', md: 'block' } }}>
              <AutocompleteSearch onMovieSelect={(m) => go(`/movie/${m.id}`)} placeholder="Search movies" />
            </Box>
          )}

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isAuthenticated ? (
              <>
                <Button color="inherit" startIcon={<StarIcon />} onClick={() => go('/rankings')} sx={{ textTransform: 'none', color: 'var(--rl-cream)', display: { xs: 'none', sm: 'inline-flex' } }}>
                  Rankings
                </Button>
                <Button color="inherit" startIcon={<ListIcon />} onClick={() => go('/lists')} sx={{ textTransform: 'none', color: 'var(--rl-cream)', display: { xs: 'none', sm: 'inline-flex' } }}>
                  Lists
                </Button>
                <Button color="inherit" startIcon={<PeopleIcon />} onClick={() => go('/discover')} sx={{ textTransform: 'none', color: 'var(--rl-cream)', display: { xs: 'none', md: 'inline-flex' } }}>
                  Discover
                </Button>
                <Button color="inherit" startIcon={<FeedIcon />} onClick={() => go('/feed')} sx={{ textTransform: 'none', color: 'var(--rl-cream)', display: { xs: 'none', md: 'inline-flex' } }}>
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
                  <MenuItem onClick={() => go('/rankings')} sx={{ display: { sm: 'none' } }}><ListItemIcon><StarIcon fontSize="small" /></ListItemIcon><ListItemText>Rankings</ListItemText></MenuItem>
                  <MenuItem onClick={() => go('/lists')} sx={{ display: { sm: 'none' } }}><ListItemIcon><ListIcon fontSize="small" /></ListItemIcon><ListItemText>Lists</ListItemText></MenuItem>
                  <MenuItem onClick={() => go('/discover')} sx={{ display: { md: 'none' } }}><ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon><ListItemText>Discover</ListItemText></MenuItem>
                  <MenuItem onClick={() => go('/feed')} sx={{ display: { md: 'none' } }}><ListItemIcon><FeedIcon fontSize="small" /></ListItemIcon><ListItemText>Feed</ListItemText></MenuItem>
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
          <Box sx={{ display: { xs: 'block', md: 'none' }, px: 2, pb: 1.5 }}>
            <AutocompleteSearch onMovieSelect={(m) => go(`/movie/${m.id}`)} placeholder="Search movies" />
          </Box>
        )}
      </AppBar>
    </>
  );
};

export default Navbar;
