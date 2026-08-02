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
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useMovies } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';
import { useRatings } from '../hooks/useRatings';
import RatingModal from '../components/RatingModal';
import LandingHero from '../components/LandingHero';
import api from '../config/axios';

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
  const hasInitialLoad = useRef(false);
  const prevUserIdRef = useRef(null);
  const STORAGE_KEY = 'homeDisplayMovies';

  // Ensure component responds to route changes for proper navigation
  const [, setRouteUpdate] = useState(0);
  useEffect(() => {
    setRouteUpdate(prev => prev + 1);
  }, [location.pathname]);

  // Read tab parameter from URL and set active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const tabValue = parseInt(tabParam);
      if (tabValue === 1 || tabValue === 2) {
        setActiveTab(tabValue);
      }
    }
  }, [searchParams]);

  // Helper functions to manage recently shown movies in localStorage
  const getRecentlyShownMovies = () => {
    try {
      const stored = localStorage.getItem('recentlyShownMovies');
      if (stored) {
        const data = JSON.parse(stored);
        return data.slice(-120);
      }
    } catch (error) {
      console.error('Error reading recently shown movies:', error);
    }
    return [];
  };

  const addToRecentlyShown = (movieIds) => {
    try {
      const current = getRecentlyShownMovies();
      const updated = [...current, ...movieIds];
      const trimmed = updated.slice(-120);
      localStorage.setItem('recentlyShownMovies', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving recently shown movies:', error);
    }
  };

  const loadPersistedMovies = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const movies = JSON.parse(stored);
        if (Array.isArray(movies) && movies.length > 0 && movies[0].id) {
          return movies;
        }
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
      }
    } catch (error) {
      console.error('Error saving persisted movies:', error);
    }
  };

  // Clear persisted movies when user logs out or changes
  useEffect(() => {
    const currentUserId = user?._id || null;
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== currentUserId) {
      localStorage.removeItem(STORAGE_KEY);
      setDisplayMovies([]);
      hasInitialLoad.current = false;
    }
    prevUserIdRef.current = currentUserId;
  }, [user?._id]);

  // Fetch genres list
  useEffect(() => {
    const fetchGenres = async () => {
      setGenresLoading(true);
      try {
        const response = await api.get('/api/movies/genres');
        if (response && response.data) {
          let genresList = null;
          if (response.data.genres && Array.isArray(response.data.genres)) {
            genresList = response.data.genres;
          } else if (Array.isArray(response.data)) {
            genresList = response.data;
          }
          if (genresList && genresList.length > 0) {
            const sorted = [...genresList].sort((a, b) => a.name.localeCompare(b.name));
            setGenres(sorted);
          } else {
            setGenres([]);
          }
        } else {
          setGenres([]);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
        const fallbackGenres = [
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
          { id: 9648, name: 'Mystery' }
        ];
        setGenres(fallbackGenres);
      } finally {
        setGenresLoading(false);
      }
    };
    fetchGenres();
  }, []);

  // Load persisted movies on mount, or fetch if none exist (for authenticated users)
  useEffect(() => {
    if (isAuthenticated && activeTab === 1 && !hasInitialLoad.current) {
      hasInitialLoad.current = true;
      const persistedMovies = loadPersistedMovies();
      if (persistedMovies && persistedMovies.length > 0) {
        const ratedIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
        const filteredPersisted = persistedMovies.filter(movie => 
          movie && movie.id && !ratedIds.has(movie.id.toString())
        );
        if (filteredPersisted.length > 0) {
          setDisplayMovies(filteredPersisted.slice(0, 8));
          return;
        }
      }
      if (displayMovies.length === 0 && recommendedMovies.length === 0 && !loading) {
        const recentlyShown = getRecentlyShownMovies();
        getPersonalRecommendations(false, recentlyShown).then((result) => {
          if (result && result.results && result.results.length > 0) {
            const newMovieIds = result.results
              .slice(0, 8)
              .map(movie => movie.id)
              .filter(Boolean);
            const current = getRecentlyShownMovies();
            const newIds = newMovieIds.filter(id => !current.includes(id.toString()));
            if (newIds.length > 0) {
              addToRecentlyShown(newIds);
            }
          }
        });
      }
    }
  }, [isAuthenticated]);

  // Refresh recommendations when a movie is rated
  useEffect(() => {
    if (isAuthenticated && activeTab === 1 && rawRatings.length > 0) {
      const ratedIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
      const filteredDisplay = displayMovies.filter(movie => 
        movie && movie.id && !ratedIds.has(movie.id.toString())
      );
      if (filteredDisplay.length === 0 && displayMovies.length > 0) {
        localStorage.removeItem(STORAGE_KEY);
        setDisplayMovies([]);
        const timer = setTimeout(() => {
          getPersonalRecommendations();
        }, 1000);
        return () => clearTimeout(timer);
      } else if (filteredDisplay.length < displayMovies.length) {
        setDisplayMovies(filteredDisplay);
        savePersistedMovies(filteredDisplay);
      }
    }
  }, [rawRatings.length, isAuthenticated, activeTab]);

  const handleRatingComplete = () => {
    setRatingMovie(null);
    if (activeTab === 1) {
      setTimeout(() => {
        getPersonalRecommendations();
      }, 500);
    }
  };

  const handleRateClick = (movie) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent('/')}`;
      return;
    }
    setRatingMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'
    });
  };

  const handleRefresh = async () => {
    if (isRefreshing || loading) return;
    setIsRefreshing(true);
    try {
      const currentMovieIds = displayMovies.length > 0 
        ? displayMovies.slice(0, 8).map(movie => movie.id).filter(Boolean)
        : filteredRecommendedMovies.slice(0, 8).map(movie => movie.id).filter(Boolean);
      const recentlyShown = getRecentlyShownMovies();
      const allExcludeIds = [...currentMovieIds, ...recentlyShown];
      const result = await getPersonalRecommendations(true, allExcludeIds);
      if (result && result.results) {
        const newMovieIds = result.results
          .slice(0, 8)
          .map(movie => movie.id)
          .filter(Boolean);
        addToRecentlyShown(newMovieIds);
        const ratedIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
        const newFiltered = result.results.filter(movie => 
          movie && movie.id && !ratedIds.has(movie.id.toString())
        );
        if (newFiltered.length > 0) {
          const moviesToDisplay = newFiltered.slice(0, 8);
          setDisplayMovies(moviesToDisplay);
          savePersistedMovies(moviesToDisplay);
        }
      }
      hasInitialLoad.current = true;
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const ratedMovieIds = new Set(rawRatings.map(r => r.id?.toString()).filter(Boolean));
  const filteredRecommendedMovies = recommendedMovies.filter(movie => 
    movie && movie.id && !ratedMovieIds.has(movie.id.toString())
  );

  useEffect(() => {
    if (activeTab === 1) {
      if (!isRefreshing && filteredRecommendedMovies.length > 0 && displayMovies.length === 0) {
        const persistedMovies = loadPersistedMovies();
        if (!persistedMovies || persistedMovies.length === 0) {
          const moviesToDisplay = filteredRecommendedMovies.slice(0, 8);
          setDisplayMovies(moviesToDisplay);
          savePersistedMovies(moviesToDisplay);
        }
      }
    }
  }, [filteredRecommendedMovies, activeTab, isRefreshing, loading]);

  const MovieCard = ({ movie }) => {
    const isAlreadyRated = rawRatings.some((r) => r.id?.toString() === movie.id?.toString());
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
    const score = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : null;

    return (
      <Box
        sx={{
          minWidth: 0,
          transition: 'transform 0.15s ease',
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-2px)' },
            '& .poster-frame': { borderColor: 'rgba(212, 160, 23, 0.5)' },
            '& .rate-btn': { opacity: 1 },
          },
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
            transition: 'border-color 0.15s ease',
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
          {score && (
            <Box
              sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                px: 0.5,
                py: 0.1,
                borderRadius: 0.5,
                fontSize: '0.62rem',
                fontWeight: 700,
                lineHeight: 1.4,
                color: 'var(--rl-cream)',
                backgroundColor: 'rgba(12, 11, 10, 0.8)',
              }}
            >
              {score}
            </Box>
          )}
          <Button
            className="rate-btn"
            size="small"
            disabled={isAlreadyRated}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isAlreadyRated) handleRateClick(movie);
            }}
            sx={{
              position: 'absolute',
              left: 6,
              right: 6,
              bottom: 6,
              minWidth: 0,
              py: 0.35,
              px: 0.5,
              textTransform: 'none',
              fontSize: '0.68rem',
              fontWeight: 700,
              lineHeight: 1.2,
              borderRadius: 0.75,
              opacity: { xs: isAlreadyRated ? 0.9 : 1, sm: isAlreadyRated ? 0.9 : 0 },
              transition: 'opacity 0.15s ease',
              color: isAlreadyRated ? 'rgba(244,239,230,0.7)' : 'var(--rl-ink)',
              backgroundColor: isAlreadyRated ? 'rgba(12,11,10,0.75)' : 'var(--rl-accent)',
              '&:hover': {
                backgroundColor: isAlreadyRated ? 'rgba(12,11,10,0.85)' : 'var(--rl-accent-hover)',
              },
              '&.Mui-disabled': {
                color: 'rgba(244,239,230,0.7)',
                backgroundColor: 'rgba(12,11,10,0.75)',
              },
            }}
          >
            {isAlreadyRated ? 'Rated' : 'Rate'}
          </Button>
        </Box>

        <Typography
          component={Link}
          to={`/movie/${movie.id}`}
          title={movie.title}
          sx={{
            display: 'block',
            mt: 0.6,
            color: 'var(--rl-cream)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.72rem',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:hover': { color: 'var(--rl-accent)' },
          }}
        >
          {movie.title}
        </Typography>
        {year && (
          <Typography sx={{ color: 'rgba(244,239,230,0.4)', fontSize: '0.65rem', lineHeight: 1.2 }}>
            {year}
          </Typography>
        )}
      </Box>
    );
  };

  const posterGridSx = {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(3, minmax(0, 1fr))',
      sm: 'repeat(4, minmax(0, 1fr))',
      md: 'repeat(6, minmax(0, 1fr))',
    },
    gap: { xs: 1, sm: 1.25 },
  };

  const SuggestionSkeleton = () => (
    <Box sx={posterGridSx}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Box key={i}>
          <Skeleton
            variant="rectangular"
            sx={{
              aspectRatio: '2 / 3',
              width: '100%',
              borderRadius: 1,
              bgcolor: 'rgba(244,239,230,0.06)',
            }}
          />
          <Skeleton width="75%" height={12} sx={{ mt: 0.6, bgcolor: 'rgba(244,239,230,0.06)' }} />
        </Box>
      ))}
    </Box>
  );

  if (!isAuthenticated) {
    return <LandingHero />;
  }

  const moviesToShow = (displayMovies.length > 0 ? displayMovies : filteredRecommendedMovies).slice(0, 8);
  const showEmpty =
    moviesToShow.length === 0 && !loading && displayMovies.length === 0 && filteredRecommendedMovies.length === 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'var(--rl-ink)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          py: { xs: 2.5, sm: 3 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: { xs: '2rem', sm: '2.5rem' },
                letterSpacing: '0.04em',
                color: 'var(--rl-cream)',
                lineHeight: 1,
              }}
            >
              For you
            </Typography>
          </Box>
          <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.85rem' }}>
            From your rankings{user?.username ? ` · ${user.username}` : ''}
          </Typography>
          {rawRatings.length < 5 && (
            <Button
              component={Link}
              to="/onboarding"
              sx={{ color: 'var(--rl-accent)', textTransform: 'none', px: 0, mt: 0.5, fontSize: '0.8rem' }}
            >
              Rank 5 films to sharpen these →
            </Button>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mb: 2.5,
            borderBottom: '1px solid rgba(244, 239, 230, 0.1)',
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
              minHeight: 40,
              '& .MuiTab-root': {
                color: 'rgba(244, 239, 230, 0.55)',
                fontSize: '0.9rem',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 40,
                minWidth: 'auto',
                px: { xs: 1.25, sm: 2 },
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
                mb: 0.5,
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

        {activeTab === 2 ? (
          genresLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress size={28} sx={{ color: 'var(--rl-accent)' }} />
            </Box>
          ) : genres.length === 0 ? (
            <Typography sx={{ color: 'var(--rl-muted)', py: 6, textAlign: 'center' }}>
              Unable to load genres. Try refreshing.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {genres.map((genre) => (
                <Button
                  key={genre.id}
                  onClick={() => navigate(`/genre/${genre.id}?name=${encodeURIComponent(genre.name)}`)}
                  sx={{
                    textTransform: 'none',
                    px: 1.75,
                    py: 0.85,
                    borderRadius: 1,
                    fontSize: '0.875rem',
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
          )
        ) : loading && !isRefreshing && moviesToShow.length === 0 ? (
          <SuggestionSkeleton />
        ) : (
          <Box
            sx={{
              opacity: isRefreshing ? 0.45 : 1,
              transition: 'opacity 0.25s ease',
              position: 'relative',
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
              <Box sx={{ textAlign: 'center', py: { xs: 6, sm: 8 }, maxWidth: 420, mx: 'auto' }}>
                <Typography
                  sx={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '1.6rem',
                    letterSpacing: '0.04em',
                    color: 'var(--rl-cream)',
                    mb: 1,
                  }}
                >
                  {recommendedMovies.length > 0 ? 'All caught up' : 'Start ranking'}
                </Typography>
                <Typography sx={{ color: 'var(--rl-muted)', fontSize: '0.9rem', mb: 2.5 }}>
                  {recommendedMovies.length > 0
                    ? 'You’ve rated these picks. Refresh for a new set.'
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
                    to="/rate"
                    sx={{
                      textTransform: 'none',
                      color: 'var(--rl-ink)',
                      backgroundColor: 'var(--rl-accent)',
                      px: 2.5,
                      '&:hover': { backgroundColor: 'var(--rl-accent-hover)' },
                    }}
                  >
                    Rate movies
                  </Button>
                )}
              </Box>
            ) : (
              <Box sx={posterGridSx}>
                {moviesToShow.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </Box>
            )}
          </Box>
        )}
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
