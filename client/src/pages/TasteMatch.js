import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Box,
  Container,
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
      <Box sx={{ minHeight: '100vh', bgcolor: '#0c0b0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Not found'}</Alert>
      </Container>
    );
  }

  const Section = ({ title, items }) => (
    <Box sx={{ mb: 4 }}>
      <Typography sx={{ color: 'var(--rl-accent)', fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem' }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography sx={{ color: 'var(--rl-muted)' }}>Not enough overlap yet.</Typography>
      ) : (
        <List sx={{ p: 0 }}>
          {items.map((m) => (
            <ListItem key={m.id} sx={{ px: 0 }}>
              <ListItemAvatar>
                <Avatar variant="rounded" src={m.posterUrl || undefined} component={Link} to={`/movie/${m.id}`} sx={{ width: 44, height: 66 }} />
              </ListItemAvatar>
              <ListItemText
                primary={<Typography component={Link} to={`/movie/${m.id}`} sx={{ color: 'var(--rl-cream)', textDecoration: 'none', fontWeight: 600 }}>{m.title}</Typography>}
                secondary={`You #${m.myRank} · Them #${m.theirRank}`}
                secondaryTypographyProps={{ sx: { color: 'var(--rl-muted)' } }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0c0b0a', pb: 8 }}>
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <Typography sx={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: { xs: '2.4rem', sm: '3rem' }, color: 'var(--rl-cream)', letterSpacing: '0.04em' }}>
          Taste match
        </Typography>
        <Typography sx={{ color: 'var(--rl-muted)', mb: 1 }}>
          with <Link to={`/profile/${data.other.userId}`} style={{ color: 'var(--rl-accent)' }}>{data.other.username}</Link>
        </Typography>
        <Typography sx={{ color: 'var(--rl-cream)', fontSize: '2rem', fontWeight: 700, mb: 3 }}>
          {data.overlapPercent}% overlap · {data.sharedCount} shared films
        </Typography>

        <Section title="You agree" items={data.agree} />
        <Section title="You disagree" items={data.disagree} />

        <Button component={Link} to={`/profile/${data.other.userId}`} sx={{ color: 'var(--rl-muted)', textTransform: 'none' }}>
          ← Back to profile
        </Button>
      </Container>
    </Box>
  );
};

export default TasteMatch;
