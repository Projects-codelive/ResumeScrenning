const userModel = require('../models/user.model')
const userService = require('../services/user.service')
const { validationResult } = require('express-validator')

module.exports.registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.status(400).json({ error: errors.array() })
    }

    const { fullname, email, password } = req.body

    // Check if user already exists
    const userExist = await userModel.findOne({ email });
    if(userExist){
      return res.status(400).json({ message: 'User Already exist'})
    }

    // Create a hashpassword to save in the database
    const hashpassword = await userModel.hashPassword(password);

    // Create a new user
    const user = await userService.createUser({
      firstname: fullname.firstname,
      lastname: fullname.lastname,
      email,
      password: hashpassword
    })

    const token = user.generateAuthToken()

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    })

    res.status(201).json({token, user, redirectTo: '/profile'})

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports.loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.status(400).json({ error: errors.array() })
    }

    const { email, password } = req.body

    // Check if user exists
    const user = await userModel.findOne({ email}).select('+password')
    if(!user){
      return res.status(400).json({ message: 'User not found' })
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password)
    if(!isMatch){
      return res.status(400).json({ message: 'Invalid password' })
    }

    // Generate token
    const token = user.generateAuthToken()

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    })

    res.status(200).json({ token, user, redirectTo: '/profile' })

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ✅ UPDATED OAUTH SUCCESS FUNCTION WITH FIX
module.exports.oauthSuccess = async (req, res) => {
  try {
    if (!req.user) {
      console.log('No user found in request');
      return res.redirect('https://resumescrenning.onrender.com/login?error=oauth_failed');
    }

    const user = req.user;

    // ✅ CRITICAL FIX: Ensure OAuth users have emailVerified: true
    if ((user.googleId || user.githubId) && !user.emailVerified) {
      console.log('🔧 Fixing OAuth user emailVerified status...');
      await userModel.findByIdAndUpdate(user._id, {
        emailVerified: true,
        registrationCompleted: true,
        isFirstTimeUser: false
      });
      user.emailVerified = true;
      console.log('✅ Updated OAuth user emailVerified to true');
    }

    const token = user.generateAuthToken();

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log('✅ OAuth success for user:', {
      email: user.email,
      provider: user.provider,
      emailVerified: user.emailVerified,
      hasGoogleId: !!user.googleId,
      hasGithubId: !!user.githubId
    });

    res.redirect(`https://resumescrenning.onrender.com/profile?token=${token}&first_login=true`);
  } catch (error) {
    console.error('OAuth success error:', error);
    res.redirect('https://resumescrenning.onrender.com/login?error=oauth_failed');
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profileData = req.body;

    // console.log('Received profile data:', JSON.stringify(profileData, null, 2));

    const updateData = {
      fullname: profileData.fullname,
      'profile.phone': profileData.profile?.phone,
      'profile.address': profileData.profile?.address,
      'profile.linkedIn': profileData.profile?.linkedIn,
      'profile.github': profileData.profile?.github,
      'profile.portfolio': profileData.profile?.portfolio,
      'profile.summary': profileData.profile?.summary,
      experience: profileData.experience || [],
      education: profileData.education || [],
      projects: profileData.projects || [],
      certifications: profileData.certifications || [],
      awards: profileData.awards || [],
      volunteer: profileData.volunteer || [],
      interests: profileData.interests || [],
      'skills.technical': profileData.skills?.technical || [],
      'skills.soft': profileData.skills?.soft || [],
      'skills.languages': (profileData.skills?.languages || []).map(lang => {
        if (typeof lang === 'string') {
          return { language: lang, proficiency: 'Intermediate' };
        }
        return lang;
      })
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // console.log('Update data being sent to MongoDB:', JSON.stringify(updateData, null, 2));

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// FIXED: Return data in the format that Profile.jsx expects
module.exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId).select('+provider');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Use the getResumeData method to return data in the expected format
    const resumeData = user.getResumeData();

    res.json({
      success: true,
      user: {
        ...user.toObject(), // Include all user fields
        ...resumeData // Add the personalInfo structure that Profile.jsx expects
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
