import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import api from '../config/axios';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';

const TARGET = 5;

const Onboarding = () => {
  const navigate = useNavigate();
  const { rawRatings } = useRatings();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingMovie, setRatingMovie] = useState(null);

  const rankedCount = rawRatings.length;
  const done = rankedCount >= TARGET;

  useEffect(() => {
    if (done) {
      localStorage.setItem('onboardingComplete', '1');
    }
  }, [done]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/movies/trending/week');
        setMovies((res.data?.results || []).slice(0, 12));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const progress = useMemo(() => Math.min(100, (rankedCount / TARGET) * 100), [rankedCount]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0c0b0a', pb: 8 }}>
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <Typography sx={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: { xs: '2.4rem', sm: '3.2rem' }, color: 'var(--rl-cream)', letterSpacing: '0.04em', lineHeight: 1 }}>
          Rank {TARGET} films you love
        </Typography>
        <Typography sx={{ color: 'var(--rl-muted)', mt: 1, mb: 2, maxWidth: 480 }}>
          Comparisons build your personal order — this is how ReelList learns your taste.
        </Typography>
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ color: 'var(--rl-accent)', fontWeight: 700 }}>{rankedCount} / {TARGET}</Typography>
          {done && <Typography sx={{ color: 'var(--rl-cream)' }}>Nice. You’re ready.</Typography>}
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mb: 4,
            height: 8,
            borderRadius: 1,
            bgcolor: 'rgba(244,239,230,0.08)',
            '& .MuiLinearProgress-bar': { bgcolor: 'var(--rl-accent)' },
          }}
        />

        {done ? (
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ backgroundImage: 'none', backgroundColor: 'var(--rl-accent)', color: '#140f0a', mb: 4 }}
          >
            Go to home
          </Button>
        ) : (
          <Button component={Link} to="/search" sx={{ color: 'var(--rl-muted)', textTransform: 'none', mb: 3, px: 0 }}>
            Or search any movie →
          </Button>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={2}>
            {movies.map((m) => {
              const already = rawRatings.some((r) => String(r.id) === String(m.id));
              return (
                <Grid item xs={6} sm={4} md={3} key={m.id}>
                  <Card sx={{ bgcolor: 'rgba(244,239,230,0.04)', border: '1px solid rgba(244,239,230,0.08)', borderRadius: '6px', opacity: already ? 0.45 : 1 }}>
                    <CardActionArea
                      disabled={already || done}
                      onClick={() => setRatingMovie({
                        id: m.id,
                        title: m.title,
                        posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
                        releaseDate: m.release_date,
                        genres: m.genre_ids,
                      })}
                    >
                      <CardMedia
                        component="img"
                        image={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : '/placeholder-movie.jpg'}
                        alt={m.title}
                        sx={{ aspectRatio: '2/3' }}
                      />
                      <Typography sx={{ p: 1, fontSize: '0.8rem', color: 'var(--rl-cream)', minHeight: 48 }}>
                        {already ? 'Ranked' : m.title}
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {ratingMovie && (
        <RatingModal
          open={!!ratingMovie}
          movie={ratingMovie}
          onClose={() => setRatingMovie(null)}
          onComplete={() => setRatingMovie(null)}
          allowRerate={false}
        />
      )}
    </Box>
  );
};

export default Onboarding;
