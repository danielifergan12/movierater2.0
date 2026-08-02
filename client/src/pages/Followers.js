import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Box,
  Avatar,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Person as PersonIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import api from '../config/axios';
import SocialPageShell, {
  socialTitleSx,
  socialSubtitleSx,
  socialGhostBtn,
  socialCardSx,
} from '../components/SocialPageShell';

const Followers = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchFollowers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const [followersResponse, userResponse] = await Promise.all([
        api.get(`/api/users/${userId}/followers`),
        api.get(`/api/users/${userId}`),
      ]);
      setFollowers(followersResponse.data.followers || []);
      setUser(userResponse.data.user);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SocialPageShell maxWidth="sm">
      <Box sx={{ position: 'relative', textAlign: 'center', mb: 3, px: 4 }}>
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{
            position: 'absolute',
            left: 0,
            top: 0.25,
            color: 'var(--rl-muted)',
            '&:hover': { color: 'var(--rl-cream)', backgroundColor: 'rgba(244,239,230,0.06)' },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography sx={socialTitleSx}>
          {user ? `${user.username}` : 'Followers'}
        </Typography>
        <Typography sx={socialSubtitleSx}>
          {followers.length} follower{followers.length === 1 ? '' : 's'}
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
        </Box>
      ) : followers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <PersonIcon sx={{ fontSize: 48, color: 'rgba(244,239,230,0.2)', mb: 1.5 }} />
          <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 600, mb: 0.5 }}>
            No followers yet
          </Typography>
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.88rem' }}>
            Nobody is following this user yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {followers.map((follower) => (
            <Box
              key={follower._id}
              onClick={() => navigate(`/profile/${follower._id}`)}
              sx={{
                ...socialCardSx,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'rgba(212,160,23,0.4)',
                  backgroundColor: 'rgba(212,160,23,0.05)',
                },
              }}
            >
              <Avatar
                src={follower.profilePicture}
                sx={{ width: 42, height: 42, bgcolor: 'rgba(244,239,230,0.08)' }}
              >
                {follower.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <Typography
                  sx={{
                    color: 'var(--rl-cream)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {follower.username}
                </Typography>
                {follower.bio && (
                  <Typography
                    sx={{
                      color: 'var(--rl-muted)',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {follower.bio}
                  </Typography>
                )}
              </Box>
              <Button
                component={Link}
                to={`/profile/${follower._id}`}
                variant="outlined"
                size="small"
                onClick={(e) => e.stopPropagation()}
                sx={{ ...socialGhostBtn, py: 0.4, px: 1.1, fontSize: '0.72rem' }}
              >
                View
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </SocialPageShell>
  );
};

export default Followers;
