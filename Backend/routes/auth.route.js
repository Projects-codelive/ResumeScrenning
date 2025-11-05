// backend/routes/auth.route.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const passport = require('passport'); // ✅ ADDED THIS IMPORT
const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const { createAndSendOTP, verifyOTP } = require('../services/email.service');

// ✅ ADD: Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
};

// ✅ ADDED: Password validation function (same as frontend)
const validatePasswordStrength = (password) => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 capital letter';
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least 1 special symbol';
  }

  const numberCount = (password.match(/\d/g) || []).length;
  if (numberCount < 2) {
    return 'Password must contain at least 2 numbers';
  }

  return null; // No error
};

// ✅ COMPLETELY FIXED: Registration with guaranteed password saving
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullname } = req.body;

    // ✅ ADDED: Validate password strength for registration
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // ✅ CRITICAL FIX: ALWAYS hash password FIRST
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ FIXED: Always save password properly
    let user;
    if (existingUser && !existingUser.emailVerified) {
      // ✅ UPDATE existing unverified user with password
      user = await User.findOneAndUpdate(
        { email },
        {
          password: hashedPassword, // ✅ ALWAYS set password
          fullname,
          emailVerified: false,
          isFirstTimeUser: true,
          registrationCompleted: false,
          updatedAt: new Date()
        },
        { new: true }
      );
      console.log('✅ Updated existing user with password:', !!user.password);
    } else {
      // ✅ CREATE new user with password
      user = new User({
        email,
        password: hashedPassword, // ✅ ALWAYS set password
        fullname,
        emailVerified: false,
        isFirstTimeUser: true,
        registrationCompleted: false
      });
      await user.save();
      console.log('✅ Created new user with password:', !!user.password);
    }

    // ✅ VERIFICATION: Confirm password was saved
    if (!user.password) {
      console.error('🚨 CRITICAL: Password was not saved!');
      return res.status(500).json({
        success: false,
        message: 'Registration failed - password not saved'
      });
    }

    // Send OTP for email verification
    await createAndSendOTP(email, 'registration');

    res.json({
      success: true,
      message: 'Registration initiated. Please check your email for OTP verification.',
      email: email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// ✅ CRITICAL FIX: Verify Email OTP and Complete Registration WITHOUT losing password
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Verify OTP
    const otpResult = await verifyOTP(email, otp, 'registration');
    if (!otpResult.success) {
      return res.status(400).json(otpResult);
    }

    // ✅ CRITICAL FIX: Find user FIRST to check password - INCLUDE PASSWORD FIELD
    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ CRITICAL FIX: Verify password exists BEFORE updating
    if (!existingUser.password) {
      console.error('🚨 CRITICAL: User found but no password during verification!');
      return res.status(500).json({
        success: false,
        message: 'Account verification failed - missing password'
      });
    }

    console.log('✅ Password exists before verification:', !!existingUser.password);

    // ✅ CRITICAL FIX: Update ONLY verification fields, preserve password
    const user = await User.findOneAndUpdate(
      { email },
      { 
        emailVerified: true,
        registrationCompleted: true,
        // ✅ CRITICAL: Do NOT touch the password field - it stays as-is
      },
      { new: true }
    ).select('+password'); // ✅ INCLUDE PASSWORD IN RESULT

    // ✅ VERIFICATION: Confirm password still exists after update
    if (!user.password) {
      console.error('🚨 CRITICAL: Password disappeared after verification update!');
      return res.status(500).json({
        success: false,
        message: 'Account verification failed - password lost during update'
      });
    }

    console.log('✅ Password preserved after verification:', !!user.password);

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Email verified successfully! Registration completed.',
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
        emailVerified: user.emailVerified,
        isFirstTimeUser: user.isFirstTimeUser
      },
      redirectTo: 'profile' // First time users go to profile
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// ✅ FIXED: Enhanced Login with proper password validation
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ✅ ADDED: Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // ✅ CRITICAL FIX: Include password field in query
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: email
      });
    }

    // ✅ FIXED: Check if user has a password (not OAuth user)
    if (!user.password) {
      console.error('🚨 Login attempt for user without password:', user.email);
      return res.status(400).json({
        success: false,
        message: 'This account was created with social login. Please use Google or GitHub to sign in.'
      });
    }

    // ✅ FIXED: Safely compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Mark as not first time user after successful login
    if (user.isFirstTimeUser) {
      user.isFirstTimeUser = false;
      await user.save();
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
        emailVerified: user.emailVerified,
        isFirstTimeUser: false // Always false after login
      },
      redirectTo: 'dashboard' // Regular users go to dashboard
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// ========================================================
// ✅ ADDED: GOOGLE & GITHUB OAUTH ROUTES
// ========================================================

