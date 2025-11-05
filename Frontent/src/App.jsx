// frontend/src/App.jsx

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileNotification from "./components/ProfileNotification";

// ✅ CORRECT: Pages folder imports
import Home from "./Pages/Home";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Profile from "./Pages/Profile";
import Dashboard from "./Pages/Dashboard.jsx";
import History from "./Pages/History.jsx";
import CVHistoryDetail from "./Pages/CVHistoryDetail.jsx"; // ✅ 1. ADD THIS NEW IMPORT

// ✅ UPDATED: Components folder imports - SEPARATE COMPONENTS
import EmailVerification from "./components/EmailVerification";

import PasswordResetVerification from "./components/PasswordResetVerification"; // ✅ NEW: For PASSWORD RESET
import ForgotPassword from "./components/ForgotPassword";

const AppRoutes = () => {
  const [searchParams] = useSearchParams();
  const { login, user, profileComplete, showProfileNotification, setShowProfileNotification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = searchParams.get("token");
    const firstLogin = searchParams.get("first_login");
    const error = searchParams.get("error");

    if (token && !user) {
      const userData = { token };
      login(userData, token);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Redirect to profile on first login
      if (firstLogin === 'true') {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    } else if (error) {
      console.error('OAuth error:', error);
      navigate('/login?error=' + encodeURIComponent(error), { replace: true });
    }
  }, [searchParams, login, user, navigate]);

  // Check for profile completeness on protected routes
  useEffect(() => {
    if (user && user.emailVerified && !profileComplete &&
      !['/profile', '/login', '/register', '/', '/verify-email', '/reset-password-verify', '/forgot-password'].includes(location.pathname)) {
      // Don't redirect, just show notification
      setShowProfileNotification(true);
    }
  }, [user, profileComplete, location.pathname, setShowProfileNotification]);

  return (
    <>
      {showProfileNotification && (
        <ProfileNotification onClose={() => setShowProfileNotification(false)} />
      )}
      <Routes>
        {/* ✅ Default route */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* ✅ UPDATED: SEPARATE OTP VERIFICATION ROUTES */}
        {/* 📧 Email Verification - for NEW USER registration */}
        <Route path="/verify-email" element={<EmailVerification />} />

        <Route path="/otp-verification" element={<EmailVerification />} />
        {/* 🔑 Password Reset Verification - for EXISTING USER password reset */}
        <Route path="/reset-password-verify" element={<PasswordResetVerification />} />
        
        {/* ✅ Forgot Password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ✅ Protected routes - require authentication AND email verification */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } />

        {/* ✅ 2. ADD THIS NEW ROUTE FOR THE DETAIL PAGE */}
        <Route path="/history/cv/:id" element={
            <ProtectedRoute>
                <CVHistoryDetail />
            </ProtectedRoute>
        } />
      </Routes>
    </>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <Navbar />
      <AppRoutes />
    </AuthProvider>
  </Router>
);


export default App;