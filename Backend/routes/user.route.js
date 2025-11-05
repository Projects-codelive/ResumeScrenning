const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const passport = require('passport')
const userController = require('../controllers/user.controller')

// FIX: Change from destructuring to default import
const authenticateToken = require('../middleware/auth.middleware')

// Custom password validator function
const strongPasswordValidator = (value) => {
  // Check for at least 6 characters
  if (value.length < 6) {
    return false;
  }

  // Check for at least 1 capital letter
  const hasCapital = /[A-Z]/.test(value);
  
  // Check for at least 1 special symbol
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
  
  // Check for at least 2 numbers
  const numberCount = (value.match(/\d/g) || []).length;
  
  return hasCapital && hasSpecial && numberCount >= 2;
}

// Registration route
router.post('/register', [
  body('email').isEmail().withMessage('Invalid email'),
  body('fullname.firstname').isLength({ min: 3}).withMessage('First name must be at least 3 characters long'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .custom(strongPasswordValidator)
    .withMessage('Password must be at least 6 characters and contain: 1 capital letter, 1 special symbol, and 2 numbers'),
], userController.registerUser)

// Login route
router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .custom(strongPasswordValidator)
    .withMessage('Password must be at least 6 characters and contain: 1 capital letter, 1 special symbol, and 2 numbers'),
], userController.loginUser)

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  userController.oauthSuccess
);

// GitHub OAuth routes
router.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  userController.oauthSuccess
);

// Protected profile routes
router.get('/profile', authenticateToken, userController.getProfile)
router.put('/profile', authenticateToken, userController.updateProfile)

module.exports = router;
