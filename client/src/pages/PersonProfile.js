import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';
import api from '../config/axios';
import {
  socialPageShellSx,
  socialTitleSx,
  socialSubtitleSx,
  socialAccentBtn,
} from '../components/SocialPageShell';

const PersonProfile = () => {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { rawRatings } = useRatings();
  const [person, setPerson] = useState(null);
  const [acted, setActed] = useState([]);
  const [directed, setDirected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [ratingMovie, setRatingMovie] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      setBioExpanded(false);
      try {
        const res = await api.get(`/api/movies/person/${personId}/movies`);
        if (cancelled) return;
        setPerson(res.data.person || null);
        const nextActed = res.data.acted || [];
        const nextDirected = res.data.directed || [];
        setActed(nextActed);
        setDirected(nextDirected);
        if (nextDirected.length && nextActed.length) setTab('all');
        else if (nextDirected.length) setTab('directed');
        else if (nextActed.length) setTab('acted');
        else setTab('all');
      } catch (e) {
        console.error('Person profile error:', e);
        if (!cancelled) {
          setPerson(null);
          setError(e.response?.data?.message || 'Could not load this profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [personId]);

  const movies = useMemo(() => {
    if (tab === 'directed') return directed;
    if (tab === 'acted') return acted;
    const byId = new Map();
    [...directed, ...acted].forEach((m) => {
      if (!byId.has(m.id)) byId.set(m.id, m);
    });
    return [...byId.values()].sort((a, b) => {
      if ((b.vote_count || 0) !== (a.vote_count || 0)) return (b.vote_count || 0) - (a.vote_count || 0);
      return (b.popularity || 0) - (a.popularity || 0);
    });
  }, [tab, acted, directed]);

  const handleRateClick = (movie) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/person/${personId}`)}`;
      return;
    }
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : '/placeholder-movie.jpg',
      releaseDate: movie.release_date || null,
    });
  };

  if (loading) {
    return (
      <Box sx={{ ...socialPageShellSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'var(--rl-accent)' }} />
      </Box>
    );
  }

  if (!person) {
    return (
      <Box sx={{ ...socialPageShellSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography sx={{ ...socialTitleSx, fontSize: '1.6rem', mb: 1 }}>
            {error || 'Person not found'}
          </Typography>
          <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} sx={socialAccentBtn}>
            Go back
          </Button>
        </Container>
      </Box>
    );
  }

  const bio = person.biography || '';
  const shortBio = bio.length > 420 && !bioExpanded ? `${bio.slice(0, 420).trim()}…` : bio;
  const metaBits = [
    person.role,
    person.birthday
      ? `Born ${new Date(`${person.birthday}T00:00:00`).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}`
      : null,
    person.place_of_birth,
  ].filter(Boolean);

  const tabs = [
    { id: 'all', label: 'All', count: new Set([...acted, ...directed].map((m) => m.id)).size },
    directed.length > 0 ? { id: 'directed', label: 'Directed', count: directed.length } : null,
    acted.length > 0 ? { id: 'acted', label: 'Acted', count: acted.length } : null,
  ].filter(Boolean);

  return (
    <Box sx={socialPageShellSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 2.5, sm: 4 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{
            color: 'var(--rl-muted)',
            mb: 1.5,
            '&:hover': { color: 'var(--rl-cream)', backgroundColor: 'rgba(244,239,230,0.06)' },
          }}
          aria-label="Back"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 3 },
            alignItems: { xs: 'center', sm: 'flex-start' },
            mb: { xs: 2.5, sm: 3.5 },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Avatar
            src={person.profile_path ? `https://image.tmdb.org/t/p/w342${person.profile_path}` : undefined}
            alt={person.name}
            sx={{
              width: { xs: 120, sm: 148 },
              height: { xs: 120, sm: 148 },
              border: '1px solid rgba(244,239,230,0.14)',
              bgcolor: 'rgba(244,239,230,0.06)',
              flexShrink: 0,
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            }}
          >
            <PersonIcon sx={{ fontSize: 48, color: 'var(--rl-muted)' }} />
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...socialTitleSx, fontSize: { xs: '2rem', sm: '2.6rem' } }}>
              {person.name}
            </Typography>
            <Typography sx={{ ...socialSubtitleSx, mt: 0.75 }}>
              {metaBits.join(' · ')}
            </Typography>
            {(acted.length > 0 || directed.length > 0) && (
              <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.8rem', mt: 0.5 }}>
                {[
                  directed.length ? `${directed.length} directed` : null,
                  acted.length ? `${acted.length} acted` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            )}
            {bio ? (
              <Box sx={{ mt: 1.75, maxWidth: 720, mx: { xs: 'auto', sm: 0 } }}>
                <Typography
                  sx={{
                    color: 'rgba(244,239,230,0.78)',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {shortBio}
                </Typography>
                {bio.length > 420 && (
                  <Button
                    onClick={() => setBioExpanded((v) => !v)}
                    sx={{
                      mt: 0.5,
                      px: 0,
                      minWidth: 0,
                      textTransform: 'none',
                      color: 'var(--rl-accent)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'transparent', color: 'var(--rl-accent-hover)' },
                    }}
                  >
                    {bioExpanded ? 'Show less' : 'Read more'}
                  </Button>
                )}
              </Box>
            ) : null}
          </Box>
        </Box>

        {tabs.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mb: 2.5,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-start' },
            }}
          >
            {tabs.map((t) => (
              <Chip
                key={t.id}
                label={`${t.label} (${t.count})`}
                onClick={() => setTab(t.id)}
                sx={{
                  height: 30,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  bgcolor: tab === t.id ? 'rgba(212,160,23,0.22)' : 'rgba(244,239,230,0.04)',
                  color: tab === t.id ? 'var(--rl-accent)' : 'var(--rl-muted)',
                  border: `1px solid ${tab === t.id ? 'rgba(212,160,23,0.45)' : 'rgba(244,239,230,0.1)'}`,
                  '&:hover': {
                    bgcolor: tab === t.id ? 'rgba(212,160,23,0.28)' : 'rgba(244,239,230,0.08)',
                  },
                }}
              />
            ))}
          </Box>
        )}

        {movies.length === 0 ? (
          <Typography sx={{ color: 'var(--rl-muted)', textAlign: 'center', py: 8 }}>
            No movies found for this person.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(3, minmax(0, 1fr))',
                sm: 'repeat(4, minmax(0, 1fr))',
                md: 'repeat(5, minmax(0, 1fr))',
                lg: 'repeat(6, minmax(0, 1fr))',
              },
              gap: { xs: 1, sm: 1.25, md: 1.5 },
              maxWidth: 1100,
            }}
          >
            {movies.map((movie) => {
              const isAlreadyRated = rawRatings.some((r) => String(r.id) === String(movie.id));
              const year = movie.release_date ? String(movie.release_date).slice(0, 4) : null;

              return (
                <Box
                  key={`${tab}-${movie.id}`}
                  sx={{
                    minWidth: 0,
                    width: '100%',
                    '&:hover .action-btn': { opacity: 1 },
                    '&:hover .poster-frame': { borderColor: 'rgba(212, 160, 23, 0.55)' },
                    '&:hover .title': { color: 'var(--rl-accent)' },
                  }}
                >
                  <Box
                    className="poster-frame"
                    sx={{
                      position: 'relative',
                      aspectRatio: '2 / 3',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid rgba(244, 239, 230, 0.12)',
                      backgroundColor: 'rgba(244, 239, 230, 0.04)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                      transition: 'border-color 0.15s ease, transform 0.15s ease',
                      '&:hover': {
                        transform: { xs: 'none', sm: 'translateY(-2px)' },
                      },
                    }}
                  >
                    <Box
                      component={Link}
                      to={`/movie/${movie.id}`}
                      sx={{ display: 'block', width: '100%', height: '100%' }}
                    >
                      <Box
                        component="img"
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                            : '/placeholder-movie.jpg'
                        }
                        alt={movie.title}
                        loading="lazy"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </Box>

                    {movie.vote_average > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 5,
                          left: 5,
                          px: 0.65,
                          py: 0.15,
                          borderRadius: 0.75,
                          bgcolor: 'rgba(12,11,10,0.78)',
                          color: 'var(--rl-cream)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.35,
                        }}
                      >
                        <StarIcon sx={{ fontSize: 11, color: 'var(--rl-accent)' }} />
                        {Number(movie.vote_average).toFixed(1)}
                      </Box>
                    )}

                    <Button
                      className="action-btn"
                      size="small"
                      onClick={() => handleRateClick(movie)}
                      disabled={isAlreadyRated}
                      sx={{
                        position: 'absolute',
                        left: 6,
                        right: 6,
                        bottom: 6,
                        opacity: { xs: 1, sm: 0 },
                        transition: 'opacity 0.15s ease',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        py: 0.35,
                        minHeight: 0,
                        bgcolor: isAlreadyRated ? 'rgba(12,11,10,0.72)' : 'var(--rl-accent)',
                        color: isAlreadyRated ? 'var(--rl-muted)' : 'var(--rl-ink)',
                        border: isAlreadyRated ? '1px solid rgba(244,239,230,0.2)' : 'none',
                        '&:hover': {
                          bgcolor: isAlreadyRated ? 'rgba(12,11,10,0.8)' : 'var(--rl-accent-hover)',
                        },
                      }}
                    >
                      {isAlreadyRated ? 'Ranked' : 'Rank'}
                    </Button>
                  </Box>

                  <Typography
                    className="title"
                    component={Link}
                    to={`/movie/${movie.id}`}
                    sx={{
                      display: 'block',
                      mt: 0.75,
                      color: 'var(--rl-cream)',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      lineHeight: 1.25,
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {movie.title}
                  </Typography>
                  <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.68rem', mt: 0.2 }}>
                    {[year, movie.credit].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>

      {ratingMovie && (
        <RatingModal
          open={!!ratingMovie}
          movie={ratingMovie}
          onClose={() => setRatingMovie(null)}
          onComplete={() => setRatingMovie(null)}
        />
      )}
    </Box>
  );
};

export default PersonProfile;
