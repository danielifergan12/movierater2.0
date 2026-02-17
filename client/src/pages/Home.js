import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Rating,
  CircularProgress
} from '@mui/material';
import { useMovies } from '../contexts/MovieContext';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { trendingMovies, getTrendingMovies, loading } = useMovies();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      getTrendingMovies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  

  const MovieCard = ({ movie }) => (
    <Card sx={{ 
      maxWidth: 300, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'rgba(26, 26, 26, 0.8)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 212, 255, 0.2)',
      borderRadius: 4,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 20px 40px rgba(0, 212, 255, 0.3)',
        border: '1px solid rgba(0, 212, 255, 0.5)',
      }
    }}>
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="400"
          image={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
          alt={movie.title}
          sx={{ 
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        />
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          '&:hover': {
            opacity: 1,
          }
        }} />
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography gutterBottom variant="h6" component="h2" sx={{ 
          fontWeight: 600,
          color: '#ffffff',
          mb: 1,
        }}>
          {movie.title}
        </Typography>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.6)',
          mb: 2,
          fontSize: '0.9rem',
        }}>
          {new Date(movie.release_date).getFullYear()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Rating
            value={movie.vote_average / 2}
            precision={0.1}
            size="small"
            readOnly
            sx={{
              '& .MuiRating-iconFilled': {
                color: '#00d4ff',
              },
              '& .MuiRating-iconEmpty': {
                color: 'rgba(0, 212, 255, 0.3)',
              },
            }}
          />
          <Typography variant="body2" sx={{ 
            ml: 1,
            color: '#00d4ff',
            fontWeight: 600,
          }}>
            {movie.vote_average.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {movie.overview}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 3, pt: 0 }}>
        <Button
          size="small"
          component={Link}
          to={`/movie/${movie.id}`}
          variant="contained"
          fullWidth
          sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            borderRadius: 2,
            py: 1,
            fontWeight: 600,
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 1 }}>
        {!isAuthenticated ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 3
          }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/login"
              sx={{ 
                px: 6, 
                py: 2, 
                fontSize: '1.2rem',
                minWidth: 200
              }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/register"
              sx={{ 
                px: 6, 
                py: 2, 
                fontSize: '1.2rem',
                minWidth: 200
              }}
            >
              Sign Up
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 6, textAlign: 'center' }}>
              <Typography variant="h1" component="h1" gutterBottom sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}>
                Welcome to MovieRate
              </Typography>
              <Typography variant="h5" align="center" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 4,
                fontWeight: 300,
              }}>
                Discover, rate, and share your favorite movies with friends
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Chip
                  label="Trending This Week"
                  sx={{ 
                    px: 3,
                    py: 1,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                    color: '#000',
                    border: 'none'
                  }}
                />
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {trendingMovies
                    .slice(0, 8)
                    .map((movie) => (
                      <Grid item xs={6} sm={6} md={3} lg={3} key={movie.id}>
                        <MovieCard movie={movie} />
                      </Grid>
                    ))}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Home;
