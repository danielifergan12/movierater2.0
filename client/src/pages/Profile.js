import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Avatar,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { PersonAdd, PersonRemove, Movie as MovieIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import SocialPageShell, {
  socialTitleSx,
  socialSubtitleSx,
  socialGhostBtn,
  socialAccentBtn,
  socialCardSx,
} from '../components/SocialPageShell';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [tasteProfile, setTasteProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const loadTaste = async () => {
      if (!isAuthenticated || !currentUser?._id || currentUser._id !== userId) return;
      try {
        const res = await api.get('/api/users/me/taste-profile');
        setTasteProfile(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadTaste();
  }, [currentUser?._id, isAuthenticated, userId]);

  const fetchRankings = async () => {
    setLoadingRankings(true);
    try {
      const response = await api.get(`/api/users/${userId}/rankings`);
      setRankings(response.data.ratings || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setRankings([]);
    } finally {
      setLoadingRankings(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const profileResponse = await api.get(`/api/users/${userId}`);
      setProfileUser(profileResponse.data.user);
      setIsFollowing(profileResponse.data.user.followers?.some((f) => f._id === currentUser?._id));
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await api.post(`/api/users/${userId}/follow`);
      setIsFollowing(response.data.isFollowing);
      fetchProfile();
    } catch (error) {
      console.error('Error following user:', error);
    }
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

  if (!profileUser) {
    return (
      <SocialPageShell maxWidth="sm">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={socialTitleSx}>User not found</Typography>
          <Button component={Link} to="/" variant="outlined" sx={{ ...socialGhostBtn, mt: 2 }}>
            Back home
          </Button>
        </Box>
      </SocialPageShell>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <SocialPageShell maxWidth="sm">
      <Box sx={{ textAlign: 'center', mb: 3.5 }}>
        <Avatar
          src={profileUser.profilePicture}
          sx={{
            width: { xs: 72, sm: 88 },
            height: { xs: 72, sm: 88 },
            mx: 'auto',
            mb: 1.5,
            bgcolor: 'rgba(244,239,230,0.08)',
            border: '1px solid rgba(244,239,230,0.12)',
            fontSize: '1.75rem',
          }}
        >
          {profileUser.username?.charAt(0).toUpperCase()}
        </Avatar>

        <Typography sx={{ ...socialTitleSx, fontSize: { xs: '1.85rem', sm: '2.2rem' } }}>
          {profileUser.username}
        </Typography>

        {profileUser.bio && (
          <Typography sx={{ ...socialSubtitleSx, maxWidth: 420, mx: 'auto', mt: 1 }}>
            {profileUser.bio}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3.5,
            mt: 2,
            mb: 2,
          }}
        >
          <Box
            onClick={() => navigate(`/profile/${userId}/followers`)}
            sx={{ cursor: 'pointer', '&:hover .n': { color: 'var(--rl-accent)' } }}
          >
            <Typography className="n" sx={{ color: 'var(--rl-cream)', fontWeight: 700, fontSize: '1.1rem' }}>
              {profileUser.followers?.length || 0}
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.72rem' }}>Followers</Typography>
          </Box>
          <Box
            onClick={() => navigate(`/profile/${userId}/following`)}
            sx={{ cursor: 'pointer', '&:hover .n': { color: 'var(--rl-accent)' } }}
          >
            <Typography className="n" sx={{ color: 'var(--rl-cream)', fontWeight: 700, fontSize: '1.1rem' }}>
              {profileUser.following?.length || 0}
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.72rem' }}>Following</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 700, fontSize: '1.1rem' }}>
              {rankings.length}
            </Typography>
            <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.72rem' }}>Ranked</Typography>
          </Box>
        </Box>

        {!isOwnProfile && isAuthenticated && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={isFollowing ? 'outlined' : 'contained'}
              startIcon={isFollowing ? <PersonRemove sx={{ fontSize: '1rem !important' }} /> : <PersonAdd sx={{ fontSize: '1rem !important' }} />}
              onClick={handleFollow}
              sx={isFollowing ? socialGhostBtn : socialAccentBtn}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
            <Button
              variant="outlined"
              component={Link}
              to={`/taste-match/${userId}`}
              sx={socialGhostBtn}
            >
              Compare taste
            </Button>
          </Box>
        )}

        {isOwnProfile && tasteProfile && (
          <Box sx={{ ...socialCardSx, p: 2, mt: 2.5, textAlign: 'left', maxWidth: 440, mx: 'auto' }}>
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
                color: 'var(--rl-accent)',
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Your taste · {tasteProfile.totalRanked} ranked
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 1 }}>
              {(tasteProfile.topGenres || []).map((g) => (
                <Chip
                  key={g.name}
                  label={g.name}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    bgcolor: 'rgba(212,160,23,0.1)',
                    color: 'var(--rl-accent)',
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {(tasteProfile.topDecades || []).map((d) => (
                <Chip
                  key={d.decade}
                  label={`${d.decade}s`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    borderColor: 'rgba(244,239,230,0.15)',
                    color: 'var(--rl-muted)',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {loadingRankings ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
        </Box>
      ) : rankings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <MovieIcon sx={{ fontSize: 40, color: 'rgba(244,239,230,0.2)', mb: 1 }} />
          <Typography sx={{ color: 'var(--rl-cream)', fontWeight: 600, mb: 0.5 }}>
            No rankings yet
          </Typography>
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.88rem' }}>
            This user hasn’t ranked any movies.
          </Typography>
        </Box>
      ) : (
        <Box>
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '1.35rem',
              letterSpacing: '0.04em',
              color: 'var(--rl-cream)',
              mb: 1.5,
              textAlign: 'center',
            }}
          >
            Rankings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {rankings.map((ranking, index) => (
              <Box
                key={ranking.id}
                component={Link}
                to={`/movie/${ranking.id}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  py: 1,
                  px: 1,
                  borderRadius: 0.75,
                  textDecoration: 'none',
                  '&:hover': { backgroundColor: 'rgba(244,239,230,0.04)' },
                  '&:hover .title': { color: 'var(--rl-accent)' },
                }}
              >
                <Typography
                  sx={{
                    width: 32,
                    flexShrink: 0,
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '1.2rem',
                    color: rankColor(index),
                  }}
                >
                  #{index + 1}
                </Typography>
                <Avatar
                  variant="rounded"
                  src={ranking.posterUrl || undefined}
                  sx={{ width: 40, height: 60, borderRadius: '3px', flexShrink: 0 }}
                />
                <Typography
                  className="title"
                  sx={{
                    color: 'var(--rl-cream)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {ranking.title}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </SocialPageShell>
  );
};

export default Profile;
