import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CardMedia, Typography, CircularProgress } from '@mui/material';
import { useRatings } from '../hooks/useRatings';
import api from '../config/axios';

const MovieCarousel = ({ onRatingComplete }) => {
  const { rawRatings, upsertAtIndex } = useRatings();
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [zone, setZone] = useState(null); // 'top', 'middle', 'skip', null
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  // Fetch initial movies
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        // Try popular movies first
        const response = await api.get('/api/movies/popular?page=1');
        
        if (response.data && response.data.results && Array.isArray(response.data.results) && response.data.results.length > 0) {
          // Filter out already rated movies
          const ratedIds = new Set(rawRatings.map(r => String(r.id)));
          let filtered = response.data.results
            .filter(movie => movie && movie.id && !ratedIds.has(String(movie.id)))
            .slice(0, 5);
          
          // If all were filtered out, use first 5 anyway (for new users)
          if (filtered.length === 0) {
            filtered = response.data.results.slice(0, 5);
          }
          
          setMovies(filtered);
        } else {
          // Fallback to trending movies
          console.log('Popular movies empty, trying trending...');
          const trendingResponse = await api.get('/api/movies/trending/week');
          if (trendingResponse.data && trendingResponse.data.results && Array.isArray(trendingResponse.data.results)) {
            const ratedIds = new Set(rawRatings.map(r => String(r.id)));
            let filtered = trendingResponse.data.results
              .filter(movie => movie && movie.id && !ratedIds.has(String(movie.id)))
              .slice(0, 5);
            
            if (filtered.length === 0) {
              filtered = trendingResponse.data.results.slice(0, 5);
            }
            
            setMovies(filtered);
          } else {
            setMovies([]);
          }
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        // Try trending as fallback
        try {
          const trendingResponse = await api.get('/api/movies/trending/week');
          if (trendingResponse.data && trendingResponse.data.results && Array.isArray(trendingResponse.data.results)) {
            setMovies(trendingResponse.data.results.slice(0, 5));
          } else {
            setMovies([]);
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setMovies([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []); // Only run once on mount

  // Load more movies when running low
  useEffect(() => {
    if (movies.length > 0 && movies.length - currentIndex < 2 && !loading) {
      const fetchMore = async () => {
        try {
          const page = Math.floor(movies.length / 20) + 1;
          const response = await api.get(`/api/movies/popular?page=${page}`);
          if (response.data && response.data.results) {
            const ratedIds = new Set(rawRatings.map(r => String(r.id)));
            const filtered = response.data.results
              .filter(movie => movie && movie.id && !ratedIds.has(String(movie.id)))
              .slice(0, 5);
            if (filtered.length > 0) {
              setMovies(prev => [...prev, ...filtered]);
            }
          }
        } catch (error) {
          console.error('Error fetching more movies:', error);
        }
      };
      fetchMore();
    }
  }, [currentIndex, movies.length, rawRatings, loading]);

  const currentMovie = movies[currentIndex];

  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragOffset({ x: 0, y: 0 });
    setZone(null);
  };

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging || !dragStart) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });

    // Determine zone based on drag direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > 100 && absX > absY) {
      // Horizontal drag (skip)
      setZone(deltaX < 0 ? 'skip' : null);
    } else if (absY > 100 && absY > absX) {
      // Vertical drag (top or middle)
      setZone(deltaY < 0 ? 'top' : 'middle');
    } else {
      setZone(null);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || !currentMovie) return;

    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);

    if (absX > 100 && absX > absY && dragOffset.x < 0) {
      // Skip - don't rank
      handleSkip();
    } else if (absY > 100 && absY > absX) {
      if (dragOffset.y < 0) {
        // Top tier
        handleRank('top');
      } else {
        // Middle tier
        handleRank('middle');
      }
    }

    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setDragStart(null);
    setZone(null);
  };

  const handleRank = (tier) => {
    if (!currentMovie) return;

    const movie = {
      id: currentMovie.id,
      title: currentMovie.title,
      posterUrl: currentMovie.poster_path
        ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`
        : '/placeholder-movie.jpg',
    };

    // Calculate position based on tier
    let position;
    if (tier === 'top') {
      position = 0; // Insert at top
    } else {
      // Middle - insert at middle of current rankings
      position = Math.floor(rawRatings.length / 2);
    }

    upsertAtIndex(movie, position);
    
    if (onRatingComplete) {
      onRatingComplete();
    }

    // Move to next movie
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleSkip = () => {
    // Just move to next movie without ranking
    setCurrentIndex(prev => prev + 1);
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleDragMove(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches[0]) {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#00d4ff', mb: 2 }} />
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Loading movies...
        </Typography>
      </Box>
    );
  }

  if (!currentMovie || movies.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
          No movies available
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Try refreshing the page
        </Typography>
      </Box>
    );
  }

  const posterUrl = currentMovie.poster_path
    ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`
    : '/placeholder-movie.jpg';

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        mx: 'auto',
        py: 4,
        px: 2,
      }}
    >
      {/* Zone indicators */}
      {isDragging && (
        <>
          {zone === 'top' && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '200px',
                height: '100px',
                border: '3px dashed #00d4ff',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                zIndex: 10,
                animation: 'pulse 1s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.7 },
                  '50%': { opacity: 1 },
                },
              }}
            >
              <Typography
                sx={{
                  color: '#00d4ff',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                TOP
              </Typography>
            </Box>
          )}
          {zone === 'middle' && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '200px',
                height: '100px',
                border: '3px dashed #ff6b35',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                zIndex: 10,
                animation: 'pulse 1s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.7 },
                  '50%': { opacity: 1 },
                },
              }}
            >
              <Typography
                sx={{
                  color: '#ff6b35',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                MIDDLE
              </Typography>
            </Box>
          )}
          {zone === 'skip' && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                transform: 'translateY(-50%)',
                width: '100px',
                height: '200px',
                border: '3px dashed rgba(255, 255, 255, 0.5)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                zIndex: 10,
                animation: 'pulse 1s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.7 },
                  '50%': { opacity: 1 },
                },
              }}
            >
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  transform: 'rotate(-90deg)',
                }}
              >
                SKIP
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Movie card */}
      <Card
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          mx: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: isDragging
            ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`
            : 'translate(0, 0) rotate(0deg)',
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          backgroundColor: 'rgba(26, 26, 26, 0.9)',
          border: '2px solid',
          borderColor: zone
            ? zone === 'top'
              ? '#00d4ff'
              : zone === 'middle'
              ? '#ff6b35'
              : 'rgba(255, 255, 255, 0.5)'
            : 'rgba(0, 212, 255, 0.2)',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: isDragging
            ? '0 20px 60px rgba(0, 0, 0, 0.5)'
            : '0 8px 24px rgba(0, 0, 0, 0.3)',
          userSelect: 'none',
          '&:hover': {
            borderColor: 'rgba(0, 212, 255, 0.5)',
            boxShadow: '0 12px 32px rgba(0, 212, 255, 0.2)',
          },
        }}
      >
        <CardMedia
          component="img"
          image={posterUrl}
          alt={currentMovie.title}
          sx={{
            width: '100%',
            height: { xs: '400px', sm: '500px' },
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 100%)',
            p: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#ffffff',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {currentMovie.title}
          </Typography>
        </Box>
      </Card>

      {/* Instructions hint */}
      {!isDragging && currentIndex === 0 && (
        <Box
          sx={{
            mt: 3,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.875rem',
            }}
          >
            Drag up for Top • Drag down for Middle • Drag left to Skip
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MovieCarousel;

