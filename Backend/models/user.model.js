const mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

  fullname: {
    firstname: {
      type: String,
      required: true,
      minlength: [3, 'First Name must be at least 3 characters long'],
    },
    lastname: {
      type: String,
      // ✅ FIX: Custom validator that allows empty/short lastname for OAuth users
      validate: {
        validator: function(value) {
          // If this is an OAuth user (has googleId or githubId), allow any lastname
          if (this.googleId || this.githubId) {
            return true; // Allow any length for OAuth users
          }
          // For regular users, require minimum 3 characters
          return !value || value.length >= 3;
        },
        message: 'Last Name must be at least 3 characters long'
      }
    },
  },

  email: {
    type: String,
    required: true,
    unique: true,
    minlength: [5, 'Email must be at least 5 characters long'],
  },

  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.githubId;
    },
    select: false,
  },

  // OAuth fields
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },

  githubId: {
    type: String,
    sparse: true,
    unique: true
  },

  provider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },

  // NEW FIELDS FOR EMAIL VERIFICATION AND USER TRACKING
  emailVerified: {
    type: Boolean,
    default: false
  },

  isFirstTimeUser: {
    type: Boolean,
    default: true
  },

  registrationCompleted: {
    type: Boolean,
    default: false
  },

  // Resume Information
  profile: {
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    linkedIn: String,
    github: String,
    portfolio: String,
    profileImage: String,
    summary: {
      type: String,
      maxlength: [500, 'Summary must be less than 500 characters']
    }
  },

  // Work Experience
  experience: [{
    company: {
      type: String,
    },
    position: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: Date,
    isCurrentJob: {
      type: Boolean,
      default: false
    },
    location: String,
    description: {
      type: String,
      maxlength: [1000, 'Description must be less than 1000 characters']
    },
    responsibilities: [String],
    achievements: [String]
  }],

  // Education
  education: [{
    institution: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    gpa: Number,
    location: String,
    description: String
  }],

  // Skills
  skills: {
    technical: [String],
    soft: [String],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Native']
      }
    }]
  },

  // Projects
  projects: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: [500, 'Project description must be less than 500 characters']
    },
    technologies: [String],
    startDate: Date,
    endDate: Date,
    projectUrl: String,
    githubUrl: String,
    images: [String]
  }],

  // Certifications
  certifications: [{
    name: {
      type: String,
      required: true
    },
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
  }],

  // Awards and Achievements
  awards: [{
    title: {
      type: String,
    },
    issuer: String,
    date: Date,
    description: String
  }],

  // Volunteer Experience
  volunteer: [{
    organization: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],

  // Interests/Hobbies
  interests: [String],

}, {
  timestamps: true
});

// Existing methods
userSchema.methods.generateAuthToken = function(){
  const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET, {expiresIn: '24h'});
  return token;
};

userSchema.methods.comparePassword = async function(password){
  return await bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

// Additional helper methods for resume building
userSchema.methods.getResumeData = function() {
  return {
    personalInfo: {
      fullname: this.fullname,
      email: this.email,
      phone: this.profile?.phone,
      address: this.profile?.address,
      linkedIn: this.profile?.linkedIn,
      github: this.profile?.github,
      portfolio: this.profile?.portfolio,
      summary: this.profile?.summary
    },
    experience: this.experience,
    education: this.education,
    skills: this.skills,
    projects: this.projects,
    certifications: this.certifications,
    awards: this.awards,
    volunteer: this.volunteer,
    interests: this.interests
  };
};

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;
