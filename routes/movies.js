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

    // Sort results by popularity to ensure well-known movies come first
    // Prioritize vote_count (how many people have seen/rated it) as the main indicator of "known"
    // Then consider popularity and vote_average
    const sortedResults = response.data.results.sort((a, b) => {
      // Primary sort: vote_count (indicates how well-known the movie is)
      if (b.vote_count !== a.vote_count) {
        return (b.vote_count || 0) - (a.vote_count || 0);
      }
      // Secondary sort: popularity (TMDB's popularity metric)
      if (Math.abs((b.popularity || 0) - (a.popularity || 0)) > 1) {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      // Tertiary sort: vote_average (rating quality)
      return (b.vote_average || 0) - (a.vote_average || 0);
    });

    res.json({
      ...response.data,
      results: sortedResults
    });
  } catch (error) {
    console.error('Movie search error:', error);
    res.status(500).json({ message: 'Error searching movies' });
  }
});

// Get movie details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate movie ID
    const movieId = parseInt(id);
    if (isNaN(movieId)) {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }
    
    // First check if movie exists in our database
    let movie = await Movie.findOne({ tmdbId: movieId });
    
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

// Get multiple movie posters by IDs (for animated background)
router.get('/posters/batch', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ message: 'ids parameter is required (comma-separated)' });
    }

    const movieIds = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (movieIds.length === 0) {
      return res.status(400).json({ message: 'No valid movie IDs provided' });
    }

    // Fetch all movies in parallel
    const moviePromises = movieIds.map(async (id) => {
      try {
        // First check database
        let movie = await Movie.findOne({ tmdbId: id });
        
        if (movie && movie.posterPath) {
          return { id, posterPath: movie.posterPath };
        }

        // Fetch from TMDB
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US'
            },
            timeout: 3000 // 3 second timeout per movie
          }
        );

        const posterPath = response.data?.poster_path || null;
        
        // Save to database for future use (optional, don't wait)
        if (posterPath && !movie) {
          Movie.findOneAndUpdate(
            { tmdbId: id },
            { 
              tmdbId: id,
              title: response.data.title,
              posterPath: posterPath,
              lastUpdated: new Date()
            },
            { upsert: true, new: true }
          ).catch(err => console.log(`Error saving movie ${id}:`, err.message));
        }

        return { id, posterPath };
      } catch (error) {
        console.log(`Error fetching movie ${id}:`, error.message);
        return { id, posterPath: null };
      }
    });

    const results = await Promise.all(moviePromises);
    const posters = {};
    results.forEach(({ id, posterPath }) => {
      if (posterPath) {
        posters[id] = posterPath;
      }
    });

    res.json({ posters });
  } catch (error) {
    console.error('Batch fetch posters error:', error);
    res.status(500).json({ message: 'Error fetching movie posters' });
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

// Get popular/known movies by genre
router.get('/genre/:genreId/highly-rated', async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;
    const genreIdNum = parseInt(genreId);
    
    const response = await axios.get(
      `https://api.themoviedb.org/3/discover/movie`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          with_genres: genreId,
          page,
          language: 'en-US',
          sort_by: 'popularity.desc', // Sort by popularity to get well-known movies
          'vote_count.gte': 1000, // Require at least 1000 votes to ensure movies are well-known
          'vote_average.gte': 6.0 // Also require minimum rating of 6.0 for quality
        }
      }
    );

    // First filter: ensure the genre is in the movie's genre_ids
    const initialFiltered = (response.data.results || []).filter(movie => {
      if (!movie.genre_ids || !Array.isArray(movie.genre_ids)) {
        return false;
      }
      return movie.genre_ids.includes(genreIdNum);
    });

    // Fetch full movie details to get accurate genre information
    // This ensures we only include movies where the genre is actually appropriate
    const movieDetailsPromises = initialFiltered.map(movie => 
      axios.get(
        `https://api.themoviedb.org/3/movie/${movie.id}`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US'
          }
        }
      ).then(res => ({ ...movie, fullGenres: res.data.genres }))
       .catch(() => ({ ...movie, fullGenres: [] }))
    );

    const moviesWithDetails = await Promise.all(movieDetailsPromises);

    // Filter to ensure the requested genre is a PRIMARY genre (first 2-3 genres)
    // This prevents movies where the genre is just a tangential tag
    const filteredResults = moviesWithDetails.filter(movie => {
      if (!movie.fullGenres || !Array.isArray(movie.fullGenres) || movie.fullGenres.length === 0) {
        return false;
      }

      // Find the index of the requested genre in the movie's genre list
      const genreIndex = movie.fullGenres.findIndex(g => g.id === genreIdNum);
      
      // Only include if the genre is in the first 3 genres (primary genres)
      // This ensures movies are actually of that genre, not just tangentially related
      return genreIndex >= 0 && genreIndex < 3;
    });

    // Map back to the original movie format (without fullGenres)
    const finalResults = filteredResults.map(({ fullGenres, ...movie }) => movie);

    // Return the filtered results
    res.json({
      ...response.data,
      results: finalResults
    });
  } catch (error) {
    console.error('Get popular movies by genre error:', error);
    res.status(500).json({ message: 'Error fetching popular movies by genre' });
  }
});

