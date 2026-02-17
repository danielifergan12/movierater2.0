import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MovieProvider } from './contexts/MovieContext';
import Navbar from './components/Navbar';
import AnimatedMovieBackground from './components/AnimatedMovieBackground';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MovieDetail from './pages/MovieDetail';
import Search from './pages/Search';
import Feed from './pages/Feed';
import MyRankings from './pages/MyRankings';
import ProtectedRoute from './components/ProtectedRoute';
import Rate from './pages/Rate';
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
import ListDetail from './pages/ListDetail';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#66e0ff',
      dark: '#00a8cc',
    },
    secondary: {
      main: '#ff6b35',
      light: '#ff8a65',
      dark: '#e64a19',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    divider: '#333333',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3rem',
      background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #333333',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
        },
        contained: {
          background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
          boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #00a8cc, #e64a19)',
            boxShadow: '0 6px 20px rgba(0, 212, 255, 0.4)',
          },
        },
        outlined: {
          borderColor: '#00d4ff',
          color: '#00d4ff',
          '&:hover': {
            borderColor: '#66e0ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: '#333333',
            },
            '&:hover fieldset': {
              borderColor: '#00d4ff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00d4ff',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: '#00d4ff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
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
      <Routes key={routesKey}>
        <Route path="/" element={<Home key={`home-${location.pathname}-${location.key || 'default'}`} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/search" element={<Search />} />
        <Route path="/feed" element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        } />
        <Route path="/rate" element={
          <ProtectedRoute>
            <Rate />
          </ProtectedRoute>
        } />
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
          <Router>
            <AppContent />
          </Router>
        </MovieProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;