// Google Authentication Route - This is where the user starts
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Authentication Callback Route - This is where Google redirects back to
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=Google-login-failed`,
    session: false
  }),
  (req, res) => {
    const token = jwt.sign(
      { _id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // ✅ Redirect to FRONTEND, not backend
    res.redirect(`${process.env.CLIENT_URL}/profile?token=${token}&first_login=${req.user.isFirstTimeUser}`);
  }
);


// GitHub Authentication Route
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// GitHub Authentication Callback Route
router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: `${process.env.CLIENT_URL}/login?error=GitHub-login-failed`,
    session: false
  }),
  (req, res) => {
    const token = jwt.sign(
      { _id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`${process.env.CLIENT_URL}/login?token=${token}&first_login=${req.user.isFirstTimeUser}`);
  }
);


// ✅ DELETE ACCOUNT Route
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const { password, confirmationText } = req.body;
    const userId = req.user._id;
    const userEmail = req.user.email;

    console.log('🗑️ Account deletion request for user:', userEmail);

    if (confirmationText !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Please type "DELETE" to confirm account deletion'
      });
    }

    // ✅ CRITICAL FIX: Include password field when fetching user
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password (skip for OAuth users)
    if (user.password && !user.googleId && !user.githubId) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation is required'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    try {
      // Delete all OTPs and user account
      await OTP.deleteMany({ email: userEmail });
      await User.findByIdAndDelete(userId);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (cleanupError) {
      console.error('❌ Error during account cleanup:', cleanupError);
      res.status(500).json({
        success: false,
        message: 'Account deletion failed. Please try again.'
      });
    }

  } catch (error) {
    console.error('❌ Account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Account deletion failed'
    });
  }
});

// ✅ DEBUG ROUTE - Check user database
router.post('/debug-user', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('🔍 Searching for email:', email);

    // ✅ CRITICAL FIX: Include password field in all debug queries
    const exactMatch = await User.findOne({ email: email }).select('+password');
    const lowerCaseMatch = await User.findOne({ email: email.toLowerCase() }).select('+password');
    const trimmedMatch = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // Get all users with similar emails
    const similarEmails = await User.find({
      email: { $regex: email.split('@')[0], $options: 'i' }
    }).select('+password');

    console.log('Database Results:', {
      exactMatch: exactMatch ? {
        email: exactMatch.email,
        emailVerified: exactMatch.emailVerified,
        registrationCompleted: exactMatch.registrationCompleted,
        hasPassword: !!exactMatch.password
      } : null
    });

    res.json({
      success: true,
      results: {
        exactMatch,
        lowerCaseMatch,
        trimmedMatch,
        similarEmails
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ MANUAL DELETE USER ROUTE
router.post('/manual-delete-user', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('🗑️ Manual deletion request for:', email);

    // Delete user
    const userDeleted = await User.findOneAndDelete({ email });
    
    // Delete all OTPs for this email
    const otpDeleted = await OTP.deleteMany({ email });

    console.log('✅ Deleted user:', userDeleted ? 'YES' : 'NO');
    console.log('✅ Deleted OTPs:', otpDeleted.deletedCount);

    res.json({
      success: true,
      message: 'Account and OTPs deleted successfully',
      userDeleted: !!userDeleted,
      otpsDeleted: otpDeleted.deletedCount
    });

  } catch (error) {
    console.error('Manual delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Forgot password request for:', email);

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const searchEmail = email.toLowerCase().trim();
    let user = await User.findOne({
      email: searchEmail,
      emailVerified: true
    });

    if (!user) {
      const unverifiedUser = await User.findOne({
        email: searchEmail
      });

      if (unverifiedUser && !unverifiedUser.emailVerified) {
        await createAndSendOTP(email, 'password_reset');
        return res.json({
          success: true,
          message: 'Account found but not verified. Password reset code sent.',
          requiresVerification: false
        });
      }
    }

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, a reset code has been sent.'
      });
    }

    // Send password reset OTP
    await createAndSendOTP(email, 'password_reset');

    res.json({
      success: true,
      message: 'Password reset code sent to your email!'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset code. Please try again later.'
    });
  }
});

// ✅ FIXED: Reset Password with email verification update
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log('🔄 Password reset attempt for:', email);

    // ✅ ADDED: Validate password strength
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    // ✅ FIXED: Verify OTP and delete it
    const otpResult = await verifyOTP(email, otp, 'password_reset', true);

    if (!otpResult.success) {
      return res.status(400).json(otpResult);
    }

    // ✅ FIXED: Update password AND set email as verified
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const normalizedEmail = email.toLowerCase().trim();

    const updatedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { 
        password: hashedPassword,
        emailVerified: true,
        registrationCompleted: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Password reset successfully for:', email);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, type } = req.body;
    await createAndSendOTP(email, type || 'registration');

    res.json({
      success: true,
      message: 'OTP resent successfully'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

module.exports = router;