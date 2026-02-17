const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Build callback URL - use environment variable or construct from backend URL
const getCallbackURL = () => {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  // Fallback: construct from backend URL
  const backendUrl = process.env.BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:5000';
  return `${backendUrl}/api/auth/google/callback`;
};

// Configure Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: getCallbackURL()
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      return done(null, user);
    }

    // Check if user exists with this email
    user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      if (profile.photos && profile.photos[0]) {
        user.profilePicture = profile.photos[0].value;
      }
      await user.save();
      return done(null, user);
    }

    // Create new user
    const username = profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
    user = new User({
      username: username,
      email: profile.emails[0].value,
      googleId: profile.id,
      profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
      password: '' // No password for Google OAuth users
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
  }));
} else {
  console.warn('Google OAuth not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
  try {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth not configured');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`);
    }
    
    console.log('Initiating Google OAuth flow...');
    console.log('Callback URL:', getCallbackURL());
    console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
    
    // Check if strategy exists
    const strategy = passport._strategies['google'];
    if (!strategy) {
      console.error('Google OAuth strategy not initialized');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`);
    }
    
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  } catch (error) {
    console.error('Error in Google OAuth route:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
});

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed` 
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error('Google OAuth callback: No user found');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      const user = req.user;
      console.log(`Google OAuth successful for user: ${user.email}`);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'dev_secret_change_me',
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log(`Redirecting to frontend: ${frontendUrl}/auth/google/callback`);
      res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&userId=${user._id}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      console.error('Error stack:', error.stack);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
);

module.exports = router;

