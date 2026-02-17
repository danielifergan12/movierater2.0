const express = require('express');
const axios = require('axios');
const Movie = require('../models/Movie');
const auth = require('../middleware/auth');

const router = express.Router();

// Search movies from TMDB
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query,
          page,
          language: 'en-US'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Movie search error:', error);
    res.status(500).json({ message: 'Error searching movies' });
  }
});

// Get movie details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if movie exists in our database
    let movie = await Movie.findOne({ tmdbId: parseInt(id) });
    
    if (!movie) {
      // Fetch from TMDB and save to database
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${id}`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US'
          }
        }
      );

      const tmdbMovie = response.data;
      
      // Fetch external IDs to get IMDB ID
      let imdbId = null;
      let imdbRating = null;
      try {
        const externalIdsResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}/external_ids`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY
            }
          }
        );
        imdbId = externalIdsResponse.data.imdb_id;
        
        // Fetch IMDB rating from OMDB API (free tier)
        if (imdbId && process.env.OMDB_API_KEY) {
          try {
            const omdbResponse = await axios.get(
              `https://www.omdbapi.com/`,
              {
                params: {
                  i: imdbId,
                  apikey: process.env.OMDB_API_KEY
                }
              }
            );
            if (omdbResponse.data && omdbResponse.data.imdbRating && omdbResponse.data.imdbRating !== 'N/A') {
              imdbRating = parseFloat(omdbResponse.data.imdbRating);
            }
          } catch (omdbError) {
            console.log('Could not fetch IMDB rating from OMDB:', omdbError.message);
          }
        }
      } catch (externalError) {
        console.log('Could not fetch external IDs:', externalError.message);
      }
      
      movie = new Movie({
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title,
        overview: tmdbMovie.overview,
        releaseDate: tmdbMovie.release_date,
        posterPath: tmdbMovie.poster_path,
        backdropPath: tmdbMovie.backdrop_path,
        genres: tmdbMovie.genres,
        runtime: tmdbMovie.runtime,
        voteAverage: tmdbMovie.vote_average,
        voteCount: tmdbMovie.vote_count,
        popularity: tmdbMovie.popularity,
        adult: tmdbMovie.adult,
        originalLanguage: tmdbMovie.original_language,
        originalTitle: tmdbMovie.original_title,
        imdbId: imdbId,
        imdbRating: imdbRating
      });

      await movie.save();
    } else {
      // If movie exists but doesn't have IMDB rating, try to fetch it
      if (!movie.imdbRating && movie.imdbId && process.env.OMDB_API_KEY) {
        try {
          const omdbResponse = await axios.get(
            `https://www.omdbapi.com/`,
            {
              params: {
                i: movie.imdbId,
                apikey: process.env.OMDB_API_KEY
              }
            }
          );
          if (omdbResponse.data && omdbResponse.data.imdbRating && omdbResponse.data.imdbRating !== 'N/A') {
            movie.imdbRating = parseFloat(omdbResponse.data.imdbRating);
            await movie.save();
          }
        } catch (omdbError) {
          console.log('Could not fetch IMDB rating:', omdbError.message);
        }
      } else if (!movie.imdbId) {
        // Try to get IMDB ID from external_ids
        try {
          const externalIdsResponse = await axios.get(
            `https://api.themoviedb.org/3/movie/${id}/external_ids`,
            {
              params: {
                api_key: process.env.TMDB_API_KEY
              }
            }
          );
          movie.imdbId = externalIdsResponse.data.imdb_id;
          if (movie.imdbId && process.env.OMDB_API_KEY) {
            const omdbResponse = await axios.get(
              `https://www.omdbapi.com/`,
              {
                params: {
                  i: movie.imdbId,
                  apikey: process.env.OMDB_API_KEY
                }
              }
            );
            if (omdbResponse.data && omdbResponse.data.imdbRating && omdbResponse.data.imdbRating !== 'N/A') {
              movie.imdbRating = parseFloat(omdbResponse.data.imdbRating);
            }
            await movie.save();
          }
        } catch (error) {
          console.log('Could not fetch IMDB data:', error.message);
        }
      }
    }

    res.json(movie);
  } catch (error) {
    console.error('Get movie error:', error);
    res.status(500).json({ message: 'Error fetching movie details' });
  }
});

// Get trending movies
router.get('/trending/week', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/trending/movie/week`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'en-US'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Get trending movies error:', error);
    res.status(500).json({ message: 'Error fetching trending movies' });
  }
});

// Get popular movies
router.get('/popular', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          page,
          language: 'en-US'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Get popular movies error:', error);
    res.status(500).json({ message: 'Error fetching popular movies' });
  }
});

// Get movies by genre
router.get('/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;
    
    const response = await axios.get(
      `https://api.themoviedb.org/3/discover/movie`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          with_genres: genreId,
          page,
          language: 'en-US',
          sort_by: 'popularity.desc'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Get movies by genre error:', error);
    res.status(500).json({ message: 'Error fetching movies by genre' });
  }
});

// Get movie recommendations for user based on their highly rated movies
router.get('/recommendations/personal', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's ratings (top 10 highest rated)
    const ratings = user.ratings || [];
    
    if (ratings.length === 0) {
      // Return popular movies if user has no ratings
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/popular`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US'
          }
        }
      );
      return res.json(response.data);
    }

    // Get top 5 highly rated movies (top of the list = highest rated)
    const topRatedMovies = ratings.slice(0, Math.min(5, ratings.length));
    const movieIds = topRatedMovies.map(r => r.id);
    const ratedMovieIds = new Set(movieIds.map(id => id.toString()));

    // Get similar movies for each top-rated movie
    const allRecommendations = new Map(); // Use Map to track movies and their popularity scores
    
    for (const movieId of movieIds) {
      try {
        // Get similar movies for this movie
        const similarResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}/similar`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US',
              page: 1
            }
          }
        );

        const similarMovies = similarResponse.data.results || [];
        
        // Add each similar movie to our collection, weighted by popularity
        similarMovies.forEach(movie => {
          const movieIdStr = movie.id.toString();
          if (!ratedMovieIds.has(movieIdStr)) {
            // Store the movie object and accumulate popularity score
            const existing = allRecommendations.get(movieIdStr);
            if (existing) {
              // If movie appears multiple times (from different rated movies), increase its score
              existing.popularity = (existing.popularity || 0) + (movie.popularity || 0);
            } else {
              // First time seeing this movie, store it
              allRecommendations.set(movieIdStr, { ...movie });
            }
          }
        });
      } catch (error) {
        console.log(`Could not fetch similar movies for ${movieId}:`, error.message);
      }
    }

    // Convert to array, sort by popularity, and return
    const recommendations = Array.from(allRecommendations.values())
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 20); // Get top 20 by popularity

    if (recommendations.length > 0) {
      return res.json({
        results: recommendations,
        total_results: recommendations.length,
        page: 1,
        total_pages: 1
      });
    } else {
      // Fallback to popular movies if no similar movies found
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/popular`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US'
          }
        }
      );
      return res.json(response.data);
    }
  } catch (error) {
    console.error('Get recommendations error:', error);
    // Fallback to popular movies on error
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/popular`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US'
          }
        }
      );
      return res.json(response.data);
    } catch (fallbackError) {
      res.status(500).json({ message: 'Error fetching recommendations' });
    }
  }
});

module.exports = router;
