import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BookmarkBorder as BookmarkIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';
import LandingHero from '../components/LandingHero';
import CinemaScreen from '../components/CinemaScreen';
import api from '../config/axios';

const SUGGESTION_COUNT = 12;
const STORAGE_KEY = 'homeDisplayMovies';
const DISMISSED_KEY = 'dismissedSuggestionMovies';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { recommendedMovies, getPersonalRecommendations, loading } = useMovies();
  const { isAuthenticated, user } = useAuth();
  const { rawRatings } = useRatings();
  const [activeTab, setActiveTab] = useState(1);
  const [ratingMovie, setRatingMovie] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayMovies, setDisplayMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const [watchlistBusyId, setWatchlistBusyId] = useState(null);
  const hasInitialLoad = useRef(false);
  const prevUserIdRef = useRef(null);
  const fillAttemptRef = useRef(0);

  const [, setRouteUpdate] = useState(0);
  useEffect(() => {
    setRouteUpdate((prev) => prev + 1);
  }, [location.pathname]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const tabValue = parseInt(tabParam, 10);
      if (tabValue === 1 || tabValue === 2) setActiveTab(tabValue);
    }
  }, [searchParams]);

  const getRecentlyShownMovies = () => {
    try {
      const stored = localStorage.getItem('recentlyShownMovies');
      if (stored) return JSON.parse(stored).slice(-120);
    } catch (error) {
      console.error('Error reading recently shown movies:', error);
    }
    return [];
  };

  const addToRecentlyShown = (movieIds) => {
    try {
      const updated = [...getRecentlyShownMovies(), ...movieIds].slice(-120);
      localStorage.setItem('recentlyShownMovies', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recently shown movies:', error);
    }
  };

  const getDismissedIds = () => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return new Set((Array.isArray(data) ? data : []).map(String));
      }
    } catch (error) {
      console.error('Error reading dismissed movies:', error);
    }
    return new Set();
  };

  const addDismissedId = (movieId) => {
    try {
      const next = [...getDismissedIds(), String(movieId)].slice(-300);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Error saving dismissed movie:', error);
    }
  };

  const loadPersistedMovies = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const movies = JSON.parse(stored);
        if (Array.isArray(movies) && movies.length > 0 && movies[0].id) return movies;
      }
    } catch (error) {
      console.error('Error loading persisted movies:', error);
    }
    return null;
  };

  const savePersistedMovies = (movies) => {
    try {
      if (movies && movies.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving persisted movies:', error);
    }
  };

  const ratedMovieIds = new Set(rawRatings.map((r) => r.id?.toString()).filter(Boolean));

  const isBlocked = (movie, dismissed = getDismissedIds()) => {
    if (!movie?.id) return true;
    const id = movie.id.toString();
    return ratedMovieIds.has(id) || dismissed.has(id);
  };

  const filterCandidates = (movies) => {
    const dismissed = getDismissedIds();
    return (movies || []).filter((movie) => !isBlocked(movie, dismissed));
  };

  useEffect(() => {
    const currentUserId = user?._id || null;
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== currentUserId) {
      localStorage.removeItem(STORAGE_KEY);
      setDisplayMovies([]);
      hasInitialLoad.current = false;
    }
    prevUserIdRef.current = currentUserId;
  }, [user?._id]);

  useEffect(() => {
    const fetchGenres = async () => {
      setGenresLoading(true);
      try {
        const response = await api.get('/api/movies/genres');
        let genresList = null;
        if (response?.data?.genres && Array.isArray(response.data.genres)) {
          genresList = response.data.genres;
        } else if (Array.isArray(response?.data)) {
          genresList = response.data;
        }
        if (genresList?.length) {
          setGenres([...genresList].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          setGenres([]);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
        setGenres([
          { id: 28, name: 'Action' },
          { id: 35, name: 'Comedy' },
          { id: 18, name: 'Drama' },
          { id: 27, name: 'Horror' },
          { id: 10749, name: 'Romance' },
          { id: 878, name: 'Science Fiction' },
          { id: 53, name: 'Thriller' },
          { id: 12, name: 'Adventure' },
          { id: 16, name: 'Animation' },
          { id: 80, name: 'Crime' },
          { id: 14, name: 'Fantasy' },
          { id: 9648, name: 'Mystery' },
        ]);
      } finally {
        setGenresLoading(false);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 1 && !hasInitialLoad.current) {
      hasInitialLoad.current = true;
      const persistedMovies = loadPersistedMovies();
      if (persistedMovies?.length) {
        const filteredPersisted = filterCandidates(persistedMovies);
        if (filteredPersisted.length > 0) {
          setDisplayMovies(filteredPersisted.slice(0, SUGGESTION_COUNT));
          return;
        }
      }
      if (displayMovies.length === 0 && recommendedMovies.length === 0 && !loading) {
        const exclude = [...getRecentlyShownMovies(), ...getDismissedIds()];
        getPersonalRecommendations(false, exclude).then((result) => {
          if (result?.results?.length) {
            const ids = result.results.slice(0, SUGGESTION_COUNT).map((m) => m.id).filter(Boolean);
            addToRecentlyShown(ids);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Keep shelf free of newly rated movies
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 1 || displayMovies.length === 0) return;
    const next = filterCandidates(displayMovies);
    if (next.length !== displayMovies.length) {
      setDisplayMovies(next);
      savePersistedMovies(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRatings.length, isAuthenticated, activeTab]);

  const filteredRecommendedMovies = filterCandidates(recommendedMovies);

  const mergeIntoShelf = (current, incoming) => {
    const present = new Set(current.map((m) => m.id?.toString()));
    const merged = [...current];
    for (const movie of incoming || []) {
      if (merged.length >= SUGGESTION_COUNT) break;
      const id = movie?.id?.toString();
      if (!id || present.has(id) || isBlocked(movie)) continue;
      present.add(id);
      merged.push(movie);
    }
    return merged.slice(0, SUGGESTION_COUNT);
  };

  useEffect(() => {
    if (activeTab !== 1 || isRefreshing) return;
    if (displayMovies.length > 0) return;
    if (filteredRecommendedMovies.length === 0) return;
    const persistedMovies = loadPersistedMovies();
    if (persistedMovies?.length) return;
    const moviesToDisplay = filteredRecommendedMovies.slice(0, SUGGESTION_COUNT);
    setDisplayMovies(moviesToDisplay);
    savePersistedMovies(moviesToDisplay);
  }, [filteredRecommendedMovies, activeTab, isRefreshing, loading, displayMovies.length]);

  // Keep the shelf full (2x6) whenever it drops below 12
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 1) return;
    if (loading || isRefreshing) return;
    if (displayMovies.length >= SUGGESTION_COUNT) {
      fillAttemptRef.current = 0;
      return;
    }

    const topped = mergeIntoShelf(displayMovies, filteredRecommendedMovies);
    if (topped.length > displayMovies.length) {
      setDisplayMovies(topped);
      savePersistedMovies(topped);
      return;
    }

    if (fillAttemptRef.current >= 2) return;
    fillAttemptRef.current += 1;

    let cancelled = false;
    const exclude = [
      ...displayMovies.map((m) => m.id).filter(Boolean),
      ...getRecentlyShownMovies(),
      ...getDismissedIds(),
    ];
    getPersonalRecommendations(true, exclude).then((result) => {
      if (cancelled || !result?.results?.length) return;
      setDisplayMovies((prev) => {
        const next = mergeIntoShelf(prev, filterCandidates(result.results));
        addToRecentlyShown(next.map((m) => m.id).filter(Boolean));
        savePersistedMovies(next);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMovies.length, filteredRecommendedMovies.length, isAuthenticated, activeTab, loading, isRefreshing]);

  const topUpShelf = (current) => mergeIntoShelf(current, filteredRecommendedMovies);

  const removeFromShelf = (movieId, { dismiss = false } = {}) => {
    const id = String(movieId);
    if (dismiss) addDismissedId(id);
    fillAttemptRef.current = 0;
    setDisplayMovies((prev) => {
      const next = topUpShelf(prev.filter((m) => String(m.id) !== id));
      savePersistedMovies(next);
      return next;
    });
  };

  const handleRatingComplete = () => {
    const ratedId = ratingMovie?.id;
    setRatingMovie(null);
    if (ratedId != null) removeFromShelf(ratedId);
  };

  const handleRateClick = (movie) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent('/')}`;
      return;
    }
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : '/placeholder-movie.jpg',
    });
  };

  const handleDismiss = (movie) => {
    removeFromShelf(movie.id, { dismiss: true });
  };

  const handleWatchlist = async (movie) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent('/')}`;
      return;
    }
    const id = movie.id;
    setWatchlistBusyId(id);
    try {
      await api.post('/api/watchlist', {
        movieId: String(id),
        tmdbId: id,
        title: movie.title,
        posterPath: movie.poster_path || '',
        releaseDate: movie.release_date || null,
      });
    } catch (error) {
      const message = error?.response?.data?.message || '';
      if (!message.toLowerCase().includes('already')) {
        console.error('Error adding to watchlist:', error);
      }
    } finally {
      setWatchlistBusyId(null);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing || loading) return;
    setIsRefreshing(true);
    fillAttemptRef.current = 0;
    try {
      const currentIds = (displayMovies.length > 0 ? displayMovies : filteredRecommendedMovies)
        .slice(0, SUGGESTION_COUNT)
        .map((m) => m.id)
        .filter(Boolean);
      const exclude = [...currentIds, ...getRecentlyShownMovies(), ...getDismissedIds()];
      const result = await getPersonalRecommendations(true, exclude);
      if (result?.results) {
        const fresh = filterCandidates(result.results).slice(0, SUGGESTION_COUNT);
        addToRecentlyShown(fresh.map((m) => m.id).filter(Boolean));
        if (fresh.length > 0) {
          setDisplayMovies(fresh);
          savePersistedMovies(fresh);
        }
      }
      hasInitialLoad.current = true;
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const MovieCard = ({ movie }) => {
    const busy = watchlistBusyId === movie.id;

    return (
      <Box
        sx={{
          minWidth: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover .action-btn': { opacity: 1 },
          '&:hover .poster-frame': { borderColor: 'rgba(212, 160, 23, 0.55)' },
        }}
      >
        <Box
          className="poster-frame"
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '2 / 3',
            borderRadius: 1.25,
            overflow: 'hidden',
            border: '1px solid rgba(244, 239, 230, 0.14)',
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
                  ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
                  : '/placeholder-movie.jpg'
              }
              alt={movie.title}
              loading="lazy"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>

          <Tooltip title="Don't show again">
            <IconButton
              className="action-btn"
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDismiss(movie);
              }}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                p: 0.4,
                opacity: { xs: 1, sm: 0.9 },
                color: 'var(--rl-cream)',
                backgroundColor: 'rgba(12,11,10,0.75)',
                '&:hover': { backgroundColor: 'rgba(12,11,10,0.92)', color: '#ff8a80' },
              }}
            >
              <CloseIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add to watchlist">
            <IconButton
              className="action-btn"
              size="small"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleWatchlist(movie);
              }}
              sx={{
                position: 'absolute',
                top: 4,
                left: 4,
                p: 0.4,
                opacity: { xs: 1, sm: 0.9 },
                color: 'var(--rl-accent)',
                backgroundColor: 'rgba(12,11,10,0.75)',
                '&:hover': { backgroundColor: 'rgba(12,11,10,0.92)' },
              }}
            >
              <BookmarkIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>

          <Button
            className="action-btn"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRateClick(movie);
            }}
            sx={{
              position: 'absolute',
              left: 5,
              right: 5,
              bottom: 5,
              minWidth: 0,
              py: 0.35,
              px: 0.5,
              textTransform: 'none',
              fontSize: { xs: '0.6rem', sm: '0.72rem' },
              fontWeight: 700,
              lineHeight: 1.2,
              borderRadius: 0.75,
              color: 'var(--rl-ink)',
              backgroundColor: 'var(--rl-accent)',
              opacity: { xs: 1, sm: 0 },
              transition: 'opacity 0.15s ease',
              '&:hover': { backgroundColor: 'var(--rl-accent-hover)' },
            }}
          >
            Rate
          </Button>
        </Box>

        <Typography
          component={Link}
          to={`/movie/${movie.id}`}
          title={movie.title}
          sx={{
            display: 'block',
            mt: 0.55,
            color: 'var(--rl-cream)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.62rem', sm: '0.75rem' },
            lineHeight: 1.25,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:hover': { color: 'var(--rl-accent)' },
          }}
        >
          {movie.title}
        </Typography>
      </Box>
    );
  };

  const posterGridSx = {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gridTemplateRows: 'repeat(2, auto)',
    columnGap: { xs: 0.75, sm: 1.15 },
    rowGap: { xs: 1, sm: 1.35 },
    width: '100%',
    position: 'relative',
    zIndex: 1,
  };

  const SuggestionSkeleton = () => (
    <CinemaScreen>
      <Box sx={posterGridSx}>
        {Array.from({ length: SUGGESTION_COUNT }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            sx={{
              width: '100%',
              aspectRatio: '2 / 3',
              borderRadius: 1,
              bgcolor: 'rgba(244,239,230,0.08)',
            }}
          />
        ))}
      </Box>
    </CinemaScreen>
  );

  if (!isAuthenticated) {
    return <LandingHero />;
  }

  const moviesToShow = (displayMovies.length > 0 ? displayMovies : filteredRecommendedMovies).slice(
    0,
    SUGGESTION_COUNT
  );
  const showEmpty =
    moviesToShow.length === 0 && !loading && displayMovies.length === 0 && filteredRecommendedMovies.length === 0;

  return (
    <Box
      sx={{
        height: { xs: 'calc(100dvh - 64px)', sm: 'calc(100dvh - 72px)' },
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#0c0b0a',
      }}
    >
      {/* Ambient glow backdrop */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 55% 45% at 50% 42%, rgba(212, 160, 23, 0.22) 0%, transparent 62%),
            radial-gradient(ellipse 40% 35% at 18% 20%, rgba(244, 239, 230, 0.06) 0%, transparent 55%),
            radial-gradient(ellipse 35% 30% at 82% 75%, rgba(212, 160, 23, 0.1) 0%, transparent 60%),
            linear-gradient(180deg, #12100e 0%, #0c0b0a 55%, #090807 100%)
          `,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '50%',
            top: '38%',
            width: '70%',
            height: '55%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(212,160,23,0.18) 0%, transparent 70%)',
            filter: 'blur(28px)',
            animation: 'glowPulse 6s ease-in-out infinite',
          },
          '@keyframes glowPulse': {
            '0%, 100%': { opacity: 0.55, transform: 'translate(-50%, -50%) scale(1)' },
            '50%': { opacity: 0.95, transform: 'translate(-50%, -50%) scale(1.08)' },
          },
        }}
      />
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 1.25, sm: 1.75 },
          px: { xs: 1.5, sm: 3 },
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box sx={{ mb: 1, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: { xs: '1.7rem', sm: '2.1rem' },
                  letterSpacing: '0.04em',
                  color: 'var(--rl-cream)',
                  lineHeight: 1,
                }}
              >
                For you
              </Typography>
              <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.8rem', mt: 0.35 }}>
                From your rankings{user?.username ? ` · ${user.username}` : ''}
              </Typography>
            </Box>
            {rawRatings.length < 5 && (
              <Button
                component={Link}
                to="/onboarding"
                sx={{ color: 'var(--rl-accent)', textTransform: 'none', px: 0, fontSize: '0.75rem', flexShrink: 0 }}
              >
                Rank 5 →
              </Button>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mb: 1.25,
            flexShrink: 0,
            borderBottom: '1px solid rgba(244, 239, 230, 0.14)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => {
              setActiveTab(newValue);
              const next = new URLSearchParams(searchParams);
              next.set('tab', newValue.toString());
              setSearchParams(next);
            }}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                color: 'rgba(244, 239, 230, 0.55)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 36,
                minWidth: 'auto',
                px: { xs: 1, sm: 1.5 },
                '&.Mui-selected': { color: 'var(--rl-cream)' },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'var(--rl-accent)',
                height: 2,
              },
            }}
          >
            <Tab label="Suggested" value={1} />
            <Tab label="Genres" value={2} />
          </Tabs>
          {activeTab === 1 && (
            <IconButton
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              size="small"
              sx={{
                color: 'var(--rl-accent)',
                '&:hover': { backgroundColor: 'rgba(212, 160, 23, 0.1)' },
                '&.Mui-disabled': { color: 'rgba(244, 239, 230, 0.25)' },
                ...(isRefreshing && {
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }),
              }}
              title="Refresh suggestions"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 2 ? (
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pb: 1 }}>
              {genresLoading ? (
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
                </Box>
              ) : genres.length === 0 ? (
                <Typography sx={{ color: 'var(--rl-muted)', py: 4, textAlign: 'center' }}>
                  Unable to load genres. Try refreshing.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {genres.map((genre) => (
                    <Button
                      key={genre.id}
                      onClick={() =>
                        navigate(`/genre/${genre.id}?name=${encodeURIComponent(genre.name)}`)
                      }
                      sx={{
                        textTransform: 'none',
                        px: 1.5,
                        py: 0.7,
                        borderRadius: 1,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--rl-cream)',
                        border: '1px solid rgba(244, 239, 230, 0.14)',
                        backgroundColor: 'rgba(244, 239, 230, 0.03)',
                        '&:hover': {
                          borderColor: 'rgba(212, 160, 23, 0.5)',
                          backgroundColor: 'rgba(212, 160, 23, 0.08)',
                          color: 'var(--rl-accent)',
                        },
                      }}
                    >
                      {genre.name}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          ) : loading && !isRefreshing && moviesToShow.length === 0 ? (
            <SuggestionSkeleton />
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                opacity: isRefreshing ? 0.45 : 1,
                transition: 'opacity 0.25s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {isRefreshing && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
                </Box>
              )}

              {showEmpty ? (
                <CinemaScreen>
                  <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4 }, maxWidth: 360, mx: 'auto', position: 'relative', zIndex: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: '1.4rem',
                        letterSpacing: '0.04em',
                        color: 'var(--rl-cream)',
                        mb: 1,
                      }}
                    >
                      {recommendedMovies.length > 0 ? 'All caught up' : 'Start ranking'}
                    </Typography>
                    <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem', mb: 2 }}>
                      {recommendedMovies.length > 0
                        ? 'Refresh for a new set of picks.'
                        : 'Rate a few films and we’ll suggest similar ones.'}
                    </Typography>
                    {recommendedMovies.length > 0 ? (
                      <Button
                        onClick={handleRefresh}
                        sx={{
                          textTransform: 'none',
                          color: 'var(--rl-ink)',
                          backgroundColor: 'var(--rl-accent)',
                          px: 2.5,
                          '&:hover': { backgroundColor: 'var(--rl-accent-hover)' },
                        }}
                      >
                        Refresh suggestions
                      </Button>
                    ) : (
                      <Button
                        component={Link}
                        to="/search"
                        sx={{
                          textTransform: 'none',
                          color: 'var(--rl-ink)',
                          backgroundColor: 'var(--rl-accent)',
                          px: 2.5,
                          '&:hover': { backgroundColor: 'var(--rl-accent-hover)' },
                        }}
                      >
                        Search movies
                      </Button>
                    )}
                  </Box>
                </CinemaScreen>
              ) : (
                <CinemaScreen>
                  <Box sx={posterGridSx}>
                    {moviesToShow.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </Box>
                </CinemaScreen>
              )}
            </Box>
          )}
        </Box>
      </Container>

      {ratingMovie && (
        <RatingModal
          open={!!ratingMovie}
          movie={ratingMovie}
          onClose={() => setRatingMovie(null)}
          onComplete={handleRatingComplete}
        />
      )}
    </Box>
  );
};

export default Home;
