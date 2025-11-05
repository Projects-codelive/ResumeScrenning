const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  // User's information used to generate the letter
  userInfo: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: String
  },
  // Job description/requirements
  jobDescription: {
    type: String
  },
  // Template used (for future multi-template support)
  template: {
    type: String,
    default: 'professional',
    enum: ['professional', 'creative', 'technical']
  },
  // Version control for regeneration
  version: {
    type: Number,
    default: 1
  },
  // Original cover letter ID if this is a regenerated version
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoverLetter'
  }
}, {
  timestamps: true
});

// Index for faster queries
coverLetterSchema.index({ userId: 1, createdAt: -1 });
coverLetterSchema.index({ company: 1, role: 1 });

// Virtual for formatted date
coverLetterSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to create a regenerated version
coverLetterSchema.methods.regenerate = async function(newContent) {
  const CoverLetter = mongoose.model('CoverLetter');

  const newVersion = new CoverLetter({
    userId: this.userId,
    company: this.company,
    role: this.role,
    content: newContent,
    userInfo: this.userInfo,
    jobDescription: this.jobDescription,
    template: this.template,
    version: this.version + 1,
    originalId: this.originalId || this._id
  });

  return await newVersion.save();
};

// Static method to get user's cover letter history
coverLetterSchema.statics.getUserHistory = async function(userId, limit = 10) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('company role createdAt version template')
    .lean();
};

// Static method to get latest version of a cover letter
coverLetterSchema.statics.getLatestVersion = async function(originalId) {
  return await this.findOne({
    $or: [
      { _id: originalId },
      { originalId: originalId }
    ]
  })
  .sort({ version: -1 })
  .lean();
};

module.exports = mongoose.model('CoverLetter', coverLetterSchema);
