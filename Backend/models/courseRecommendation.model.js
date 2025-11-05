const mongoose = require('mongoose');

const courseRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  missingSkills: [{
    type: String
  }],
  recommendations: [{
    title: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    skillGap: {
      type: String,
      required: true
    },
    duration: {
      type: String
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced']
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    price: {
      type: String
    },
    rating: {
      type: Number
    },
    description: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CourseRecommendation', courseRecommendationSchema);
