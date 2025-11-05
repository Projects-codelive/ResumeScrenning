import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ✅ ADD THIS IMPORT
import { useAuth } from '../Context/AuthContext';
import api from '../services/api';

const History = () => {
  const { user } = useAuth();
  const [activeHistoryTab, setActiveHistoryTab] = useState('cv-history');
  const [cvHistory, setCvHistory] = useState([]);
  const [coverLetterHistory, setCoverLetterHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch CV History
  useEffect(() => {
    if (activeHistoryTab === 'cv-history') {
      fetchCVHistory();
    }
  }, [activeHistoryTab]);

  // Fetch Cover Letter History
  useEffect(() => {
    if (activeHistoryTab === 'cover-letter-history') {
      fetchCoverLetterHistory();
    }
  }, [activeHistoryTab]);

  const fetchCVHistory = async () => {
    setLoading(true);
    try {
      // ✅ CORRECTED: Changed URL from '/cv/history' to '/api/cv-history'
      const response = await api.get('/api/cv-history');
      if (response.data.success) {
        setCvHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching CV history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoverLetterHistory = async () => {
    setLoading(true);
    try {
      // ✅ CORRECTED: Changed URL from '/cover-letter/history' to '/api/cover-letter/history'
      const response = await api.get('/api/cover-letter/history');
      if (response.data.success) {
        setCoverLetterHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cover letter history:', error);
    } finally {
      setLoading(false);
    }
  };

  // This function is no longer needed on this page but kept in case you need it elsewhere
  const handleDownloadCV = async (id) => {
    try {
      const response = await api.get(`/api/cv/download/${id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CV_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading CV:', error);
      alert('Failed to download CV');
    }
  };

  const handleDownloadCoverLetter = async (id) => {
    try {
      const response = await api.get(`/api/cover-letter/download/${id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CoverLetter_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading cover letter:', error);
      alert('Failed to download cover letter');
    }
  };

  const handleDelete = async (type, id, e) => {
    e.preventDefault(); // Prevent link navigation when clicking delete
    e.stopPropagation(); // Stop click from bubbling up to parent Link
    
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      // Corrected endpoint for CV history deletion
      const endpoint = type === 'cv' ? `/api/cv-history/${id}` : `/api/cover-letter/${id}`;
      await api.delete(endpoint);

      if (type === 'cv') {
        setCvHistory(cvHistory.filter(item => item._id !== id));
      } else {
        setCoverLetterHistory(coverLetterHistory.filter(item => item._id !== id));
      }

      alert(`${type === 'cv' ? 'CV' : 'Cover Letter'} deleted successfully!`);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f7fafc, #edf2f7)', paddingBottom: '3rem' }}>

      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '2rem', 
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            📚 History
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            View and manage your generated CVs and cover letters
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={() => setActiveHistoryTab('cv-history')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: activeHistoryTab === 'cv-history' ? '#4c51bf' : '#4a5568',
              background: activeHistoryTab === 'cv-history' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeHistoryTab === 'cv-history' ? '3px solid #4c51bf' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>📄</span>
            CV History
          </button>

          <button
            onClick={() => setActiveHistoryTab('cover-letter-history')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: activeHistoryTab === 'cover-letter-history' ? '#4c51bf' : '#4a5568',
              background: activeHistoryTab === 'cover-letter-history' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeHistoryTab === 'cover-letter-history' ? '3px solid #4c51bf' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>💼</span>
            Cover Letter History
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1rem' }}>

        {/* CV History Tab */}
        {activeHistoryTab === 'cv-history' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#2d3748' }}>
              📄 Your CV History
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
                <p>Loading...</p>
              </div>
            ) : cvHistory.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                border: '2px dashed #cbd5e0'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ fontSize: '1.25rem', color: '#4a5568', marginBottom: '0.5rem' }}>
                  No CV History Yet
                </h3>
                <p style={{ color: '#718096' }}>
                  Generate your first CV in the Dashboard to see it here!
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {cvHistory.map((cv) => (
                  // ✅ MODIFIED: Each card is now a link to the detail page
                  <Link key={cv._id} to={`/history/cv/${cv._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%'
                    }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'}
                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2d3748', marginBottom: '0.25rem' }}>
                              {cv.companyName || 'Unknown Company'}
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: '#718096' }}>
                              {cv.roleName || 'Unknown Role'}
                            </p>
                          </div>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: '#e6fffa',
                            color: '#047857',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {cv.template || 'Classic'}
                          </span>
                        </div>

                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f7fafc', borderRadius: '6px' }}>
                          <p style={{ fontSize: '0.875rem', color: '#4a5568', marginBottom: '0.25rem' }}>
                            <strong>Created:</strong> {new Date(cv.createdAt).toLocaleDateString()}
                          </p>
                          {cv.analysisResults?.score && (
                            <p style={{ fontSize: '0.875rem', color: '#4a5568', margin: 0 }}>
                              <strong>Match Score:</strong> {cv.analysisResults.score}%
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* ✅ MODIFIED: Removed download button, kept delete */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto' }}>
                         <button
                          onClick={(e) => handleDelete('cv', cv._id, e)}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#e53e3e',
                            background: 'white',
                            border: '1px solid #e53e3e',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cover Letter History Tab (This part is unchanged) */}
        {activeHistoryTab === 'cover-letter-history' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#2d3748' }}>
              💼 Your Cover Letter History
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
                <p>Loading...</p>
              </div>
            ) : coverLetterHistory.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                border: '2px dashed #cbd5e0'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ fontSize: '1.25rem', color: '#4a5568', marginBottom: '0.5rem' }}>
                  No Cover Letter History Yet
                </h3>
                <p style={{ color: '#718096' }}>
                  Generate your first cover letter in the Dashboard to see it here!
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {coverLetterHistory.map((letter) => (
                  <div key={letter._id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2d3748', marginBottom: '0.25rem' }}>
                          {letter.company || 'Unknown Company'}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#718096' }}>
                          {letter.role || 'Unknown Role'}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        v{letter.version || 1}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f7fafc', borderRadius: '6px' }}>
                      <p style={{ fontSize: '0.875rem', color: '#4a5568', marginBottom: '0.25rem' }}>
                        <strong>Created:</strong> {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#4a5568', margin: 0 }}>
                        <strong>Template:</strong> {letter.template || 'Professional'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleDownloadCoverLetter(letter._id)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'white',
                          background: '#805ad5',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={(e) => handleDelete('cover-letter', letter._id, e)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#e53e3e',
                          background: 'white',
                          border: '1px solid #e53e3e',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default History;