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

  const getPersonalRecommendations = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Clear recommendations first if forcing refresh
      if (forceRefresh) {
        setRecommendedMovies([]);
      }
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
      const response = await api.get(`/api/movies/recommendations/personal${cacheBuster}`);
      setRecommendedMovies(response.data.results || []);
      return response.data;
    } catch (error) {
      console.error('Get recommendations error:', error);
      setRecommendedMovies([]);
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
