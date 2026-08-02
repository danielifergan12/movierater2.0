import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Avatar,
  Button,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';
import api from '../config/axios';
import SocialPageShell, {
  socialTitleSx,
  socialSubtitleSx,
  socialGhostBtn,
  socialFieldSx,
  socialCardSx,
} from '../components/SocialPageShell';

const DiscoverUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDiscoverMode, setIsDiscoverMode] = useState(true);
  const navigate = useNavigate();

  const fetchDiscoverUsers = async () => {
    setLoading(true);
    setIsDiscoverMode(true);
    setHasSearched(false);
    try {
      const response = await api.get('/api/users/discover');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching discover users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoverUsers();
  }, []);

  // Debounce search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (query) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (query.trim().length >= 2) {
            setLoading(true);
            setHasSearched(true);
            setIsDiscoverMode(false);
            try {
              const response = await api.get(`/api/users/search/${encodeURIComponent(query.trim())}`);
              setUsers(response.data.users || []);
            } catch (error) {
              console.error('Error searching users:', error);
              setUsers([]);
            } finally {
              setLoading(false);
            }
          } else if (query.trim().length === 0) {
            fetchDiscoverUsers();
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, debouncedSearch]);

  return (
    <SocialPageShell maxWidth="sm">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography sx={socialTitleSx}>Discover</Typography>
        <Typography sx={socialSubtitleSx}>Find people and browse their rankings</Typography>
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by username"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ ...socialFieldSx, mb: 2.5, maxWidth: 440, mx: 'auto', display: 'block' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'var(--rl-muted)' }} />
            </InputAdornment>
          ),
        }}
      />

      {loading && users.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
        </Box>
      ) : !loading && hasSearched && users.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <PersonIcon sx={{ fontSize: 48, color: 'rgba(244,239,230,0.2)', mb: 1.5 }} />
          <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 600, mb: 0.5 }}>No users found</Typography>
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.88rem' }}>
            Try a different username
          </Typography>
        </Box>
      ) : (
        <>
          {users.length > 0 && (
            <Typography
              sx={{
                color: 'var(--rl-muted)',
                fontSize: '0.78rem',
                mb: 1.5,
                textAlign: 'center',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {isDiscoverMode
                ? `${users.length} people with rankings`
                : `${users.length} result${users.length !== 1 ? 's' : ''}`}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {users.map((user) => (
              <Box
                key={user._id}
                onClick={() => navigate(`/profile/${user._id}`)}
                sx={{
                  ...socialCardSx,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  '&:hover': {
                    borderColor: 'rgba(212,160,23,0.4)',
                    backgroundColor: 'rgba(212,160,23,0.05)',
                  },
                }}
              >
                <Avatar
                  src={user.profilePicture}
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: 'rgba(244,239,230,0.08)',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <Typography
                    sx={{
                      color: 'var(--rl-cream)',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.username || 'Anonymous'}
                  </Typography>
                  <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.75rem' }}>
                    {user.ratingsCount || user.ratings?.length || 0} ranked · {user.followers?.length || 0} followers
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to={`/profile/${user._id}`}
                  variant="outlined"
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ ...socialGhostBtn, flexShrink: 0, py: 0.45, px: 1.25, fontSize: '0.75rem' }}
                >
                  View
                </Button>
              </Box>
            ))}
          </Box>
        </>
      )}
    </SocialPageShell>
  );
};

export default DiscoverUsers;
