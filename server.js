const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/, // Allow all Vercel preview deployments
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport middleware (required for OAuth)
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'client/build')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/googleAuth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/share', require('./routes/share'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/lists', require('./routes/lists'));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movierating', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