// Get movie genres list
router.get('/genres', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/genre/movie/list`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'en-US'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Get genres error:', error);
    res.status(500).json({ message: 'Error fetching genres' });
  }
});

// Get new releases (now playing + upcoming movies)
router.get('/new-releases', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    // Fetch both now playing and upcoming movies
    const [nowPlayingResponse, upcomingResponse] = await Promise.all([
      axios.get(
        `https://api.themoviedb.org/3/movie/now_playing`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            page: 1,
            language: 'en-US'
          }
        }
      ),
      axios.get(
        `https://api.themoviedb.org/3/movie/upcoming`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            page: 1,
            language: 'en-US'
          }
        }
      )
    ]);

    // Combine results and remove duplicates
    const nowPlayingMovies = nowPlayingResponse.data.results || [];
    const upcomingMovies = upcomingResponse.data.results || [];
    
    // Create a map to track unique movies by ID
    const movieMap = new Map();
    
    // Add now playing movies first (they take priority)
    nowPlayingMovies.forEach(movie => {
      if (movie && movie.id) {
        movieMap.set(movie.id, movie);
      }
    });
    
    // Add upcoming movies (won't overwrite if already exists)
    upcomingMovies.forEach(movie => {
      if (movie && movie.id && !movieMap.has(movie.id)) {
        movieMap.set(movie.id, movie);
      }
    });
    
    // Convert map to array and sort by release date (newest first)
    const allNewReleases = Array.from(movieMap.values()).sort((a, b) => {
      const dateA = new Date(a.release_date || 0);
      const dateB = new Date(b.release_date || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    res.json({
      results: allNewReleases,
      page: 1,
      total_pages: 1,
      total_results: allNewReleases.length
    });
  } catch (error) {
    console.error('Get new releases error:', error);
    res.status(500).json({ message: 'Error fetching new releases' });
  }
});

