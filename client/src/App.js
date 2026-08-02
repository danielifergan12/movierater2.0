import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MovieProvider } from './contexts/MovieContext';
import { RatingsProvider } from './hooks/useRatings';
import Navbar from './components/Navbar';
import AnimatedMovieBackground from './components/AnimatedMovieBackground';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MovieDetail from './pages/MovieDetail';
import Feed from './pages/Feed';
import MyRankings from './pages/MyRankings';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleCallback from './pages/GoogleCallback';
import SharedRankings from './pages/SharedRankings';
import DiscoverUsers from './pages/DiscoverUsers';
import FollowingRankings from './pages/FollowingRankings';
import AdminUsers from './pages/AdminUsers';
import Followers from './pages/Followers';
import Following from './pages/Following';
import GenreMovies from './pages/GenreMovies';
import Watchlist from './pages/Watchlist';
import Lists from './pages/Lists';
import CreateList from './pages/CreateList';
import BuildListFrom from './pages/BuildListFrom';
import ListDetail from './pages/ListDetail';
import Onboarding from './pages/Onboarding';
import TasteMatch from './pages/TasteMatch';
import HealthBanner from './components/HealthBanner';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d4a017',
      light: '#e0b12e',
      dark: '#b8860b',
    },
    secondary: {
      main: '#f4efe6',
      light: '#ffffff',
      dark: '#c9c4b8',
    },
    background: {
      default: '#0c0b0a',
      paper: '#171512',
    },
    text: {
      primary: '#f4efe6',
      secondary: 'rgba(244, 239, 230, 0.72)',
    },
    divider: 'rgba(244, 239, 230, 0.12)',
  },
  typography: {
    fontFamily: '"Manrope", system-ui, sans-serif',
    h1: { fontWeight: 700, fontSize: '3rem' },
    h2: { fontWeight: 600, fontSize: '2.5rem' },
    h3: { fontWeight: 600, fontSize: '2rem' },
    h4: { fontWeight: 500, fontSize: '1.5rem' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#171512',
          border: '1px solid rgba(244, 239, 230, 0.1)',
          borderRadius: '8px',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
        },
        contained: {
          backgroundImage: 'none',
          backgroundColor: '#d4a017',
          color: '#140f0a',
          boxShadow: 'none',
          '&:hover': {
            backgroundImage: 'none',
            backgroundColor: '#e0b12e',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: 'rgba(244, 239, 230, 0.35)',
          color: '#f4efe6',
          '&:hover': {
            borderColor: '#d4a017',
            backgroundColor: 'rgba(212, 160, 23, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px',
            backgroundColor: 'rgba(244, 239, 230, 0.04)',
            '& fieldset': { borderColor: 'rgba(244, 239, 230, 0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(212, 160, 23, 0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#d4a017' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          backgroundColor: 'rgba(212, 160, 23, 0.12)',
          border: '1px solid rgba(212, 160, 23, 0.35)',
          color: '#d4a017',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(12, 11, 10, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(244, 239, 230, 0.08)',
          boxShadow: 'none',
        },
      },
    },
  },
});

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const showBackground = !isAuthenticated && ['/', '/login', '/register'].includes(location.pathname);
  
  // Create a key that definitely changes on every navigation
  // Use location.key (React Router's unique navigation ID) as primary
  // Fallback to pathname + search + hash to ensure uniqueness
  const routesKey = React.useMemo(() => {
    if (location.key) {
      // location.key is React Router's unique ID - changes on every navigation
      return location.key;
    }
    // Fallback: combine pathname with search and hash
    // This ensures Routes remounts even when location.key is undefined
    return `${location.pathname}-${location.search}-${location.hash}`;
  }, [location.key, location.pathname, location.search, location.hash]);

  return (
    <div className="App" style={{ position: 'relative' }}>
      {showBackground && <AnimatedMovieBackground />}
      <Navbar />
      <HealthBanner />
      <Routes key={routesKey}>
        <Route path="/" element={<Home key={`home-${location.pathname}-${location.key || 'default'}`} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/taste-match/:userId" element={
          <ProtectedRoute>
            <TasteMatch />
          </ProtectedRoute>
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/search" element={<Navigate to="/" replace />} />
        <Route path="/feed" element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        } />
        <Route path="/rate" element={<Navigate to="/" replace />} />
        <Route path="/rankings" element={<MyRankings />} />
        <Route path="/watchlist" element={
          <ProtectedRoute>
            <Watchlist />
          </ProtectedRoute>
        } />
        <Route path="/lists" element={<Lists />} />
        <Route path="/lists/create" element={
          <ProtectedRoute>
            <CreateList />
          </ProtectedRoute>
        } />
        <Route path="/lists/from" element={
          <ProtectedRoute>
            <BuildListFrom />
          </ProtectedRoute>
        } />
        <Route path="/list/:listId" element={<ListDetail />} />
        <Route path="/discover" element={<DiscoverUsers />} />
        <Route path="/following" element={
          <ProtectedRoute>
            <FollowingRankings />
          </ProtectedRoute>
        } />
        <Route path="/share/:shareCode" element={<SharedRankings />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/profile/:userId/followers" element={<Followers />} />
        <Route path="/profile/:userId/following" element={<Following />} />
        <Route path="/movie/:movieId" element={<MovieDetail />} />
        <Route path="/genre/:genreId" element={<GenreMovies />} />
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <MovieProvider>
          <RatingsProvider>
            <Router>
              <AppContent />
            </Router>
          </RatingsProvider>
        </MovieProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;