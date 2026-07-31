const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/movierating';

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/,
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// MemoryStore is fine for single-process Railway + JWT auth.
// (connect-mongo v6 CJS interop was crashing boot: MongoStore.create is not a function)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'client/build')));

// Health check — before API catch-alls
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 1 = connected
  const ok = dbState === 1;
  res.status(ok ? 200 : 503).json({
    ok,
    db: ok ? 'connected' : 'disconnected',
    dbState,
  });
});

app.get('/api/auth/providers', (req, res) => {
  res.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not set. Auth and rankings will fail.');
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.error('Check Railway MONGODB_URI, Atlas Network Access (0.0.0.0/0), and DB user password.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
