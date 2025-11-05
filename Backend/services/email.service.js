const nodemailer = require('nodemailer');
const OTP = require('../models/otp.model');

// ✅ FIXED: createTransport (not createTransporter)
const createTransporter = () => {
  console.log('🔧 Creating Gmail transporter...');
  return nodemailer.createTransport({  // ✅ FIXED: removed 'er' from end
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const createAndSendOTP = async (email, type = 'registration') => {
  console.log('🔧 SIMPLE: Creating OTP for:', email, 'Type:', type);
  
  try {
    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    console.log('🔑 Generated OTP:', otpCode);
    
    // Save to database
    const normalizedEmail = email.toLowerCase().trim();
    await OTP.deleteMany({ email: normalizedEmail, type });
    
    const otp = new OTP({
      email: normalizedEmail,
      otp: otpCode,
      type,
      expiresAt
    });
    await otp.save();
    
    console.log('✅ OTP saved to database');
    
    // Send email
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: type === 'password_reset' ? 'Password Reset Code' : 'Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Your verification code is:</h2>
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px; font-family: monospace;">
              ${otpCode}
            </h1>
          </div>
          <p style="color: #888; font-size: 14px; text-align: center;">
            ⏰ This code expires in 10 minutes
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    
    return { success: true, message: 'OTP sent successfully' };
    
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const verifyOTP = async (email, otp, type = 'registration', deleteAfterVerify = true) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      otp: otp.toString(),
      type,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpRecord) {
      return { success: false, message: 'Invalid or expired OTP' };
    }
    
    if (deleteAfterVerify) {
      await OTP.deleteOne({ _id: otpRecord._id });
    }
    
    return { success: true, message: 'OTP verified successfully' };
    
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return { success: false, message: 'OTP verification failed' };
  }
};

// ========================================================
// ✨ NEW FEATURE: Send CV Email Function
// ========================================================
const sendCvEmail = async (toEmail, pdfBuffer, userFullname) => {
  console.log(`🔧 Creating email for: ${toEmail}`);
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Your CV App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your Personalized CV is Attached!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hello!</h2>
          <p>Thank you for using our service. Please find your personalized CV attached to this email.</p>
          <p>Best regards,<br/>The CV Builder Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `${userFullname.replace(/\s+/g, '-')}-CV.pdf`, // e.g., "John-Doe-CV.pdf"
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ CV Email sent successfully:', result.messageId);
    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    console.error('❌ Error sending CV email:', error);
    throw new Error(`Failed to send CV email: ${error.message}`);
  }
};


module.exports = { createAndSendOTP, verifyOTP, sendCvEmail }; // ✨ Added sendCvEmail
