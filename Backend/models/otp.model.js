// backend/models/otp.model.js

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['registration', 'password_reset'], required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// ✅ TEMPORARILY DISABLE TTL INDEX FOR TESTING
// Auto-delete expired OTPs
// otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ✅ ADD TTL INDEX WITH BUFFER TIME
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 }); // 60 seconds buffer

module.exports = mongoose.model('OTP', otpSchema);
