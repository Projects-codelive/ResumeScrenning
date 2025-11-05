const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async function auth(req, res, next) {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id || decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // ✅ FIXED: Only check email verification for protected user routes, not auth routes
    const isAuthRoute = req.path.includes('/auth/');
    
    if (!isAuthRoute && !user.emailVerified && !user.googleId && !user.githubId) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email to access this resource.',
        requiresEmailVerification: true,
        email: user.email
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};
