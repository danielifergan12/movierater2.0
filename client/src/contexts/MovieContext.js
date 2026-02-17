import React, { createContext, useContext, useState } from 'react';
import api from '../config/axios';

const MovieContext = createContext();

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovies must be used within a MovieProvider');
  }
  return context;
};

export const MovieProvider = ({ children }) => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchMovies = async (query, page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/movies/search?query=${encodeURIComponent(query)}&page=${page}`);
      setSearchResults(response.data.results);
      return response.data;
    } catch (error) {
      console.error('Search movies error:', error);
      return { results: [] };
    } finally {
      setLoading(false);
    }
  };

  const getMovieDetails = async (movieId) => {
    try {
      const response = await api.get(`/api/movies/${movieId}`);
      return response.data;
    } catch (error) {
      console.error('Get movie details error:', error);
      return null;
    }
  };

  const getTrendingMovies = async () => {
    try {
      const response = await api.get('/api/movies/trending/week');
      setTrendingMovies(response.data.results);
      return response.data;
    } catch (error) {
      console.error('Get trending movies error:', error);
      return { results: [] };
    }
  };

  const getPopularMovies = async (page = 1) => {
    try {
      const response = await api.get(`/api/movies/popular?page=${page}`);
      setPopularMovies(response.data.results);
      return response.data;
    } catch (error) {
      console.error('Get popular movies error:', error);
      return { results: [] };
    }
  };

  const getMoviesByGenre = async (genreId, page = 1) => {
    try {
      const response = await api.get(`/api/movies/genre/${genreId}?page=${page}`);
      return response.data;
    } catch (error) {
      console.error('Get movies by genre error:', error);
      return { results: [] };
    }
  };

  const getPersonalRecommendations = async (forceRefresh = false, excludeIds = []) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (forceRefresh) {
        params.append('forceRefresh', 'true');
      }
      if (excludeIds && excludeIds.length > 0) {
        params.append('excludeIds', excludeIds.join(','));
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/api/movies/recommendations/personal${queryString}`);
      // Update movies atomically to prevent flickering
      setRecommendedMovies(response.data.results || []);
      return response.data;
    } catch (error) {
      console.error('Get recommendations error:', error);
      // Only clear on error if we don't have existing movies
      if (recommendedMovies.length === 0) {
        setRecommendedMovies([]);
      }
      return { results: [] };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    trendingMovies,
    popularMovies,
    recommendedMovies,
    searchResults,
    loading,
    searchMovies,
    getMovieDetails,
    getTrendingMovies,
    getPopularMovies,
    getMoviesByGenre,
    getPersonalRecommendations
  };

  return (
    <MovieContext.Provider value={value}>
      {children}
    </MovieContext.Provider>
  );
};
