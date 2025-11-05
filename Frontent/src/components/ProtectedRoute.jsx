import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();


  // console.log('ProtectedRoute - Loading:', loading, 'User:', !!user);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }


  // Check both user state and localStorage token
  const token = localStorage.getItem('token');
  // console.log('ProtectedRoute - Token exists:', !!token);
  
  if (!user && !token) {
    // console.log('No user or token - redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }


  // If we have a token but no user, let AuthContext handle the validation
  if (token && !user) {
    // console.log('Token found but no user - waiting for AuthContext');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // ✅ NEW: Email verification check for non-OAuth users
  if (user && !user.emailVerified && !user.googleId && !user.githubId) {
    console.log('Email not verified for regular user:', user.email, 'Redirecting to verification');
    return <Navigate to="/verify-email" state={{ from: location, email: user.email }} replace />;
  }


  return children;
};


export default ProtectedRoute;
