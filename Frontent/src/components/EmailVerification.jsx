import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../Context/AuthContext';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Get email and type from navigation state or default values
  const email = location.state?.email || 'pranaygupta16june@gmail.com'; // Use your registered email as fallback
  const type = location.state?.type || 'registration';
  const message = location.state?.message || 'Please verify your email';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-focus and handle input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    if (!/^[0-9]*$/.test(value)) return; // Only numbers allowed

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // ✅ FIXED: Only auto-submit for registration, not password reset
    if (newOtp.every(digit => digit !== '') && value !== '' && type === 'registration') {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      
      // ✅ FIXED: Only verify OTP, don't reset password yet
      if (type === 'registration') {
        console.log('🔧 About to call authAPI.verifyEmail with:', { email, otp: otpCode, type }); // ✅ ADDED DEBUG
        console.log('🔧 authAPI object:', authAPI); // ✅ ADDED DEBUG
        console.log('🔧 verifyEmail function exists?', typeof authAPI.verifyEmail); // ✅ ADDED DEBUG
        
        response = await authAPI.verifyEmail({
          email,
          otp: otpCode
        });
        
        console.log('✅ Got response from verifyEmail:', response.data); // ✅ ADDED DEBUG
        
        if (response.data.success) {
          // Auto-login after successful verification
          if (response.data.token && response.data.user) {
            localStorage.setItem('token', response.data.token);
            document.cookie = `token=${response.data.token}; expires=${new Date(Date.now() + 24*60*60*1000).toUTCString()}; path=/`;
            login(response.data.user, response.data.token);
            navigate('/profile');
          } else {
            navigate('/login');
          }
        }
      } else if (type === 'password_reset') {
        console.log('🔧 About to call authAPI.verifyResetOTP with:', { email, otp: otpCode, type }); // ✅ ADDED DEBUG
        
        // ✅ Use the new verification endpoint for password reset OTP
        response = await authAPI.verifyResetOTP({
          email,
          otp: otpCode
        });
        
        console.log('✅ Got response from verifyResetOTP:', response.data); // ✅ ADDED DEBUG
        
        if (response.data.success) {
          // Navigate to reset password form
          navigate('/reset-password', {
            state: { email, verifiedOtp: otpCode }
          });
        }
      }

    } catch (error) {
      console.error('❌ OTP verification error:', error); // ✅ ENHANCED DEBUG
      console.error('❌ Error details:', error.response?.data); // ✅ ADDED DEBUG
      console.error('❌ Full error object:', error); // ✅ ADDED DEBUG
      
      setError(error.response?.data?.message || 'OTP verification failed');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      
      // ✅ FIXED: Use correct resend endpoint for password reset
      if (type === 'password_reset') {
        await authAPI.forgotPassword({ email });
      } else {
        await authAPI.resendOTP({ email, type });
      }
      
      setTimeLeft(600);
      setCanResend(false);
      setError('');
      setOtp(['', '', '', '', '', '']);
      alert('OTP resent successfully!');
    } catch (error) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {type === 'registration' ? 'Email Verification' : 'Enter Reset Code'}
            </h1>
            <p className="text-gray-600 mb-2">
              We've sent a 6-digit code to
            </p>
            <p className="text-blue-600 font-medium">{email}</p>
            <p className="text-sm text-gray-500 mt-2">Code expires in {formatTime(timeLeft)}</p>
          </div>

          {/* OTP Input */}
          <div className="flex justify-center space-x-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                disabled={loading}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleVerifyOtp()}
            disabled={loading || otp.some(digit => digit === '')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </button>

          {/* Resend Section */}
          <div className="text-center mb-4">
            <p className="text-gray-600 text-sm mb-2">
              Didn't receive the code? Check your spam folder or try resending.
            </p>
            {canResend ? (
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm underline disabled:opacity-50"
              >
                Resend Code
              </button>
            ) : (
              <p className="text-gray-500 text-sm">
                Resend available in {formatTime(timeLeft)}
              </p>
            )}
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => navigate(type === 'registration' ? '/register' : '/forgot-password')}
              className="text-gray-600 hover:text-gray-700 text-sm flex items-center justify-center mx-auto"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to {type === 'registration' ? 'Register' : 'Forgot Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
