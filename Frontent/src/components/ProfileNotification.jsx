// frontend/src/components/ProfileNotification.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ProfileNotification = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      background: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: 8,
      padding: '1rem',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '350px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>⚠️ Profile Incomplete</h4>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#856404' }}>
            Complete your profile for better resume results and personalized suggestions.
          </p>
          <Link 
            to="/profile"
            style={{
              background: '#ffc107',
              color: '#212529',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 4,
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            Complete Profile
          </Link>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#856404'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ProfileNotification;
