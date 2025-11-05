import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import OTPVerificationComponent from '../components/OTPVerification';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const email = location.state?.email;
  const type = location.state?.type || 'registration';
  const message = location.state?.message;

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSuccess = async (result) => {
    try {
      if (type === 'registration') {
        // Registration OTP verified successfully
        console.log('Registration verified:', result);
        
        const { token, user } = result;
        localStorage.setItem('token', token);
        document.cookie = `token=${token}; expires=${new Date(Date.now() + 24*60*60*1000).toUTCString()}; path=/`;
        login(user, token);
        navigate('/profile');
        
      } else if (type === 'password_reset') {
        // Password reset OTP verified, proceed to reset form
        navigate('/reset-password', {
          state: {
            email,
            verifiedOtp: result.verifiedOtp
          }
        });
      }
    } catch (error) {
      console.error('Success handler error:', error);
    }
  };

  const handleBack = () => {
    if (type === 'registration') {
      navigate('/register');
    } else {
      navigate('/forgot-password');
    }
  };

  if (!email) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-600">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {type === 'registration' ? 'Verify your email' : 'Enter reset code'}
          </h2>
          {message && (
            <p className="mt-2 text-center text-sm text-green-600">
              {message}
            </p>
          )}
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <OTPVerificationComponent
            email={email}
            type={type}
            onSuccess={handleSuccess}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
