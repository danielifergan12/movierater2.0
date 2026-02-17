import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination
} from '@mui/material';
import { Person as PersonIcon, Movie as MovieIcon, People as PeopleIcon } from '@mui/icons-material';
import api from '../config/axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/users/admin/all?page=${page}&limit=50`);
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users. You may not have admin access.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

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
            mb: 2,
            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
          }}>
            All Users (Admin)
          </Typography>
          <Typography variant="h6" sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Total Users: {total}
          </Typography>
        </Box>

        {users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PersonIcon sx={{ fontSize: 60, color: '#ff6b35', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#ffffff' }}>
              No users found
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer 
              component={Paper} 
              sx={{
                background: 'rgba(26, 26, 26, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: 4,
                mb: 4
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#00d4ff', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>User</TableCell>
                    <TableCell sx={{ color: '#00d4ff', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>Email</TableCell>
                    <TableCell sx={{ color: '#00d4ff', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' }} align="center">Movies Rated</TableCell>
                    <TableCell sx={{ color: '#00d4ff', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' }} align="center">Followers</TableCell>
                    <TableCell sx={{ color: '#00d4ff', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' }} align="center">Following</TableCell>
                    <TableCell sx={{ color: '#00d4ff', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' }} align="center">Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow 
                      key={user._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 212, 255, 0.05)',
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={user.profilePicture}
                            sx={{
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 },
                              backgroundColor: 'rgba(0, 212, 255, 0.2)',
                            }}
                          >
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="body1" 
                              component={Link}
                              to={`/profile/${user._id}`}
                              sx={{ 
                                color: '#ffffff', 
                                fontWeight: 600,
                                textDecoration: 'none',
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                '&:hover': {
                                  color: '#00d4ff',
                                }
                              }}
                            >
                              {user.username || 'Anonymous'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {user.email}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<MovieIcon />}
                          label={user.ratings?.length || 0}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                            color: '#00d4ff',
                            fontWeight: 'bold',
                            fontSize: { xs: '0.7rem', sm: '0.8rem' }
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<PeopleIcon />}
                          label={user.followers?.length || 0}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            color: '#ff6b35',
                            fontWeight: 'bold',
                            fontSize: { xs: '0.7rem', sm: '0.8rem' }
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={user.following?.length || 0}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            color: '#ff6b35',
                            fontWeight: 'bold',
                            fontSize: { xs: '0.7rem', sm: '0.8rem' }
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size={{ xs: 'small', sm: 'large' }}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#ffffff',
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#00d4ff',
                      color: '#000000',
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default AdminUsers;

