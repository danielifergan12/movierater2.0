import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Grid,
  Avatar,
  Button,
  CircularProgress,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Movie as MovieIcon
} from '@mui/icons-material';
import api from '../config/axios';

const DiscoverUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDiscoverMode, setIsDiscoverMode] = useState(true);
  const navigate = useNavigate();

  // Fetch discover users on mount
  useEffect(() => {
    fetchDiscoverUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDiscoverUsers = async () => {
    setLoading(true);
    setIsDiscoverMode(true);
    setHasSearched(false);
    try {
      const response = await api.get('/api/users/discover');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching discover users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (query) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (query.trim().length >= 2) {
            setLoading(true);
            setHasSearched(true);
            setIsDiscoverMode(false);
            try {
              const response = await api.get(`/api/users/search/${encodeURIComponent(query.trim())}`);
              setUsers(response.data.users || []);
            } catch (error) {
              console.error('Error searching users:', error);
              setUsers([]);
            } finally {
              setLoading(false);
            }
          } else if (query.trim().length === 0) {
            // If search is cleared, go back to discover mode
            fetchDiscoverUsers();
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, debouncedSearch]);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };


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
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
          <Typography variant="h2" gutterBottom sx={{
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            Discover Users
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Discover users and view their movie rankings
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          <TextField
            fullWidth
            placeholder="Search by username (or browse below)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(26, 26, 26, 0.8)',
                color: '#ffffff',
                borderRadius: 3,
                '& fieldset': {
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 212, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00d4ff',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#00d4ff' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#00d4ff' }} />
          </Box>
        )}

        {/* Results */}
        {!loading && users.length > 0 && (
          <>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {isDiscoverMode 
                ? `Discover ${users.length} user${users.length !== 1 ? 's' : ''} with ratings`
                : `Found ${users.length} user${users.length !== 1 ? 's' : ''}`
              }
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {users.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user._id}>
                  <Card
                    sx={{
                      background: 'rgba(26, 26, 26, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0, 212, 255, 0.3)',
                        borderColor: 'rgba(0, 212, 255, 0.4)',
                      }
                    }}
                    onClick={() => handleUserClick(user._id)}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                      <Avatar
                        src={user.profilePicture}
                        sx={{
                          width: { xs: 60, sm: 80 },
                          height: { xs: 60, sm: 80 },
                          mx: 'auto',
                          mb: 2,
                          backgroundColor: 'rgba(0, 212, 255, 0.2)',
                          fontSize: { xs: '1.5rem', sm: '2rem' }
                        }}
                      >
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                      
                      <Typography variant="h6" sx={{ 
                        color: '#ffffff', 
                        mb: 1,
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}>
                        {user.username || 'Anonymous'}
                      </Typography>

                      {user.bio && (
                        <Typography variant="body2" sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          mb: 2,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {user.bio}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${user.ratingsCount || user.ratings?.length || 0} ratings`}
                          size="small"
                          icon={<MovieIcon sx={{ color: '#00d4ff' }} />}
                          sx={{
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                            color: '#00d4ff',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        />
                        <Chip
                          label={`${user.followers?.length || 0} followers`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                            color: '#00d4ff',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        />
                        <Chip
                          label={`${user.following?.length || 0} following`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            color: '#ff6b35',
                            border: '1px solid rgba(255, 107, 53, 0.3)',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        />
                      </Box>

                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          borderColor: '#00d4ff',
                          color: '#00d4ff',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          py: { xs: 0.75, sm: 1 },
                          '&:hover': {
                            borderColor: '#66e0ff',
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          },
                        }}
                      >
                        View Rankings
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* No Results State */}
        {!loading && hasSearched && users.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
              No users found
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Try searching with a different username
            </Typography>
          </Box>
        )}

        {/* Loading State for Initial Load */}
        {loading && users.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#00d4ff' }} />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default DiscoverUsers;

