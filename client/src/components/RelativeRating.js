import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Rating,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import { 
  ThumbUp, 
  ThumbDown, 
  TrendingUp, 
  TrendingDown,
  Star,
  StarBorder
} from '@mui/icons-material';

const RelativeRating = ({ movie, onRatingComplete, userRankings }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [comparisonMovie, setComparisonMovie] = useState(null);
  const [isBetter, setIsBetter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    if (userRankings.length === 0) {
      // First movie - automatically assign rating 10
      setCurrentStep(2); // Skip comparison steps
    } else {
      // Find a random movie to compare with
      const randomIndex = Math.floor(Math.random() * userRankings.length);
      setComparisonMovie(userRankings[randomIndex]);
    }
  }, [userRankings]);

  const handleComparison = (better) => {
    setIsBetter(better);
    setCurrentStep(1);
  };

  const handleConfirmRating = async () => {
    setLoading(true);
    
    try {
      let newRanking;
      
      if (userRankings.length === 0) {
        // First movie gets rating 10
        newRanking = {
          movie,
          rating: 10,
          position: 0,
          dateRated: new Date().toISOString()
        };
      } else {
        // Calculate position based on comparison
        const comparisonIndex = userRankings.findIndex(r => r.movie.id === comparisonMovie.movie.id);
        let newPosition;
        
        if (isBetter) {
          // New movie is better - insert before comparison movie
          newPosition = comparisonIndex;
        } else {
          // New movie is worse - insert after comparison movie
          newPosition = comparisonIndex + 1;
        }
        
        // Calculate rating based on position
        const totalMovies = userRankings.length + 1;
        const rating = Math.max(1, 10 - (newPosition * 8 / totalMovies));
        
        newRanking = {
          movie,
          rating: Math.round(rating * 10) / 10,
          position: newPosition,
          dateRated: new Date().toISOString()
        };
      }
      
      // Save to localStorage
      const updatedRankings = [...userRankings];
      updatedRankings.splice(newRanking.position, 0, newRanking);
      
      // Recalculate positions for all movies
      const finalRankings = updatedRankings.map((ranking, index) => ({
        ...ranking,
        position: index,
        rating: Math.max(1, 10 - (index * 8 / updatedRankings.length))
      }));
      
      localStorage.setItem('userMovieRankings', JSON.stringify(finalRankings));
      
      setShowRanking(true);
      setTimeout(() => {
        onRatingComplete(finalRankings);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}>
              Compare Movies
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}>
              Is <strong>{movie.title}</strong> better or worse than <strong>{comparisonMovie?.movie.title}</strong>?
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ThumbUp />}
                onClick={() => handleComparison(true)}
                sx={{
                  background: 'linear-gradient(45deg, #00d4ff, #66e0ff)',
                  px: 4,
                  py: 2,
                }}
              >
                Better
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<ThumbDown />}
                onClick={() => handleComparison(false)}
                sx={{
                  background: 'linear-gradient(45deg, #ff6b35, #ff8a65)',
                  px: 4,
                  py: 2,
                }}
              >
                Worse
              </Button>
            </Box>

            {/* Show comparison movies */}
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
              <Card sx={{ maxWidth: 200, backgroundColor: 'rgba(0, 212, 255, 0.1)' }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
                  alt={movie.title}
                />
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00d4ff', textAlign: 'center' }}>
                    {movie.title}
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ color: '#ff6b35' }}>
                  VS
                </Typography>
              </Box>

              <Card sx={{ maxWidth: 200, backgroundColor: 'rgba(255, 107, 53, 0.1)' }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={comparisonMovie?.movie.poster_path ? `https://image.tmdb.org/t/p/w500${comparisonMovie.movie.poster_path}` : '/placeholder-movie.jpg'}
                  alt={comparisonMovie?.movie.title}
                />
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#ff6b35', textAlign: 'center' }}>
                    {comparisonMovie?.movie.title}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}>
              Confirm Your Rating
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}>
              You said <strong>{movie.title}</strong> is {isBetter ? 'better' : 'worse'} than <strong>{comparisonMovie?.movie.title}</strong>
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Card sx={{ maxWidth: 300, mx: 'auto', backgroundColor: 'rgba(26, 26, 26, 0.8)' }}>
                <CardMedia
                  component="img"
                  height="400"
                  image={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
                  alt={movie.title}
                />
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                    {movie.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    {new Date(movie.release_date).getFullYear()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Rating
                      value={isBetter ? 4.5 : 3.5}
                      readOnly
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: isBetter ? '#00d4ff' : '#ff6b35',
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1, color: isBetter ? '#00d4ff' : '#ff6b35' }}>
                      {isBetter ? 'Higher' : 'Lower'} Rating
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleConfirmRating}
              disabled={loading}
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Confirm Rating'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}>
              First Movie Rating
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}>
              This is your first movie! It will be your baseline rating of 10/10.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Card sx={{ maxWidth: 300, mx: 'auto', backgroundColor: 'rgba(26, 26, 26, 0.8)' }}>
                <CardMedia
                  component="img"
                  height="400"
                  image={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
                  alt={movie.title}
                />
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                    {movie.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    {new Date(movie.release_date).getFullYear()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Rating
                      value={5}
                      readOnly
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#00d4ff',
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1, color: '#00d4ff' }}>
                      Baseline Rating: 10/10
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleConfirmRating}
              disabled={loading}
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Set as Baseline'}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={true}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 4,
        }
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        {renderStep()}
      </DialogContent>

      {/* Show ranking after rating */}
      <Dialog
        open={showRanking}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Your Movie Rankings
          </Typography>
        </DialogTitle>
        <DialogContent>
          <List>
            {userRankings.slice(0, 5).map((ranking, index) => (
              <ListItem key={ranking.movie.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar
                    src={ranking.movie.poster_path ? `https://image.tmdb.org/t/p/w92${ranking.movie.poster_path}` : null}
                    sx={{ 
                      width: 50, 
                      height: 75,
                      borderRadius: 1,
                    }}
                  >
                    🎬
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      #{index + 1} {ranking.movie.title}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating
                        value={ranking.rating / 2}
                        readOnly
                        size="small"
                        sx={{
                          '& .MuiRating-iconFilled': {
                            color: '#00d4ff',
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#00d4ff' }}>
                        {ranking.rating}/10
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => setShowRanking(false)}
            sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
              px: 4,
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default RelativeRating;

