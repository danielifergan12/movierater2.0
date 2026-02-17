const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// Register
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Normalize email to lowercase (since database stores emails in lowercase)
    // Note: express-validator's normalizeEmail() already normalized it, but we'll do it again to be safe
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    console.log('Registration check:', {
      originalEmail: email,
      normalizedEmail: normalizedEmail,
      originalUsername: username,
      normalizedUsername: normalizedUsername
    });

    // Check if user already exists (case-insensitive check)
    const existingUser = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { username: { $regex: new RegExp(`^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    if (existingUser) {
      console.log('Found existing user match:', {
        existingEmail: existingUser.email,
        existingUsername: existingUser.username,
        existingId: existingUser._id
      });
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    console.log('No existing user found, proceeding with registration');

    // Create new user (email will be lowercased by schema, but use normalized values)
    const user = new User({ 
      username: normalizedUsername, 
      email: normalizedEmail, 
      password 
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    // Handle duplicate key (unique email/username)
    if (error && error.code === 11000) {
      console.log('MongoDB duplicate key error:', {
        errorCode: error.code,
        errorMessage: error.message,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue
      });
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    // Handle mongoose validation errors explicitly
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
    }
    console.error('Registration error:', error);
    const msg = process.env.NODE_ENV === 'production'
      ? 'Server error during registration'
      : `Server error during registration: ${error.message}`;
    res.status(500).json({ message: msg });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, [
  body('username').optional().isLength({ min: 3, max: 20 }).trim().escape(),
  body('bio').optional().isLength({ max: 150 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, bio, profilePicture } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (JWT with 1 hour expiry)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '1h' }
    );

    // Save token and expiry to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    await user.save();

    // Generate reset link - ensure proper URL formatting
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''); // Remove trailing slash
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    console.log(`Generating password reset link for user: ${user.email}`);
    console.log(`Reset link: ${resetLink.substring(0, 50)}...`); // Log partial link for debugging

    // Try to send email
    const emailResult = await sendPasswordResetEmail(email, resetLink);

    // If email was sent successfully, return success message
    if (emailResult.success) {
      console.log(`Password reset email sent successfully to: ${email}`);
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // If email service is not configured, return the link in development mode
    // This allows testing without email configuration
    console.warn(`Email service not available. Reset link generated but not sent: ${emailResult.message}`);
    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.',
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
      note: emailResult.message
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    res.status(500).json({ message: 'Server error during password reset request. Please try again later.' });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    } catch (error) {
      console.warn('Invalid JWT token in password reset request:', error.message);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Find user by ID and verify token matches
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.warn(`User not found for reset token. User ID: ${decoded.userId}`);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (user.resetToken !== token) {
      console.warn(`Reset token mismatch for user: ${user.email}`);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if token has expired
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      console.warn(`Reset token expired for user: ${user.email}. Expiry: ${user.resetTokenExpiry}`);
      return res.status(400).json({ message: 'Reset token has expired. Please request a new password reset link.' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    console.log(`Password reset successfully for user: ${user.email}`);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid password format' });
    }
    
    res.status(500).json({ message: 'Server error during password reset. Please try again later.' });
  }
});

module.exports = router;
