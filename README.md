# ReelList - Movie Rating Website

A social movie rating platform inspired by Beli, where users can discover, rate, and share their favorite movies with friends.

## Features

### Core Features
- **User Authentication** - Register, login, and manage user profiles
- **Movie Discovery** - Search and browse movies using The Movie Database (TMDB) API
- **Rating System** - Rate movies from 1-5 stars with detailed reviews
- **Social Feed** - Follow friends and see their movie ratings and reviews
- **Personal Recommendations** - Get movie suggestions based on your preferences
- **User Profiles** - View user stats, reviews, and follow/unfollow users

### Advanced Features
- **Photo Reviews** - Upload photos with your movie reviews
- **Mood Tags** - Tag your reviews with emotions (excited, romantic, etc.)
- **Review Interactions** - Like and comment on reviews
- **Trending Content** - Discover popular movies and reviews
- **Genre Filtering** - Browse movies by genre
- **Achievement System** - Unlock achievements for movie watching milestones

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for image storage
- **The Movie Database (TMDB)** API for movie data

### Frontend
- **React.js** with Material-UI
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- TMDB API key
- Cloudinary account (optional, for image uploads)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd movie-rating-app
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**
   - Copy `env.example` to `.env`
   - Fill in your environment variables:
     ```
     MONGODB_URI=mongodb://localhost:27017/movierating
     JWT_SECRET=your_jwt_secret_key_here
     CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret
     TMDB_API_KEY=your_tmdb_api_key_here
     OMDB_API_KEY=your_omdb_api_key_here_optional
     ```

5. **Get TMDB API Key**
   - Visit [TMDB API](https://www.themoviedb.org/settings/api)
   - Create an account and request an API key
   - Add the key to your `.env` file

6. **Start MongoDB**
   ```bash
   mongod
   ```

7. **Run the application**
   ```bash
   # Start the backend server
   npm run dev

   # In a new terminal, start the frontend
   cd client
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Movies
- `GET /api/movies/search` - Search movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/trending/week` - Get trending movies
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/genre/:genreId` - Get movies by genre
- `GET /api/movies/recommendations/personal` - Get personal recommendations

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/movie/:movieId` - Get movie reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `PUT /api/reviews/:reviewId` - Update review
- `DELETE /api/reviews/:reviewId` - Delete review
- `POST /api/reviews/:reviewId/like` - Like/unlike review
- `POST /api/reviews/:reviewId/comments` - Add comment

### Users
- `GET /api/users/:userId` - Get user profile
- `POST /api/users/:userId/follow` - Follow/unfollow user
- `GET /api/users/:userId/followers` - Get user followers
- `GET /api/users/:userId/following` - Get user following
- `GET /api/users/search/:query` - Search users

### Feed
- `GET /api/feed/personal` - Get personalized feed
- `GET /api/feed/trending` - Get trending reviews
- `GET /api/feed/recent` - Get recent reviews
- `GET /api/feed/genre/:genre` - Get reviews by genre

## Usage

1. **Register/Login** - Create an account or login to start rating movies
2. **Search Movies** - Use the search bar to find movies you want to rate
3. **Rate Movies** - Click on a movie to view details and write a review
4. **Follow Users** - Follow friends to see their reviews in your feed
5. **Discover Content** - Browse trending movies and reviews
6. **Build Your Profile** - Your profile shows your movie stats and reviews

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Deploying to Vercel (Recommended)

1. **Push your code to GitHub** (see GitHub Setup below)

2. **Deploy Backend:**
   - Go to [Vercel](https://vercel.com) and sign up/login
   - Click "New Project" and import your GitHub repository
   - Set the root directory to the project root (not `client`)
   - Add environment variables from your `.env` file
   - Deploy

3. **Deploy Frontend:**
   - In Vercel, create another project
   - Set root directory to `client`
   - Add environment variables (if needed)
   - Update API calls in `client/src` to use your backend URL
   - Deploy

### Deploying to Heroku

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set TMDB_API_KEY=your_tmdb_key
   # ... add all other env variables
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Deploying to Netlify

1. **Build the React app:**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy:**
   - Go to [Netlify](https://netlify.com)
   - Drag and drop the `client/build` folder
   - Or connect your GitHub repo and set build command: `cd client && npm run build`
   - Set publish directory: `client/build`

### GitHub Setup

1. **Create a GitHub repository:**
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (don't initialize with README)

2. **Connect and push:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

3. **Important:** Never commit your `.env` file! It's already in `.gitignore`

## Environment Variables

Make sure to set these in your deployment platform:

- `MONGODB_URI` - MongoDB connection string (use MongoDB Atlas for production)
- `JWT_SECRET` - Secret key for JWT tokens
- `TMDB_API_KEY` - The Movie Database API key (required)
- `OMDB_API_KEY` - OMDB API key for IMDB ratings (optional)
- `CLOUDINARY_*` - Cloudinary credentials (optional, for image uploads)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie data
- [OMDB API](http://www.omdbapi.com/) for IMDB ratings
- [Material-UI](https://mui.com/) for the UI components
- [Belie](https://beli.com/) for inspiration on the social rating concept
