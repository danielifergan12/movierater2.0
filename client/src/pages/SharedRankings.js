import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Movie as MovieIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { publicApi } from '../config/axios';

const SharedRankings = () => {
  const { shareCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sharedData, setSharedData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSharedRankings = async () => {
      try {
        setLoading(true);
        const response = await publicApi.get(`/api/share/${shareCode}`);
        setSharedData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching shared rankings:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('This share link is invalid or has expired.');
        } else {
          setError(err.response?.data?.message || 'Failed to load shared rankings');
        }
        setSharedData(null);
      } finally {
        setLoading(false);
      }
    };

    if (shareCode) {
      fetchSharedRankings();
    }
  }, [shareCode]);

  const ratings = sharedData?.ratings || [];
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const withRanks = ratings.map((r, index) => ({ ...r, rankNumber: index + 1 }));
    if (!q) return withRanks;
    return withRanks.filter((r) => r.title?.toLowerCase().includes(q));
  }, [ratings, searchQuery]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0c0b0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'var(--rl-accent)' }} />
      </Box>
    );
  }

  if (error || !sharedData) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0c0b0a', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: 'var(--rl-cream)', mb: 2 }}>Share link not found</Typography>
          <Alert severity="error" sx={{ mb: 3 }}>{error || 'This share link does not exist.'}</Alert>
          <Button component={Link} to="/" variant="contained" sx={{ backgroundImage: 'none', backgroundColor: 'var(--rl-accent)', color: '#140f0a' }}>
            Go home
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0c0b0a', pb: 8 }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 }, px: { xs: 2, sm: 3 } }}>
        <Typography sx={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: { xs: '2.2rem', sm: '3rem' }, letterSpacing: '0.04em', color: 'var(--rl-cream)', lineHeight: 1 }}>
          {sharedData.username}'s Rankings
        </Typography>
        <Typography sx={{ color: 'var(--rl-muted)', mt: 0.5, mb: 3 }}>
          {ratings.length} movies · ordered by preference
        </Typography>

        {ratings.length === 0 ? (
          <Typography sx={{ color: 'var(--rl-muted)' }}>No movies ranked yet.</Typography>
        ) : (
          <>
            <TextField
              fullWidth
              size="small"
              placeholder="Search this list"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--rl-muted)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(244,239,230,0.04)', borderRadius: '4px' } }}
            />

            {filtered.length === 0 ? (
              <Typography sx={{ color: 'var(--rl-muted)' }}>No matches.</Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {filtered.map((ranking) => (
                  <ListItem key={ranking.id} sx={{ px: 0, py: 1.25 }}>
                    <Typography sx={{ width: 40, fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.35rem', color: 'var(--rl-accent)', mr: 1.5 }}>
                      #{ranking.rankNumber}
                    </Typography>
                    <ListItemAvatar sx={{ minWidth: 56 }}>
                      <Avatar
                        variant="rounded"
                        src={ranking.posterUrl || undefined}
                        component={Link}
                        to={`/movie/${ranking.id}`}
                        sx={{ width: 44, height: 66, borderRadius: '3px' }}
                      >
                        <MovieIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography component={Link} to={`/movie/${ranking.id}`} sx={{ color: 'var(--rl-cream)', textDecoration: 'none', fontWeight: 600 }}>
                          {ranking.title}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default SharedRankings;
