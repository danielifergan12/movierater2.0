import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Box,
  Avatar,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import SocialPageShell, {
  socialTitleSx,
  socialSubtitleSx,
  socialGhostBtn,
  socialAccentBtn,
  socialCardSx,
} from '../components/SocialPageShell';

const FollowingRankings = () => {
  const { user } = useAuth();
  const [followingRankings, setFollowingRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState({});

  useEffect(() => {
    fetchFollowingRankings();
  }, []);

  const fetchFollowingRankings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users/following/rankings');
      const rows = response.data.rankings || [];
      setFollowingRankings(rows);
      if (rows.length <= 3) {
        const initial = {};
        rows.forEach((r) => {
          initial[r.userId] = true;
        });
        setOpenIds(initial);
      }
    } catch (error) {
      console.error('Error fetching following rankings:', error);
      setFollowingRankings([]);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (userId) => {
    setOpenIds((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const rankColor = (index) => {
    if (index === 0) return '#d4a017';
    if (index === 1) return '#b8b8b8';
    if (index === 2) return '#c47a3a';
    return 'var(--rl-muted)';
  };

  if (loading) {
    return (
      <SocialPageShell>
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
        </Box>
      </SocialPageShell>
    );
  }

  if (followingRankings.length === 0) {
    return (
      <SocialPageShell maxWidth="sm">
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <PersonIcon sx={{ fontSize: 48, color: 'rgba(244,239,230,0.2)', mb: 1.5 }} />
          <Typography sx={{ ...socialTitleSx, fontSize: '2rem', mb: 1 }}>
            No rankings yet
          </Typography>
          <Typography sx={{ ...socialSubtitleSx, mb: 3, maxWidth: 360, mx: 'auto' }}>
            {user?.following?.length === 0
              ? "You're not following anyone yet. Discover people to see their lists here."
              : "People you follow haven't ranked movies yet."}
          </Typography>
          <Button component={Link} to="/discover" variant="contained" sx={socialAccentBtn}>
            Discover people
          </Button>
        </Box>
      </SocialPageShell>
    );
  }

  return (
    <SocialPageShell maxWidth="sm">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography sx={socialTitleSx}>Following</Typography>
        <Typography sx={socialSubtitleSx}>Rankings from people you follow</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {followingRankings.map((userRankings) => {
          const open = !!openIds[userRankings.userId];
          return (
            <Box key={userRankings.userId} sx={socialCardSx}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  p: 1.5,
                  cursor: 'pointer',
                }}
                onClick={() => toggle(userRankings.userId)}
              >
                <Avatar
                  src={userRankings.profilePicture}
                  sx={{ width: 40, height: 40, bgcolor: 'rgba(244,239,230,0.08)' }}
                >
                  {userRankings.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 600, fontSize: '0.92rem' }}>
                    {userRankings.username}
                  </Typography>
                  <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.75rem' }}>
                    {userRankings.ratings.length} ranked · {userRankings.followersCount || 0} followers
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to={`/profile/${userRankings.userId}`}
                  variant="outlined"
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ ...socialGhostBtn, py: 0.4, px: 1.1, fontSize: '0.72rem' }}
                >
                  Profile
                </Button>
                <IconButton
                  size="small"
                  sx={{
                    color: 'var(--rl-muted)',
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              </Box>

              <Collapse in={open}>
                <Box sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
                  <Box sx={{ borderTop: '1px solid rgba(244,239,230,0.08)', pt: 1 }}>
                    {userRankings.ratings.map((ranking, index) => (
                      <Box
                        key={ranking.id}
                        component={Link}
                        to={`/movie/${ranking.id}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.25,
                          py: 0.85,
                          px: 0.5,
                          textDecoration: 'none',
                          borderRadius: 0.75,
                          '&:hover': { backgroundColor: 'rgba(244,239,230,0.04)' },
                        }}
                      >
                        <Typography
                          sx={{
                            width: 28,
                            flexShrink: 0,
                            fontFamily: '"Bebas Neue", sans-serif',
                            fontSize: '1.1rem',
                            color: rankColor(index),
                          }}
                        >
                          #{index + 1}
                        </Typography>
                        <Avatar
                          variant="rounded"
                          src={ranking.posterUrl || undefined}
                          sx={{ width: 36, height: 54, borderRadius: '3px', flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            color: 'var(--rl-cream)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ranking.title}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </SocialPageShell>
  );
};

export default FollowingRankings;
