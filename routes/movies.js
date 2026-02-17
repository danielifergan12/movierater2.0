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

// Get personalized movie recommendations based on user's highly-rated movies
router.get('/recommendations/personal', auth, async (req, res) => {
  try {
    const user = req.user;
    const ratings = user.ratings || [];
    
    if (ratings.length === 0) {
      // If no ratings, return top-rated movies
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/top_rated`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US',
            page: 1
          }
        }
      );
      return res.json({
        results: response.data.results.slice(0, 20),
        total_results: 20,
        page: 1,
        total_pages: 1
      });
    }

    // Get top 10-15 highest-rated movies (these are at the top of the ratings array)
    const topRatedMovies = ratings.slice(0, Math.min(15, ratings.length));
    const ratedMovieIds = new Set(ratings.map(r => r.id.toString()));
    
    // Map to store recommendations with scores
    const recommendationMap = new Map();
    
    // Strategy 1: Get similar movies for each top-rated movie
    for (const ratedMovie of topRatedMovies) {
      try {
        // Get similar movies
        const similarResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${ratedMovie.id}/similar`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US',
              page: 1
            }
          }
        );
        
        const similarMovies = similarResponse.data.results || [];
        
        // Score and add similar movies
        similarMovies.forEach((movie, index) => {
          if (!ratedMovieIds.has(movie.id.toString()) && movie.vote_average >= 6.5 && movie.vote_count >= 100) {
            const score = recommendationMap.get(movie.id) || 0;
            // Higher score for movies similar to higher-ranked movies
            const positionWeight = (topRatedMovies.length - topRatedMovies.indexOf(ratedMovie)) / topRatedMovies.length;
            recommendationMap.set(movie.id, score + (10 * positionWeight) + (5 / (index + 1)));
          }
        });
      } catch (error) {
        console.log(`Error fetching similar movies for ${ratedMovie.id}:`, error.message);
      }
      
      // Strategy 2: Get movie details to extract director and genres
      try {
        const movieDetailsResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${ratedMovie.id}`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US',
              append_to_response: 'credits,keywords'
            }
          }
        );
        
        const movieDetails = movieDetailsResponse.data;
        const positionWeight = (topRatedMovies.length - topRatedMovies.indexOf(ratedMovie)) / topRatedMovies.length;
        
        // Strategy 3: Get movies by same director
        const directors = (movieDetails.credits?.crew || [])
          .filter(person => person.job === 'Director')
          .slice(0, 2); // Top 2 directors
        
        for (const director of directors) {
          try {
            const directorMoviesResponse = await axios.get(
              `https://api.themoviedb.org/3/discover/movie`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US',
                  with_people: director.id,
                  sort_by: 'vote_average.desc',
                  'vote_count.gte': 100,
                  'vote_average.gte': 7.0,
                  page: 1
                }
              }
            );
            
            const directorMovies = directorMoviesResponse.data.results || [];
            directorMovies.forEach((movie, index) => {
              if (!ratedMovieIds.has(movie.id.toString())) {
                const score = recommendationMap.get(movie.id) || 0;
                // High score for same director
                recommendationMap.set(movie.id, score + (15 * positionWeight) + (3 / (index + 1)));
              }
            });
          } catch (error) {
            console.log(`Error fetching director movies:`, error.message);
          }
        }
        
        // Strategy 4: Get movies with same genres (highly-rated)
        const genreIds = (movieDetails.genres || []).map(g => g.id).join(',');
        if (genreIds) {
          try {
            const genreMoviesResponse = await axios.get(
              `https://api.themoviedb.org/3/discover/movie`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US',
                  with_genres: genreIds,
                  sort_by: 'vote_average.desc',
                  'vote_count.gte': 500,
                  'vote_average.gte': 7.5,
                  page: 1
                }
              }
            );
            
            const genreMovies = genreMoviesResponse.data.results || [];
            genreMovies.forEach((movie, index) => {
              if (!ratedMovieIds.has(movie.id.toString())) {
                const score = recommendationMap.get(movie.id) || 0;
                recommendationMap.set(movie.id, score + (8 * positionWeight) + (2 / (index + 1)));
              }
            });
          } catch (error) {
            console.log(`Error fetching genre movies:`, error.message);
          }
        }
        
        // Strategy 5: Use keywords for thematic recommendations
        const keywords = movieDetails.keywords?.keywords || [];
        if (keywords.length > 0) {
          const keywordIds = keywords.slice(0, 3).map(k => k.id).join(',');
          try {
            const keywordMoviesResponse = await axios.get(
              `https://api.themoviedb.org/3/discover/movie`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US',
                  with_keywords: keywordIds,
                  sort_by: 'vote_average.desc',
                  'vote_count.gte': 200,
                  'vote_average.gte': 7.0,
                  page: 1
                }
              }
            );
            
            const keywordMovies = keywordMoviesResponse.data.results || [];
            keywordMovies.forEach((movie, index) => {
              if (!ratedMovieIds.has(movie.id.toString())) {
                const score = recommendationMap.get(movie.id) || 0;
                recommendationMap.set(movie.id, score + (5 * positionWeight) + (1 / (index + 1)));
              }
            });
          } catch (error) {
            console.log(`Error fetching keyword movies:`, error.message);
          }
        }
      } catch (error) {
        console.log(`Error fetching movie details for ${ratedMovie.id}:`, error.message);
      }
    }
    
    // Convert map to array and sort by score
    const recommendations = Array.from(recommendationMap.entries())
      .map(([id, score]) => ({ id: parseInt(id), score }))
      .sort((a, b) => b.score - a.score);
    
    // Fetch full movie details for top recommendations
    const topRecommendationIds = recommendations.slice(0, 30).map(r => r.id);
    
    // Fetch movies in batches (TMDB allows multiple IDs)
    const movieDetailsPromises = topRecommendationIds.map(id =>
      axios.get(
        `https://api.themoviedb.org/3/movie/${id}`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US'
          }
        }
      ).catch(() => null)
    );
    
    const movieDetailsResults = await Promise.all(movieDetailsPromises);
    const recommendedMovies = movieDetailsResults
      .filter(result => result && result.data)
      .map(result => ({
        id: result.data.id,
        title: result.data.title,
        overview: result.data.overview,
        release_date: result.data.release_date,
        poster_path: result.data.poster_path,
        backdrop_path: result.data.backdrop_path,
        vote_average: result.data.vote_average,
        vote_count: result.data.vote_count,
        popularity: result.data.popularity,
        genres: result.data.genres
      }))
      .filter(movie => movie.vote_average >= 6.5 && movie.vote_count >= 100)
      .slice(0, 20);
    
    return res.json({
      results: recommendedMovies,
      total_results: recommendedMovies.length,
      page: 1,
      total_pages: 1
    });
    
  } catch (error) {
    console.error('Get recommendations error:', error);
    // Fallback to top-rated movies
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/top_rated`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US',
            page: 1
          }
        }
      );
      return res.json({
        results: response.data.results.slice(0, 20),
        total_results: 20,
        page: 1,
        total_pages: 1
      });
    } catch (fallbackError) {
      res.status(500).json({ message: 'Error fetching recommendations' });
    }
  }
});

module.exports = router;
