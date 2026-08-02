import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
} from '@mui/material';
import api from '../config/axios';
import SocialPageShell, {
  socialTitleSx,
  socialSubtitleSx,
  socialGhostBtn,
} from '../components/SocialPageShell';

const TasteMatch = () => {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/users/taste-match/${userId}`);
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Could not compute taste match');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <SocialPageShell>
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
        </Box>
      </SocialPageShell>
    );
  }

  if (error || !data) {
    return (
      <SocialPageShell maxWidth="sm">
        <Alert severity="error" sx={{ bgcolor: 'rgba(229,115,115,0.1)', color: '#ffcdd2' }}>
          {error || 'Not found'}
        </Alert>
      </SocialPageShell>
    );
  }

  const Section = ({ title, items }) => (
    <Box sx={{ mb: 3.5 }}>
      <Typography
        sx={{
          color: 'var(--rl-accent)',
          fontWeight: 700,
          mb: 1.25,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontSize: '0.72rem',
          textAlign: 'center',
        }}
      >
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography sx={{ color: 'var(--rl-muted)', textAlign: 'center', fontSize: '0.88rem' }}>
          Not enough overlap yet.
        </Typography>
      ) : (
        <List sx={{ p: 0 }}>
          {items.map((m) => (
            <ListItem key={m.id} sx={{ px: 0.5, py: 0.85, borderRadius: 0.75, '&:hover': { bgcolor: 'rgba(244,239,230,0.04)' } }}>
              <ListItemAvatar sx={{ minWidth: 56 }}>
                <Avatar
                  variant="rounded"
                  src={m.posterUrl || undefined}
                  component={Link}
                  to={`/movie/${m.id}`}
                  sx={{ width: 40, height: 60, borderRadius: '3px' }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    component={Link}
                    to={`/movie/${m.id}`}
                    sx={{ color: 'var(--rl-cream)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', '&:hover': { color: 'var(--rl-accent)' } }}
                  >
                    {m.title}
                  </Typography>
                }
                secondary={`You #${m.myRank} · Them #${m.theirRank}`}
                secondaryTypographyProps={{ sx: { color: 'var(--rl-muted)', fontSize: '0.75rem' } }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <SocialPageShell maxWidth="sm">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography sx={socialTitleSx}>Taste match</Typography>
        <Typography sx={socialSubtitleSx}>
          with{' '}
          <Link to={`/profile/${data.other.userId}`} style={{ color: 'var(--rl-accent)', textDecoration: 'none' }}>
            {data.other.username}
          </Link>
        </Typography>
        <Typography
          sx={{
            color: 'var(--rl-cream)',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '2.2rem',
            letterSpacing: '0.03em',
            mt: 1.5,
          }}
        >
          {data.overlapPercent}%
        </Typography>
        <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem' }}>
          overlap · {data.sharedCount} shared films
        </Typography>
      </Box>

      <Section title="You agree" items={data.agree} />
      <Section title="You disagree" items={data.disagree} />

      <Box sx={{ textAlign: 'center' }}>
        <Button component={Link} to={`/profile/${data.other.userId}`} sx={{ ...socialGhostBtn, border: 'none' }}>
          ← Back to profile
        </Button>
      </Box>
    </SocialPageShell>
  );
};

export default TasteMatch;
