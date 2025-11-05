const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const userModel = require('../models/user.model');
const userService = require('../services/user.service');

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // ✅ FIXED: Use the specific GOOGLE_CALLBACK_URL from your .env file
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await userModel.findOne({
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        user.provider = 'google';
      }
      user.emailVerified = true;
      user.registrationCompleted = true;
      user.isFirstTimeUser = false; // Existing users are not first-timers
      
      await user.save();
      return done(null, user);
    }

    user = await userService.createOAuthUser({
      googleId: profile.id,
      firstname: profile.name.givenName,
      lastname: profile.name.familyName || '',
      email: profile.emails[0].value,
      provider: 'google',
      emailVerified: true,
      registrationCompleted: false, // Profile is not complete on first OAuth login
      isFirstTimeUser: true // This is a new user
    });

    done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    done(error, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  // ✅ FIXED: Consistent callback URL structure for GitHub
  callbackURL: `${process.env.BASE_URL}/auth/github/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    let user = await userModel.findOne({
      $or: [
        { githubId: profile.id },
        { email: email }
      ].filter(c => c.email) // Only search by email if it exists
    });

    if (user) {
      if (!user.githubId) {
        user.githubId = profile.id;
        user.provider = 'github';
      }
      user.emailVerified = true;
      user.registrationCompleted = true;
      user.isFirstTimeUser = false;
      
      await user.save();
      return done(null, user);
    }
    
    const finalEmail = email || `${profile.username}@github.local`; // Fallback email
    const displayName = profile.displayName || profile.username;
    const nameParts = displayName.split(' ');

    user = await userService.createOAuthUser({
      githubId: profile.id,
      firstname: nameParts[0] || profile.username,
      lastname: nameParts.slice(1).join(' ') || '',
      email: finalEmail,
      provider: 'github',
      emailVerified: true,
      registrationCompleted: false, // Profile is not complete on first OAuth login
      isFirstTimeUser: true // This is a new user
    });

    done(null, user);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    done(error, null);
  }
}));

module.exports = passport;