// src/Pages/CVHistoryDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api'; // 🔧 FIX: Corrected path
import { cvTemplates } from '../components/cvTemplates'; // 🔧 FIX: Corrected path
import { useAuth } from '../Context/AuthContext'; // 🔧 FIX: Corrected path

const CVHistoryDetail = () => {
  const { id } = useParams();
  const { user } = useAuth(); // ✨ NEW: Get user data from AuthContext
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [courseRecommendations, setCourseRecommendations] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // ✨ NEW: State for the email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const fetchCourseRecommendations = async (missingSkills, company, role, cvText) => {
    // ... existing code ...
    if (!missingSkills || missingSkills.length === 0) {
        return;
    }
    setLoadingCourses(true);
    try {
        const response = await api.post('/api/learning/recommend-courses', {
            missingSkills,
            company,
            role,
            userCV: cvText
        });
        if (response.data.success) {
            setCourseRecommendations(response.data.recommendations);
        }
    } catch (error) {
        console.error('Failed to fetch course recommendations:', error);
    } finally {
        setLoadingCourses(false);
    }
  };

  useEffect(() => {
    const fetchCVData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/cv-history/${id}`);
        if (response.data.success) {
          const data = response.data.data;
          setCvData(data);
          // ✨ NEW: Set default recipient email if user is available
          if (user?.email) {
            setEmailRecipient(user.email);
          }
          if (data.analysisResults?.missingSkills) {
            fetchCourseRecommendations(
              data.analysisResults.missingSkills,
              data.companyName,
              data.roleName,
              data.originalCV
            );
          }
        } else {
          setError('Failed to load CV data.');
        }
      } catch (err) {
        setError('An error occurred while fetching the CV data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCVData();
  }, [id, user]); // ✨ NEW: Added user dependency

  const generateProfessionalPDF = async (cvContent, companyName, roleName) => {
    // ... existing code ...
    if (!cvContent) {
        alert('No CV content available to download.');
        return;
    }
    try {
      setPdfLoading(true);
      const response = await api.post('/api/pdf/generate-cv-pdf', {
        profileData: {
          cvContent: cvContent,
          template: selectedTemplate
        }
      }, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `CV-${companyName}-${roleName}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ✨ NEW: Function to handle sending the email
  const handleSendEmail = async (recipient) => {
    if (!recipient) {
      setEmailError('Please enter an email address.');
      return;
    }
    if (!cvData || (!cvData.improvedCV && !cvData.originalCV)) {
      setEmailError('CV data is not available.');
      return;
    }

    setEmailLoading(true);
    setEmailSuccess('');
    setEmailError('');

    try {
      const payload = {
        toEmail: recipient,
        profileData: {
          cvContent: cvData.improvedCV || cvData.originalCV,
          template: selectedTemplate,
        },
      };

      const response = await api.post('/api/pdf/email-cv-pdf', payload);

      if (response.data.success) {
        setEmailSuccess(`Successfully sent CV to ${recipient}!`);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSuccess('');
        }, 3000);
      } else {
        setEmailError(response.data.message || 'Failed to send email.');
      }
    } catch (err) {
      console.error('Email sending error:', err);
      setEmailError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ✨ NEW: Email Modal Component
  const EmailCVModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        width: '90%',
        maxWidth: '500px',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>Send CV via Email</h2>
          <button
            onClick={() => setShowEmailModal(false)}
            disabled={emailLoading}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#999',
            }}
          >
            &times;
          </button>
        </div>

        {/* Success Message */}
        {emailSuccess && (
          <div style={{ padding: '1rem', background: '#e6fffa', color: '#047857', border: '1px solid #b2f5ea', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
            {emailSuccess}
          </div>
        )}

        {/* Error Message */}
        {emailError && (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
            {emailError}
          </div>
        )}

        {/* Send to My Email Button */}
        {user?.email && (
          <button
            onClick={() => handleSendEmail(user.email)}
            disabled={emailLoading}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              fontWeight: '500',
              color: '#4c51bf',
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'background-color 0.2s',
            }}
          >
            {emailLoading ? 'Sending...' : `✉️ Send to My Email (${user.email})`}
          </button>
        )}

        <p style={{ textAlign: 'center', color: '#666', margin: '0.5rem 0' }}>or</p>

        {/* Send to Another Email */}
        <div>
          <label htmlFor="email_recipient" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#555', marginBottom: '0.5rem' }}>
            Send to another email address:
          </label>
          <input
            type="email"
            id="email_recipient"
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
            placeholder="recipient@example.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box', // Ensures padding doesn't affect width
            }}
          />
        </div>

        {/* Final Send Button */}
        <button
          onClick={() => handleSendEmail(emailRecipient)}
          disabled={emailLoading}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '1.5rem',
            opacity: emailLoading ? 0.7 : 1,
          }}
        >
          {emailLoading ? 'Sending...' : 'Send CV'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    // ... existing code ...
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading CV Details...</div>;
  }

  if (error) {
    // ... existing code ...
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>{error}</div>;
  }
  
  if (!cvData) {
    // ... existing code ...
    return <div style={{ textAlign: 'center', padding: '3rem' }}>CV not found.</div>;
  }

  const feedback = {
      // ... existing code ...
      matchScore: cvData.analysisResults.score ? { score: cvData.analysisResults.score, matched: cvData.analysisResults.matchingSkills.length, missing: cvData.analysisResults.missingSkills.length } : null,
      recommendations: {
          strengths: cvData.analysisResults.strengths || [],
          weaknesses: cvData.analysisResults.weaknesses || [],
          structure: cvData.analysisResults.structure || { clarity: 8, formatting: 7, impact: 6, comments: [] },
      }
  };

  return (
    <> {/* ✨ NEW: Added Fragment to wrap modal */}
      {/* ✨ NEW: Render the modal if showEmailModal is true */}
      {showEmailModal && <EmailCVModal />}

      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f7fafc, #edf2f7)', padding: '2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <Link to="/history" style={{ textDecoration: 'none', color: '#4c51bf', fontWeight: '600', marginBottom: '1rem', display: 'inline-block' }}>
                  &larr; Back to History
              </Link>

              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  CV for {cvData.companyName}
              </h1>
              <p style={{ fontSize: '1.2rem', color: '#718096', marginBottom: '2rem' }}>
                  Role: {cvData.roleName}
              </p>

              <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                  {/* ... existing analysis results JSX ... */}
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1976d2' }}>
                  CV Analysis Results
                  </h2>

                  {feedback.matchScore && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Match Score</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: feedback.matchScore.score >= 70 ? '#4caf50' : feedback.matchScore.score >= 40 ? '#ff9800' : '#f44336' }}>
                          {feedback.matchScore.score}%
                      </div>
                      <div>
                          <div>Matching: {feedback.matchScore.matched}</div>
                          <div>Missing: {feedback.matchScore.missing}</div>
                      </div>
                      </div>
                  </div>
                  )}
                  
                  {(feedback.recommendations?.strengths?.length > 0 || feedback.recommendations?.weaknesses?.length > 0) && (
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem'}}>
                          
                          {feedback.recommendations?.strengths?.length > 0 && (
                              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '2px solid #22c55e' }}>
                                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#16a34a', marginBottom: '15px' }}>✅ CV Strengths</h3>
                                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0 }}>
                                      {feedback.recommendations.strengths.map((s, i) => <li key={i} style={{ marginBottom: '10px' }}>{s}</li>)}
                                  </ul>
                              </div>
                          )}

                          {feedback.recommendations?.weaknesses?.length > 0 && (
                              <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', border: '2px solid #ef4444' }}>
                                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#dc2626', marginBottom: '15px' }}>⚠️ Areas to Improve</h3>
                                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0 }}>
                                      {feedback.recommendations.weaknesses.map((w, i) => <li key={i} style={{ marginBottom: '10px' }}>{w}</li>)}
                                  </ul>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1976d2' }}>
                  Actions
                  </h2>

                  <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      {/* ... existing template selection JSX ... */}
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Choose CV Template</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {Object.values(cvTemplates).map(template => (
                          <div key={template.id} onClick={() => setSelectedTemplate(template.id)} style={{ padding: '1rem', border: selectedTemplate === template.id ? `3px solid ${template.color}` : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <h4 style={{ marginBottom: '0.5rem', color: template.color }}>{template.name}</h4>
                          <p style={{ fontSize: '0.875rem', color: '#666' }}>{template.description}</p>
                          </div>
                      ))}
                      </div>
                  </div>

                  {/* ✨ NEW: Wrapped buttons in a flex container */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      {/* Existing Download Button */}
                      <button
                          onClick={() => generateProfessionalPDF(cvData.improvedCV || cvData.originalCV, cvData.companyName, cvData.roleName)}
                          disabled={pdfLoading}
                          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '15px 40px', fontSize: '1.1rem', fontWeight: '600', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
                      >
                          {pdfLoading ? '⏳ Generating PDF...' : '📥 Download Improved CV'}
                      </button>

                      {/* ✨ NEW: "Send to Email" Button */}
                      <button
                          onClick={() => {
                            setEmailSuccess('');
                            setEmailError('');
                            setEmailRecipient(user?.email || ''); // Reset recipient to user's email
                            setShowEmailModal(true);
                          }}
                          disabled={pdfLoading} // You might want to disable this if pdfLoading is true
                          style={{
                            background: 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
                            color: 'white',
                            padding: '15px 40px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                          Send to Email
                      </button>
                  </div>

                  <div style={{ backgroundColor: '#f7fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem', maxHeight: '600px', overflowY: 'auto' }}>
                      {cvData.improvedCV || cvData.originalCV}
                  </div>
              </div>

              {/* ... existing course recommendations JSX ... */}
              {loadingCourses ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}><p>Loading course recommendations...</p></div>
              ) : (
                  courseRecommendations.length > 0 && (
                  <div style={{ marginTop: '30px', padding: '25px', backgroundColor: '#faf5ff', borderRadius: '12px', border: '2px solid #e9d5ff' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6b21a8', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          📚 Recommended Learning Resources
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#6b21a8', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>
                              {courseRecommendations.filter(c => !c.isPaid).length} FREE + {courseRecommendations.filter(c => !c.isPaid).length} PAID
                          </span>
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                      {courseRecommendations.map((course, index) => (
                        <div key={index} style={{
                          backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          border: course.isPaid ? '2px solid #fef3c7' : '2px solid #dcfce7', transition: 'all 0.2s ease',
                          cursor: 'pointer', position: 'relative', overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}>

                          <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px',
                            backgroundColor: course.isPaid ? '#fef3c7' : '#dcfce7', color: course.isPaid ? '#92400e' : '#166534' }}>
                            {course.isPaid ? course.price : 'FREE'}
                          </div>

                          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>
                            {course.platform === 'YouTube' ? '▶️' : course.platform === 'Telegram' ? '✈️' : course.platform === 'Udemy' ? '🎓' : course.platform === 'Coursera' ? '📚' : '💡'}
                          </div>

                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '8px', lineHeight: '1.4', minHeight: '40px' }}>
                            {course.title}
                          </h4>

                          {course.channelName && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '10px', fontStyle: 'italic' }}>by {course.channelName}</p>}

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#ede9fe', color: '#6b21a8', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>{course.platform}</span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '3px 8px', borderRadius: '4px' }}>⏱️ {course.duration}</span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '3px 8px', borderRadius: '4px' }}>📊 {course.difficulty}</span>
                          </div>

                          <div style={{ marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontWeight: '500' }}>
                              🎯 {course.skillGap}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5', minHeight: '60px' }}>
                            {course.description}
                          </p>

                          <a href={course.url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'block', textAlign: 'center', backgroundColor: course.isPaid ? '#f59e0b' : '#10b891', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600', transition: 'background-color 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = course.isPaid ? '#d97706' : '#059669'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = course.isPaid ? '#f59e0b' : '#10b981'; }}>
                            {course.isPaid ? '🎓 View Course →' : '▶️ Start Learning Free'}
                          </a>
                        </div>
                      ))}
                      </div>
                  </div>
                  )
              )}
          </div>
      </div>
    </> // ✨ NEW: Closed Fragment
  );
};

export default CVHistoryDetail;

