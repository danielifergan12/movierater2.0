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
    
    // FIRST: Analyze user's genre preferences from their rated movies
    const genreFrequency = new Map();
    const genreDetailsPromises = topRatedMovies.slice(0, 10).map(async (ratedMovie) => {
      try {
        const movieDetailsResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${ratedMovie.id}`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US'
            },
            timeout: 3000
          }
        );
        return movieDetailsResponse.data?.genres || [];
      } catch (error) {
        return [];
      }
    });
    
    const genreDetailsResults = await Promise.all(genreDetailsPromises);
    genreDetailsResults.forEach(genres => {
      genres.forEach(genre => {
        if (genre && genre.id) {
          genreFrequency.set(genre.id, (genreFrequency.get(genre.id) || 0) + 1);
        }
      });
    });
    
    // Get top 3-5 favorite genres (most frequently rated)
    const favoriteGenres = Array.from(genreFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    
    // Map to store recommendations with scores
    const recommendationMap = new Map();
    
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
              sort_by: 'vote_average.desc',
              'vote_count.gte': 1000,  // Much higher threshold - only well-known movies
              'vote_average.gte': 7.5,  // Higher quality threshold
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
              movie.vote_average >= 7.5 &&  // Stricter quality filter
              movie.vote_count >= 1000) {   // Only well-reviewed movies
            const score = recommendationMap.get(movie.id) || 0;
            // High score for favorite genres - prioritize these
            const genreMatchScore = favoriteGenres.some(gid => 
              movie.genre_ids && movie.genre_ids.includes(gid)
            ) ? 25 : 15;
            recommendationMap.set(movie.id, score + genreMatchScore + (5 / (index + 1)));
          }
        });
      } catch (error) {
        console.log(`Error fetching favorite genre movies:`, error.message);
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
        
        // Score and add similar movies - only high quality
        similarMovies.forEach((movie, index) => {
          if (movie.id && 
              !ratedMovieIds.has(movie.id.toString()) &&
              !excludeIds.has(movie.id.toString()) &&
              movie.vote_average >= 7.0 &&  // Higher quality threshold
              movie.vote_count >= 500) {    // More votes = more reliable
            const score = recommendationMap.get(movie.id) || 0;
            // Higher score for movies similar to higher-ranked movies
            const positionWeight = (topRatedMovies.length - topRatedMovies.indexOf(ratedMovie)) / topRatedMovies.length;
            recommendationMap.set(movie.id, score + (10 * positionWeight) + (5 / (index + 1)));
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
            
            // Filter for director role and HIGH QUALITY movies only
            const directorMovies = (directorMoviesResponse.data?.crew || [])
              .filter(movie => 
                movie && 
                movie.id &&
                movie.job === 'Director' && 
                movie.vote_average >= 7.2 &&  // Higher quality threshold for directors
                movie.vote_count >= 500 &&    // More votes = more reliable
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
                // Directors are weighted more heavily than genres
                const directorScore = 30 * positionWeight; // Increased from 15
                recommendationMap.set(movie.id, score + directorScore + (5 / (index + 1)));
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
                  sort_by: sortBy,
                  'vote_count.gte': 1000,  // Much higher threshold - only well-known movies
                  'vote_average.gte': 7.5, // Higher quality threshold
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
                  movie.vote_average >= 7.5 &&  // Stricter quality filter
                  movie.vote_count >= 1000) {   // Only well-reviewed movies
                const score = recommendationMap.get(movie.id) || 0;
                // Check if this genre is in user's favorites - boost score if so
                const isFavoriteGenre = favoriteGenres.some(gid => 
                  movie.genre_ids && movie.genre_ids.includes(gid)
                );
                const genreBoost = isFavoriteGenre ? 8 : 0;
                recommendationMap.set(movie.id, score + (12 * positionWeight) + genreBoost + (2 / (index + 1)));
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
                  sort_by: 'vote_average.desc',
                  'vote_count.gte': 200,
                  'vote_average.gte': 7.0,
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
    
    // Boost scores for movies that match user's favorite genres
    if (favoriteGenres.length > 0) {
      // Fetch genre info for top recommendations to boost favorite genres
      const topRecIds = recommendations.slice(0, 50).map(r => r.id);
      const genreInfoPromises = topRecIds.map(id =>
        axios.get(
          `https://api.themoviedb.org/3/movie/${id}`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'en-US'
            },
            timeout: 2000
          }
        ).catch(() => null)
      );
      
      const genreInfoResults = await Promise.all(genreInfoPromises);
      genreInfoResults.forEach((result, index) => {
        if (result && result.data && result.data.genres) {
          const movieGenres = result.data.genres.map(g => g.id);
          const favoriteGenreMatches = movieGenres.filter(gid => favoriteGenres.includes(gid)).length;
          if (favoriteGenreMatches > 0) {
            // Boost score significantly for favorite genre matches
            const rec = recommendations.find(r => r.id === topRecIds[index]);
            if (rec) {
              rec.score += favoriteGenreMatches * 10;
            }
          }
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
    
    // Fetch full movie details for top recommendations
    const topRecommendationIds = recommendations
      .slice(0, 30)
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
            language: 'en-US'
          },
          timeout: 5000 // 5 second timeout
        }
      ).catch(() => null)
    );
    
    const movieDetailsResults = await Promise.all(movieDetailsPromises);
    let recommendedMovies = movieDetailsResults
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
        genres: result.data.genres || []
      }))
      .filter(movie => 
        movie.vote_average >= 7.0 &&  // Higher quality threshold
        movie.vote_count >= 500 &&    // More votes = more reliable
        !excludeIds.has(movie.id.toString())
      );
    
    // If we don't have enough movies and have excludeIds, fetch more from additional pages
    if (recommendedMovies.length < 8 && excludeIds.size > 0) {
      // Get more recommendations from the sorted list
      const additionalIds = recommendations
        .slice(30, 60)
        .map(r => r.id)
        .filter(id => id && !isNaN(id) && !excludeIds.has(id.toString()));
      
      if (additionalIds.length > 0) {
        const additionalPromises = additionalIds.slice(0, 20).map(id =>
          axios.get(
            `https://api.themoviedb.org/3/movie/${id}`,
            {
              params: {
                api_key: process.env.TMDB_API_KEY,
                language: 'en-US'
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
            genres: result.data.genres || []
          }))
          .filter(movie => 
            movie.vote_average >= 7.0 &&  // Higher quality threshold
            movie.vote_count >= 500 &&    // More votes = more reliable
            !excludeIds.has(movie.id.toString())
          );
        
        recommendedMovies = [...recommendedMovies, ...additionalMovies];
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

module.exports = router;
