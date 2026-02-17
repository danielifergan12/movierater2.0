# Add "Find by Genre" Feature to Home Page

## Overview
Add a new "Find by Genre" tab next to "Suggested for You" on the home page that allows users to browse movies by genre. When clicking a genre, navigate to a page showing highly rated movies in that genre.

## Files to Modify/Create
- `client/src/pages/Home.js` - Add new tab and genre selection UI
- `client/src/pages/GenreMovies.js` - New page to display movies by genre
- `client/src/App.js` - Add route for genre movies page
- `client/src/contexts/MovieContext.js` - Add function to fetch genres list (if needed)

## Implementation Details

### 1. Update Home.js - Add "Find by Genre" Tab
- Add a second tab next to "Suggested for You" tab
- Tab should be labeled "Find by Genre"
- When active, show genre selection UI instead of recommendations

### 2. Create Genre Selection UI
- Display genre boxes in a grid layout
- Each box should show the genre name (Horror, Action, Romance, Comedy, Drama, Sci-Fi, Thriller, etc.)
- Style boxes consistently with the app's design (gradient borders, hover effects)
- Make boxes clickable and navigate to genre movies page

### 3. Create GenreMovies Page
- New page component at `client/src/pages/GenreMovies.js`
- Accept genre ID and name as route parameters
- Fetch highly rated movies for the genre using existing API endpoint
- Display movies in a grid similar to Home page
- Show genre name as page title
- Include pagination or "Load More" functionality
- Allow users to rate movies from this page

### 4. Update Backend API (if needed)
- Check if `/api/movies/genre/:genreId` endpoint supports sorting by rating
- May need to modify to sort by `vote_average.desc` instead of `popularity.desc` for "highly rated"
- Ensure endpoint returns movies sorted by rating (highest first)

### 5. Add Route in App.js
- Add route: `/genre/:genreId` that renders GenreMovies component
- Pass genre ID and name to the component

### 6. Fetch Genres List
- Use existing `/api/movies/genres` endpoint to get list of genres
- Display common/popular genres in the genre selection UI
- May want to filter to show only most common genres (Action, Comedy, Drama, Horror, Romance, Sci-Fi, Thriller, etc.)

## UI/UX Considerations
- Genre boxes should be visually appealing with hover effects
- Responsive design for mobile and desktop
- Loading states when fetching movies
- Error handling if genre fetch fails
- Consistent styling with rest of app

