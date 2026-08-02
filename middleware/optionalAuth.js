const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Sets req.user / req.userId when a valid token is present; otherwise continues. */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    const user = await User.findById(decoded.userId).select('-password');
    if (user) {
      req.userId = user._id;
      req.user = user;
    }
  } catch (error) {
    // Invalid/expired token — treat as anonymous
  }
  next();
};

module.exports = optionalAuth;
