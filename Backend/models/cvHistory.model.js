const mongoose = require('mongoose');

const cvHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: { type: String, required: true },
  roleName: { type: String, required: true },
  originalCV: { type: String, required: true },
  improvedCV: { type: String, required: true },
  analysisResults: {
    score: Number,
    matchingSkills: [String],
    missingSkills: [String],
    suggestions: [String],
    strengths: [String], // ✅ ADDED THIS LINE
    weaknesses: [String] // ✅ ADDED THIS LINE
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CVHistory', cvHistorySchema);