// Get personalized movie recommendations based on user's highly-rated movies
router.get('/recommendations/personal', auth, async (req, res) => {
  try {
    const user = req.user;
    const ratings = user.ratings || [];
    const forceRefresh = req.query.forceRefresh === 'true';
    
    // Get excludeIds from query parameter (comma-separated movie IDs to exclude)
    const excludeIdsParam = req.query.excludeIds || '';
    const excludeIds = new Set(
      excludeIdsParam
        .split(',')
        .map(id => id.trim())
        .filter(id => id && !isNaN(parseInt(id)))
        .map(id => id.toString())
    );
    
    if (ratings.length === 0) {
      // If no ratings, return top-rated movies
      // Use different page if forceRefresh to get different movies
      const pageToUse = forceRefresh ? Math.floor(Math.random() * 5) + 2 : 1;
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/top_rated`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US',
              page: pageToUse
            },
            timeout: 5000 // 5 second timeout
          }
        );
        
        // Filter out excluded movies
        let results = (response.data?.results || [])
          .filter(m => m && m.id && !excludeIds.has(m.id.toString()));
        
        // If we need more movies and have excludeIds, try additional pages
        if (results.length < 8 && excludeIds.size > 0) {
          for (let page = pageToUse + 1; page <= pageToUse + 5 && results.length < 8; page++) {
            try {
              const additionalResponse = await axios.get(
                `https://api.themoviedb.org/3/movie/top_rated`,
                {
                  params: {
                    api_key: process.env.TMDB_API_KEY,
                    language: 'en-US',
                    page: page
                  },
                  timeout: 3000
                }
              );
              const additionalResults = (additionalResponse.data?.results || [])
                .filter(m => m && m.id && !excludeIds.has(m.id.toString()));
              results = [...results, ...additionalResults];
            } catch (err) {
              // Continue to next page
            }
          }
        }
        
        return res.json({
          results: results.slice(0, 20),
          total_results: results.length,
          page: 1,
          total_pages: 1
        });
      } catch (error) {
        console.error('Error fetching top-rated movies:', error.message);
        return res.json({
          results: [],
          total_results: 0,
          page: 1,
          total_pages: 1
        });
      }
    }

    // Get top 10-15 highest-rated movies (these are at the top of the ratings array)
    const topRatedMovies = ratings
      .filter(r => r && r.id) // Filter out invalid ratings
      .slice(0, Math.min(15, ratings.length));
    
    if (topRatedMovies.length === 0) {
      // Fallback if no valid ratings
      const pageToUse = forceRefresh ? Math.floor(Math.random() * 5) + 2 : 1;
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/top_rated`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US',
            page: pageToUse
          }
        }
      );
      
      // Filter out excluded movies
      let results = (response.data.results || [])
        .filter(m => m && m.id && !excludeIds.has(m.id.toString()));
      
      // If we need more movies and have excludeIds, try additional pages
      if (results.length < 8 && excludeIds.size > 0) {
        for (let page = pageToUse + 1; page <= pageToUse + 5 && results.length < 8; page++) {
          try {
            const additionalResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/top_rated`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US',
                  page: page
                },
                timeout: 3000
              }
            );
            const additionalResults = (additionalResponse.data?.results || [])
              .filter(m => m && m.id && !excludeIds.has(m.id.toString()));
            results = [...results, ...additionalResults];
          } catch (err) {
            // Continue to next page
          }
        }
      }
      
      return res.json({
        results: results.slice(0, 20),
        total_results: results.length,
        page: 1,
        total_pages: 1
      });
    }
    
    const ratedMovieIds = new Set(ratings.map(r => r.id?.toString()).filter(Boolean));
    
    // ===== ENHANCED USER PREFERENCE ANALYSIS =====
    // Analyze user's rating patterns, decade preferences, quality preferences, and genre depth
    const analyzeUserPreferences = async (topRatedMovies) => {
      const genreFrequency = new Map(); // genreId -> { count, totalRating }
      const genreRatings = new Map(); // genreId -> [ratings]
      const releaseYears = [];
      const voteAverages = [];
      const voteCounts = [];
      const castFrequency = new Map(); // actorId -> { count, totalRating }
      const directorFrequency = new Map(); // directorId -> { count, totalRating }
      
      // Fetch movie details for top rated movies
      const movieDetailsPromises = topRatedMovies.slice(0, 10).map(async (ratedMovie, index) => {
        try {
          const movieDetailsResponse = await axios.get(
            `https://api.themoviedb.org/3/movie/${ratedMovie.id}`,
            {
              params: {
                api_key: process.env.TMDB_API_KEY,
                language: 'en-US',
                append_to_response: 'credits'
              },
              timeout: 3000
            }
          );
          const movie = movieDetailsResponse.data;
          if (!movie) return null;
          
          // Calculate position-based rating (higher position = higher implicit rating)
          // Position 0 = rating of 10, position 9 = rating of 1
          const positionRating = 10 - (index / topRatedMovies.length) * 9;
          
          // Analyze genres with weighted ratings
          (movie.genres || []).forEach(genre => {
            if (genre && genre.id) {
              const current = genreFrequency.get(genre.id) || { count: 0, totalRating: 0 };
              genreFrequency.set(genre.id, {
                count: current.count + 1,
                totalRating: current.totalRating + positionRating
              });
              
              if (!genreRatings.has(genre.id)) {
                genreRatings.set(genre.id, []);
              }
              genreRatings.get(genre.id).push(positionRating);
            }
          });
          
          // Collect release years
          if (movie.release_date) {
            const year = new Date(movie.release_date).getFullYear();
            if (year > 1900 && year <= new Date().getFullYear() + 1) {
              releaseYears.push(year);
            }
          }
          
          // Collect quality metrics
          if (movie.vote_average) voteAverages.push(movie.vote_average);
          if (movie.vote_count) voteCounts.push(movie.vote_count);
          
          // Analyze cast (top 5 actors/actresses)
          const cast = (movie.credits?.cast || [])
            .filter(person => person && person.order < 5) // Top 5 billed
            .slice(0, 5);
          
          cast.forEach(person => {
            if (person && person.id) {
              const current = castFrequency.get(person.id) || { count: 0, totalRating: 0 };
              castFrequency.set(person.id, {
                count: current.count + 1,
                totalRating: current.totalRating + positionRating
              });
            }
          });
          
          // Analyze directors
          const directors = (movie.credits?.crew || [])
            .filter(person => person && person.job === 'Director')
            .slice(0, 2);
          
          directors.forEach(director => {
            if (director && director.id) {
              const current = directorFrequency.get(director.id) || { count: 0, totalRating: 0 };
              directorFrequency.set(director.id, {
                count: current.count + 1,
                totalRating: current.totalRating + positionRating
              });
            }
          });
          
          return movie;
        } catch (error) {
          return null;
        }
      });
      
      const movieDetailsResults = await Promise.all(movieDetailsPromises);
      const validMovies = movieDetailsResults.filter(m => m !== null);
      
      // Calculate preferences
      const avgReleaseYear = releaseYears.length > 0 
        ? releaseYears.reduce((a, b) => a + b, 0) / releaseYears.length 
        : 2000;
      
      const avgVoteAverage = voteAverages.length > 0
        ? voteAverages.reduce((a, b) => a + b, 0) / voteAverages.length
        : 7.5;
      
      const avgVoteCount = voteCounts.length > 0
        ? voteCounts.reduce((a, b) => a + b, 0) / voteCounts.length
        : 1000;
      
      // Determine quality preference (critically acclaimed vs popular)
      const prefersCriticallyAcclaimed = avgVoteAverage > 7.5;
      const prefersPopular = avgVoteCount > 2000;
      
      // Determine decade preference
      const prefersRecent = avgReleaseYear > 2010;
      const prefersClassics = avgReleaseYear < 2000;
      
      // Get favorite genres weighted by rating (not just frequency)
      const favoriteGenres = Array.from(genreFrequency.entries())
        .map(([id, data]) => ({
          id: parseInt(id),
          score: data.totalRating / data.count, // Average rating for this genre
          count: data.count
        }))
        .sort((a, b) => {
          // Sort by score first, then by count
          if (Math.abs(b.score - a.score) > 0.5) {
            return b.score - a.score;
          }
          return b.count - a.count;
        })
        .slice(0, 5)
        .map(g => g.id);
      
      // Get favorite actors (top 10)
      const favoriteActors = Array.from(castFrequency.entries())
        .map(([id, data]) => ({
          id: parseInt(id),
          score: data.totalRating / data.count,
          count: data.count
        }))
        .sort((a, b) => {
          if (Math.abs(b.score - a.score) > 0.5) {
            return b.score - a.score;
          }
          return b.count - a.count;
        })
        .slice(0, 10)
        .map(a => a.id);
      
      // Determine adaptive quality thresholds based on user's rating patterns
      // If user rates mostly high-quality movies, use higher thresholds
      let minVoteAverage, minVoteCount;
      if (avgVoteAverage >= 8.0 && avgVoteCount >= 2000) {
        // User prefers very high quality
        minVoteAverage = 7.5;
        minVoteCount = 1000;
      } else if (avgVoteAverage >= 7.5 && avgVoteCount >= 1000) {
        // User prefers high quality
        minVoteAverage = 7.2;
        minVoteCount = 500;
      } else if (avgVoteAverage >= 7.0) {
        // User prefers moderate quality
        minVoteAverage = 7.0;
        minVoteCount = 500;
      } else {
        // User has diverse tastes, use lower thresholds for variety
        minVoteAverage = 6.5;
        minVoteCount = 200;
      }
      
      return {
        favoriteGenres,
        favoriteActors,
        avgReleaseYear,
        prefersRecent,
        prefersClassics,
        prefersCriticallyAcclaimed,
        prefersPopular,
        minVoteAverage,
        minVoteCount,
        genreFrequency,
        genreRatings
      };
    };
    
    const userPreferences = await analyzeUserPreferences(topRatedMovies);
    const favoriteGenres = userPreferences.favoriteGenres;
    const favoriteActors = userPreferences.favoriteActors;
    
    // Map to store recommendations with scores
    const recommendationMap = new Map();
    
    // Use adaptive quality thresholds
    const minVoteAverage = userPreferences.minVoteAverage;
    const minVoteCount = userPreferences.minVoteCount;
    
    // Strategy 0: PRIORITIZE - Get HIGH QUALITY movies from user's favorite genres
    if (favoriteGenres.length > 0) {
      try {
        const favoriteGenreIds = favoriteGenres.join(',');
        const genrePage = forceRefresh ? Math.floor(Math.random() * 3) + 1 : 1;
        const genreMoviesResponse = await axios.get(
          `https://api.themoviedb.org/3/discover/movie`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US',
              with_genres: favoriteGenreIds,
              sort_by: userPreferences.prefersCriticallyAcclaimed ? 'vote_average.desc' : 'popularity.desc',
              'vote_count.gte': minVoteCount,
              'vote_average.gte': minVoteAverage,
              page: genrePage
            },
            timeout: 5000
          }
        );
        
        const genreMovies = (genreMoviesResponse.data?.results || []).filter(m => m && m.id);
        genreMovies.forEach((movie, index) => {
          if (movie.id && 
              !ratedMovieIds.has(movie.id.toString()) && 
              !excludeIds.has(movie.id.toString()) &&
              movie.vote_average >= minVoteAverage &&
              movie.vote_count >= minVoteCount) {
            const score = recommendationMap.get(movie.id) || 0;
            // High score for favorite genres - prioritize these
            const genreMatchScore = favoriteGenres.some(gid => 
              movie.genre_ids && movie.genre_ids.includes(gid)
            ) ? 25 : 15;
            
            // Quality bonus
            const qualityBonus = movie.vote_average >= 8.0 ? 8 : (movie.vote_average >= 7.5 ? 5 : 0);
            
            // Recency bonus
            let recencyBonus = 0;
            if (movie.release_date) {
              const movieYear = new Date(movie.release_date).getFullYear();
              if (userPreferences.prefersRecent && movieYear >= 2010) {
                recencyBonus = 5;
              } else if (userPreferences.prefersClassics && movieYear < 2000) {
                recencyBonus = 5;
              }
            }
            
            recommendationMap.set(movie.id, score + genreMatchScore + qualityBonus + recencyBonus + (5 / (index + 1)));
          }
        });
      } catch (error) {
        console.log(`Error fetching favorite genre movies:`, error.message);
      }
    }
    
    // Strategy 0.5: Get movies with favorite actors
    if (favoriteActors.length > 0) {
      try {
        // Get movies for top 5 favorite actors
        const topActors = favoriteActors.slice(0, 5);
        for (const actorId of topActors) {
          try {
            const actorMoviesResponse = await axios.get(
              `https://api.themoviedb.org/3/person/${actorId}/movie_credits`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US'
                },
                timeout: 5000
              }
            );
            
            const actorMovies = (actorMoviesResponse.data?.cast || [])
              .filter(movie => 
                movie && 
                movie.id &&
                movie.vote_average >= minVoteAverage &&
                movie.vote_count >= minVoteCount &&
                !ratedMovieIds.has(movie.id.toString())
              )
              .sort((a, b) => {
                if (Math.abs((b.vote_average || 0) - (a.vote_average || 0)) > 0.2) {
                  return (b.vote_average || 0) - (a.vote_average || 0);
                }
                return (b.vote_count || 0) - (a.vote_count || 0);
              })
              .slice(0, 10);
            
            actorMovies.forEach((movie, index) => {
              if (movie && movie.id && !excludeIds.has(movie.id.toString())) {
                const score = recommendationMap.get(movie.id) || 0;
                // Cast match score - higher for actors that appear in multiple favorite movies
                const castScore = 18 - (index * 0.5); // 18 for first, decreasing
                recommendationMap.set(movie.id, score + castScore + (3 / (index + 1)));
              }
            });
          } catch (error) {
            console.log(`Error fetching actor movies for ${actorId}:`, error.message);
          }
        }
      } catch (error) {
        console.log(`Error fetching cast movies:`, error.message);
      }
    }
    
    // Strategy 1: Get similar movies for each top-rated movie
    // If forceRefresh, use completely different pages to get different movies
    const useRandomPage = forceRefresh;
    
    for (const ratedMovie of topRatedMovies) {
      if (!ratedMovie || !ratedMovie.id) continue;
      
      try {
        // Get similar movies - use different page if forceRefresh (pages 2-5 for variety)
        const pageToUse = useRandomPage ? Math.floor(Math.random() * 4) + 2 : 1;
        const similarResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${ratedMovie.id}/similar`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US',
              page: pageToUse
            },
            timeout: 5000 // 5 second timeout
          }
        );
        
        const similarMovies = (similarResponse.data?.results || []).filter(m => m && m.id);
        
        // Score and add similar movies - use adaptive thresholds
        similarMovies.forEach((movie, index) => {
          if (movie.id && 
              !ratedMovieIds.has(movie.id.toString()) &&
              !excludeIds.has(movie.id.toString()) &&
              movie.vote_average >= minVoteAverage &&
              movie.vote_count >= minVoteCount) {
            const score = recommendationMap.get(movie.id) || 0;
            // Higher score for movies similar to higher-ranked movies
            const positionWeight = (topRatedMovies.length - topRatedMovies.indexOf(ratedMovie)) / topRatedMovies.length;
            const baseScore = 10 * positionWeight;
            
            // Quality bonus
            const qualityBonus = movie.vote_average >= 8.0 ? 5 : (movie.vote_average >= 7.5 ? 3 : 0);
            
            recommendationMap.set(movie.id, score + baseScore + qualityBonus + (5 / (index + 1)));
          }
        });
      } catch (error) {
        console.log(`Error fetching similar movies for ${ratedMovie.id}:`, error.message);
        // Continue to next movie
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
            },
            timeout: 5000 // 5 second timeout
          }
        );
        
        const movieDetails = movieDetailsResponse.data;
        if (!movieDetails) continue;
        
        const positionWeight = (topRatedMovies.length - topRatedMovies.indexOf(ratedMovie)) / topRatedMovies.length;
        
        // Strategy 3: Get movies by same director
        const directors = (movieDetails.credits?.crew || [])
          .filter(person => person && person.job === 'Director' && person.id)
          .slice(0, 2); // Top 2 directors
        
        for (const director of directors) {
          if (!director || !director.id) continue;
          
          try {
            // Use person's movie credits endpoint instead of discover
            const directorMoviesResponse = await axios.get(
              `https://api.themoviedb.org/3/person/${director.id}/movie_credits`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US'
                },
                timeout: 5000 // 5 second timeout
              }
            );
            
            // Filter for director role - use adaptive thresholds
            const directorMovies = (directorMoviesResponse.data?.crew || [])
              .filter(movie => 
                movie && 
                movie.id &&
                movie.job === 'Director' && 
                movie.vote_average >= minVoteAverage &&
                movie.vote_count >= minVoteCount &&
                !ratedMovieIds.has(movie.id.toString())
              )
              .sort((a, b) => {
                // Sort by vote_average first, then vote_count
                if (Math.abs((b.vote_average || 0) - (a.vote_average || 0)) > 0.2) {
                  return (b.vote_average || 0) - (a.vote_average || 0);
                }
                return (b.vote_count || 0) - (a.vote_count || 0);
              })
              .slice(0, 15); // Top 15 movies by this director (more options)
            
            directorMovies.forEach((movie, index) => {
              if (movie && movie.id && !excludeIds.has(movie.id.toString())) {
                const score = recommendationMap.get(movie.id) || 0;
                // MUCH higher score for same director - this is a key recommendation factor
                const directorScore = 30 * positionWeight;
                
                // Quality bonus for director movies
                const qualityBonus = movie.vote_average >= 8.0 ? 8 : (movie.vote_average >= 7.5 ? 5 : 0);
                
                recommendationMap.set(movie.id, score + directorScore + qualityBonus + (5 / (index + 1)));
              }
            });
          } catch (error) {
            console.log(`Error fetching director movies for ${director.id}:`, error.message);
            // Continue to next director
          }
        }
        
        // Strategy 4: Get HIGH QUALITY movies with same genres
        const genreIds = (movieDetails.genres || [])
          .filter(g => g && g.id)
          .map(g => g.id)
          .join(',');
        if (genreIds) {
          try {
            // Vary page and sort criteria if forceRefresh to get completely different movies
            const genrePage = forceRefresh ? Math.floor(Math.random() * 4) + 2 : 1;
            const sortBy = 'vote_average.desc'; // Always sort by rating for quality
            const genreMoviesResponse = await axios.get(
              `https://api.themoviedb.org/3/discover/movie`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US',
                  with_genres: genreIds,
                  sort_by: userPreferences.prefersCriticallyAcclaimed ? 'vote_average.desc' : 'popularity.desc',
                  'vote_count.gte': minVoteCount,
                  'vote_average.gte': minVoteAverage,
                  page: genrePage
                },
                timeout: 5000 // 5 second timeout
              }
            );
            
            const genreMovies = (genreMoviesResponse.data?.results || []).filter(m => m && m.id);
            genreMovies.forEach((movie, index) => {
              if (movie.id && 
                  !ratedMovieIds.has(movie.id.toString()) && 
                  !excludeIds.has(movie.id.toString()) &&
                  movie.vote_average >= minVoteAverage &&
                  movie.vote_count >= minVoteCount) {
                const score = recommendationMap.get(movie.id) || 0;
                // Check if this genre is in user's favorites - boost score if so
                const isFavoriteGenre = favoriteGenres.some(gid => 
                  movie.genre_ids && movie.genre_ids.includes(gid)
                );
                const genreBoost = isFavoriteGenre ? 8 : 0;
                
                // Quality bonus
                const qualityBonus = movie.vote_average >= 8.0 ? 6 : (movie.vote_average >= 7.5 ? 3 : 0);
                
                // Recency bonus
                let recencyBonus = 0;
                if (movie.release_date) {
                  const movieYear = new Date(movie.release_date).getFullYear();
                  if (userPreferences.prefersRecent && movieYear >= 2010) {
                    recencyBonus = 3;
                  } else if (userPreferences.prefersClassics && movieYear < 2000) {
                    recencyBonus = 3;
                  }
                }
                
                recommendationMap.set(movie.id, score + (12 * positionWeight) + genreBoost + qualityBonus + recencyBonus + (2 / (index + 1)));
              }
            });
          } catch (error) {
            console.log(`Error fetching genre movies:`, error.message);
            // Continue processing
          }
        }
        
        // Strategy 5: Use keywords for thematic recommendations
        const keywords = (movieDetails.keywords?.keywords || [])
          .filter(k => k && k.id)
          .slice(0, 3);
        if (keywords.length > 0) {
          const keywordIds = keywords.map(k => k.id).join(',');
          try {
            const keywordMoviesResponse = await axios.get(
      `https://api.themoviedb.org/3/discover/movie`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'en-US',
                  with_keywords: keywordIds,
                  sort_by: userPreferences.prefersCriticallyAcclaimed ? 'vote_average.desc' : 'popularity.desc',
                  'vote_count.gte': Math.max(200, minVoteCount),
                  'vote_average.gte': Math.max(6.5, minVoteAverage - 0.5),
                  page: 1
                },
                timeout: 5000 // 5 second timeout
              }
            );
            
            const keywordMovies = (keywordMoviesResponse.data?.results || []).filter(m => m && m.id);
            keywordMovies.forEach((movie, index) => {
              if (movie.id && 
                  !ratedMovieIds.has(movie.id.toString()) && 
                  !excludeIds.has(movie.id.toString())) {
                const score = recommendationMap.get(movie.id) || 0;
                recommendationMap.set(movie.id, score + (5 * positionWeight) + (1 / (index + 1)));
              }
            });
          } catch (error) {
            console.log(`Error fetching keyword movies:`, error.message);
            // Continue processing
          }
        }
      } catch (error) {
        console.log(`Error fetching movie details for ${ratedMovie.id}:`, error.message);
        // Continue to next movie
      }
    }
    
    // Convert map to array and sort by score
    let recommendations = Array.from(recommendationMap.entries())
      .filter(([id, score]) => id && !isNaN(parseInt(id)) && score > 0)
      .map(([id, score]) => ({ id: parseInt(id), score }));
    
    // Boost scores for movies that match multiple criteria and apply recency balance
    if (favoriteGenres.length > 0 || favoriteActors.length > 0) {
      // Fetch full info for top recommendations to boost multi-criteria matches
      const topRecIds = recommendations.slice(0, 50).map(r => r.id);
      const movieInfoPromises = topRecIds.map(id =>
        axios.get(
          `https://api.themoviedb.org/3/movie/${id}`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US',
              append_to_response: 'credits'
            },
            timeout: 2000
          }
        ).catch(() => null)
      );
      
      const movieInfoResults = await Promise.all(movieInfoPromises);
      movieInfoResults.forEach((result, index) => {
        if (result && result.data) {
          const movie = result.data;
          const rec = recommendations.find(r => r.id === topRecIds[index]);
          if (!rec) return;
          
          let boost = 0;
          
          // Genre matches
          if (favoriteGenres.length > 0 && movie.genres) {
            const movieGenres = movie.genres.map(g => g.id);
            const favoriteGenreMatches = movieGenres.filter(gid => favoriteGenres.includes(gid)).length;
            if (favoriteGenreMatches > 0) {
              boost += favoriteGenreMatches * 10;
            }
          }
          
          // Cast matches
          if (favoriteActors.length > 0 && movie.credits && movie.credits.cast) {
            const movieActorIds = movie.credits.cast
              .filter(person => person && person.order < 5) // Top 5 billed
              .map(person => person.id);
            const favoriteActorMatches = movieActorIds.filter(aid => favoriteActors.includes(aid)).length;
            if (favoriteActorMatches > 0) {
              boost += favoriteActorMatches * 12; // Slightly higher than genre
            }
          }
          
          // Multi-criteria bonus (director + genre + cast)
          const hasDirector = rec.score > 20; // Director movies have high base scores
          const hasGenre = movie.genres && movie.genres.some(g => favoriteGenres.includes(g.id));
          const hasCast = movie.credits && movie.credits.cast && 
            movie.credits.cast.some(person => favoriteActors.includes(person.id));
          
          if (hasDirector && (hasGenre || hasCast)) {
            boost += 15; // Big bonus for multi-criteria matches
          }
          
          // Recency balance
          if (movie.release_date) {
            const movieYear = new Date(movie.release_date).getFullYear();
            if (userPreferences.prefersRecent && movieYear >= 2010) {
              boost += 5;
            } else if (userPreferences.prefersClassics && movieYear < 2000) {
              boost += 5;
            } else if (!userPreferences.prefersRecent && !userPreferences.prefersClassics) {
              // User has mixed preferences, small bonus for any movie
              boost += 2;
            }
          }
          
          rec.score += boost;
        }
      });
    }
    
    // Sort by final score
    recommendations = recommendations.sort((a, b) => b.score - a.score);
    
    // If no recommendations found, fallback to top-rated
    if (recommendations.length === 0) {
      const fallbackPage = forceRefresh ? Math.floor(Math.random() * 5) + 2 : 1;
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/top_rated`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US',
            page: fallbackPage
          }
        }
      );
      
      // Filter out excluded movies
      let results = (response.data.results || [])
        .filter(m => m && m.id && !excludeIds.has(m.id.toString()));
      
      // If we need more movies and have excludeIds, try additional pages
      if (results.length < 8 && excludeIds.size > 0) {
        for (let page = fallbackPage + 1; page <= fallbackPage + 5 && results.length < 8; page++) {
          try {
            const additionalResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/top_rated`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US',
                  page: page
                },
                timeout: 3000
              }
            );
            const additionalResults = (additionalResponse.data?.results || [])
              .filter(m => m && m.id && !excludeIds.has(m.id.toString()));
            results = [...results, ...additionalResults];
          } catch (err) {
            // Continue to next page
          }
        }
      }
      
      return res.json({
        results: results.slice(0, 20),
        total_results: results.length,
        page: 1,
        total_pages: 1
      });
    }
    
    // ===== DIVERSITY FILTERING =====
    // Apply diversity constraints to ensure variety in recommendations
    // Fetch full movie details for top recommendations
    const topRecommendationIds = recommendations
      .slice(0, 50) // Fetch more to have options for diversity
      .map(r => r.id)
      .filter(id => id && !isNaN(id));
    
    if (topRecommendationIds.length === 0) {
      return res.json({
        results: [],
        total_results: 0,
        page: 1,
        total_pages: 1
      });
    }
    
    // Fetch movies in batches (TMDB allows multiple IDs)
    const movieDetailsPromises = topRecommendationIds.map(id =>
      axios.get(
        `https://api.themoviedb.org/3/movie/${id}`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US',
            append_to_response: 'credits'
          },
          timeout: 5000 // 5 second timeout
        }
      ).catch(() => null)
    );
    
    const movieDetailsResults = await Promise.all(movieDetailsPromises);
    const moviesWithDetails = movieDetailsResults
      .filter(result => result && result.data && result.data.id)
      .map(result => ({
        id: result.data.id,
        title: result.data.title || 'Unknown',
        overview: result.data.overview || '',
        release_date: result.data.release_date || '',
        poster_path: result.data.poster_path || '',
        backdrop_path: result.data.backdrop_path || '',
        vote_average: result.data.vote_average || 0,
        vote_count: result.data.vote_count || 0,
        popularity: result.data.popularity || 0,
        genres: result.data.genres || [],
        directors: (result.data.credits?.crew || [])
          .filter(person => person && person.job === 'Director')
          .map(person => person.id),
        score: recommendations.find(r => r.id === result.data.id)?.score || 0
      }))
      .filter(movie => 
        movie.vote_average >= minVoteAverage &&
        movie.vote_count >= minVoteCount &&
        !excludeIds.has(movie.id.toString())
      )
      .sort((a, b) => b.score - a.score); // Sort by score
    
    // Apply diversity filter
    const directorCount = new Map();
    const genreCount = new Map();
    const diverseMovies = [];
    const maxPerDirector = 2;
    const maxPerGenre = 3;
    
    for (const movie of moviesWithDetails) {
      // Check director diversity
      const movieDirectors = movie.directors || [];
      const hasDirectorLimit = movieDirectors.length > 0 && 
        movieDirectors.some(dirId => (directorCount.get(dirId) || 0) >= maxPerDirector);
      
      // Check genre diversity
      const movieGenres = (movie.genres || []).map(g => g.id);
      const hasGenreLimit = movieGenres.length > 0 &&
        movieGenres.some(genreId => (genreCount.get(genreId) || 0) >= maxPerGenre);
      
      // Skip if it would exceed diversity limits (unless we don't have enough movies yet)
      if (hasDirectorLimit || hasGenreLimit) {
        if (diverseMovies.length >= 8) {
          continue; // Skip this movie, we have enough
        }
        // If we need more movies, allow it but with a small penalty
        movie.score -= 5;
      }
      
      // Add the movie
      diverseMovies.push(movie);
      
      // Update counts
      movieDirectors.forEach(dirId => {
        directorCount.set(dirId, (directorCount.get(dirId) || 0) + 1);
      });
      movieGenres.forEach(genreId => {
        genreCount.set(genreId, (genreCount.get(genreId) || 0) + 1);
      });
      
      // Stop when we have enough
      if (diverseMovies.length >= 20) {
        break;
      }
    }
    
    // Re-sort by score after diversity filtering
    diverseMovies.sort((a, b) => b.score - a.score);
    
    let recommendedMovies = diverseMovies.map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      genres: movie.genres
    }));
    
    // If we don't have enough movies, fetch more from additional recommendations
    if (recommendedMovies.length < 8) {
      // Get more recommendations from the sorted list that weren't in top 50
      const additionalIds = recommendations
        .slice(50, 100)
        .map(r => r.id)
        .filter(id => id && !isNaN(id) && !excludeIds.has(id.toString()));
      
      if (additionalIds.length > 0) {
        const additionalPromises = additionalIds.slice(0, 20).map(id =>
          axios.get(
            `https://api.themoviedb.org/3/movie/${id}`,
            {
              params: {
                api_key: process.env.TMDB_API_KEY,
                language: 'en-US',
                append_to_response: 'credits'
              },
              timeout: 3000
            }
          ).catch(() => null)
        );
        
        const additionalResults = await Promise.all(additionalPromises);
        const additionalMovies = additionalResults
          .filter(result => result && result.data && result.data.id)
          .map(result => ({
            id: result.data.id,
            title: result.data.title || 'Unknown',
            overview: result.data.overview || '',
            release_date: result.data.release_date || '',
            poster_path: result.data.poster_path || '',
            backdrop_path: result.data.backdrop_path || '',
            vote_average: result.data.vote_average || 0,
            vote_count: result.data.vote_count || 0,
            popularity: result.data.popularity || 0,
            genres: result.data.genres || [],
            directors: (result.data.credits?.crew || [])
              .filter(person => person && person.job === 'Director')
              .map(person => person.id)
          }))
          .filter(movie => 
            movie.vote_average >= minVoteAverage &&
            movie.vote_count >= minVoteCount &&
            !excludeIds.has(movie.id.toString())
          );
        
        // Add additional movies with diversity check
        for (const movie of additionalMovies) {
          if (recommendedMovies.length >= 20) break;
          
          const movieDirectors = movie.directors || [];
          const movieGenres = (movie.genres || []).map(g => g.id);
          
          const hasDirectorLimit = movieDirectors.some(dirId => (directorCount.get(dirId) || 0) >= maxPerDirector);
          const hasGenreLimit = movieGenres.some(genreId => (genreCount.get(genreId) || 0) >= maxPerGenre);
          
          if (!hasDirectorLimit && !hasGenreLimit) {
            recommendedMovies.push({
              id: movie.id,
              title: movie.title,
              overview: movie.overview,
              release_date: movie.release_date,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
              vote_average: movie.vote_average,
              vote_count: movie.vote_count,
              popularity: movie.popularity,
              genres: movie.genres
            });
            
            // Update counts
            movieDirectors.forEach(dirId => {
              directorCount.set(dirId, (directorCount.get(dirId) || 0) + 1);
            });
            movieGenres.forEach(genreId => {
              genreCount.set(genreId, (genreCount.get(genreId) || 0) + 1);
            });
          }
        }
      }
    }
    
    return res.json({
      results: recommendedMovies.slice(0, 20),
      total_results: recommendedMovies.length,
      page: 1,
      total_pages: 1
    });
    
  } catch (error) {
    console.error('Get recommendations error:', error);
    // Fallback to top-rated movies
    try {
      const fallbackPage = forceRefresh ? Math.floor(Math.random() * 5) + 2 : 1;
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/top_rated`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US',
            page: fallbackPage
          },
          timeout: 5000 // 5 second timeout
        }
      );
      
      // Filter out excluded movies
      let results = (response.data?.results || [])
        .filter(m => m && m.id && !excludeIds.has(m.id.toString()));
      
      // If we need more movies and have excludeIds, try additional pages
      if (results.length < 8 && excludeIds.size > 0) {
        for (let page = fallbackPage + 1; page <= fallbackPage + 5 && results.length < 8; page++) {
          try {
            const additionalResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/top_rated`,
              {
                params: {
                  api_key: process.env.TMDB_API_KEY,
                  language: 'en-US',
                  page: page
                },
                timeout: 3000
              }
            );
            const additionalResults = (additionalResponse.data?.results || [])
              .filter(m => m && m.id && !excludeIds.has(m.id.toString()));
            results = [...results, ...additionalResults];
          } catch (err) {
            // Continue to next page
          }
        }
      }
      
      return res.json({
        results: results.slice(0, 20),
        total_results: results.length,
        page: 1,
        total_pages: 1
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError.message);
      res.status(500).json({ 
        message: 'Error fetching recommendations',
        results: [],
        total_results: 0,
        page: 1,
        total_pages: 1
      });
    }
  }
});

// Get movie cast and crew
router.get('/:id/credits', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/credits`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'en-US'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Get movie credits error:', error);
    res.status(500).json({ message: 'Error fetching movie credits' });
  }
});

// Get similar movies
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/similar`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'en-US',
          page: req.query.page || 1
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Get similar movies error:', error);
    res.status(500).json({ message: 'Error fetching similar movies' });
  }
});

module.exports = router;
