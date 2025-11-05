import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import api from '../services/api';
import companyData from '../assets/companies.json';

const CoverLetterGenerator = () => {
  // State management
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(false);

  // Company and role selection
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleOptions, setRoleOptions] = useState([]);

  // User info (extracted from CV or manual)
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: ''
  });

  // Generated cover letter
  const [coverLetter, setCoverLetter] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Company options for dropdown
  const companyOptions = companyData.map(c => ({
    label: c.name,
    value: c.id
  }));

  // Update role options when company changes
  useEffect(() => {
    if (selectedCompany) {
      const company = companyData.find(c => c.id === selectedCompany.value);
      if (company && company.roles) {
        const options = company.roles.map(role => ({
          label: role,
          value: role
        }));
        setRoleOptions(options);
        setSelectedRole(null);
      }
    } else {
      setRoleOptions([]);
      setSelectedRole(null);
    }
  }, [selectedCompany]);

  // Handle CV file upload and extract info
  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCvFile(file);
    setLoading(true);
    setCvUploaded(false);

    try {
      const formData = new FormData();
      formData.append('cv', file);

      const response = await api.post('/api/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const parsedCV = response.data.data.parsedSections;
        setUserInfo({
            name: parsedCV.name || '',
            email: parsedCV.contact?.email || '',
            phone: parsedCV.contact?.phone || '',
            skills: parsedCV.skills || [],
            experience: parsedCV.experience.map(exp => `${exp.position} at ${exp.company}`).join(', ') || ''
        });
        setCvUploaded(true);
      }
    } catch (error) {
      console.error('Error uploading CV:', error);
      alert('Failed to upload CV. Please try again.');
      setCvUploaded(false);
    } finally {
      setLoading(false);
    }
  };

  // Generate cover letter
  const handleGenerate = async () => {
    if (!selectedCompany || !selectedRole) {
      alert('Please select both a company and a role.');
      return;
    }

    if (!userInfo.name || !userInfo.email) {
      alert('Please ensure your name and email are filled in, either by uploading a CV or entering them manually.');
      return;
    }

    setGenerating(true);
    setCoverLetter(null);

    try {
      const response = await api.post('/api/cover-letter/generate', {
        userInfo,
        company: selectedCompany.label,
        role: selectedRole.label,
        jobDescription: '',
        template: 'professional'
      });

      if (response.data.success) {
        setCoverLetter(response.data.data);
        setEditedContent(response.data.data.content);
        alert('✅ Cover letter generated successfully!');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate cover letter
  const handleRegenerate = async () => {
    if (!coverLetter || !coverLetter.id) return;
    setGenerating(true);
    try {
      const response = await api.post(`/api/cover-letter/regenerate/${coverLetter.id}`);
      if (response.data.success) {
        setCoverLetter(response.data.data);
        setEditedContent(response.data.data.content);
        alert(`✅ Generated new version ${response.data.data.version}!`);
      }
    } catch (error) {
      console.error('Error regenerating:', error);
      alert('Failed to regenerate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Download cover letter as PDF
  const handleDownload = async () => {
    if (!coverLetter || !coverLetter.id) return;
    try {
      const response = await api.get(`/api/cover-letter/download/${coverLetter.id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CoverLetter_${selectedCompany.label}_${selectedRole.label}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download. Please try again.');
    }
  };

  // Update user info manually
  const handleUserInfoChange = (field, value) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '600', color: '#1a202c', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          💼 Cover Letter Generator
        </h2>
        <p style={{ color: '#718096', fontSize: '1rem' }}>
          Create professional cover letters tailored to your target role
        </p>
      </div>

      {/* Step 1: Upload CV */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
          📄 Step 1: Upload Your CV (Optional)
        </h3>
        <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Upload your CV to auto-fill your information, or enter manually below
        </p>
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVUpload} style={{ padding: '0.75rem', border: '2px dashed #cbd5e0', borderRadius: '8px', width: '100%', cursor: 'pointer', background: '#f7fafc' }} />
        {loading && <p style={{ marginTop: '0.75rem', color: '#4299e1' }}>⏳ Extracting information from CV...</p>}
        {cvUploaded && <p style={{ marginTop: '0.75rem', color: '#48bb78', fontWeight: '500' }}>✅ CV uploaded successfully! Information auto-filled.</p>}
      </div>

      {/* Step 2: Your Information (Conditional) */}
      {!cvUploaded && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#2d3748' }}>
            👤 Step 2: Your Information
          </h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>Full Name *</label>
                <input type="text" value={userInfo.name} onChange={(e) => handleUserInfoChange('name', e.target.value)} placeholder="John Doe" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>Email *</label>
                <input type="email" value={userInfo.email} onChange={(e) => handleUserInfoChange('email', e.target.value)} placeholder="john@example.com" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>Phone</label>
                <input type="tel" value={userInfo.phone} onChange={(e) => handleUserInfoChange('phone', e.target.value)} placeholder="+91 98765 43210" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>Years of Experience</label>
                <input type="text" value={userInfo.experience} onChange={(e) => handleUserInfoChange('experience', e.target.value)} placeholder="e.g., 3 years" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '1rem' }} />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>Key Skills (comma separated)</label>
              <textarea value={Array.isArray(userInfo.skills) ? userInfo.skills.join(', ') : userInfo.skills} onChange={(e) => handleUserInfoChange('skills', e.target.value.split(',').map(s => s.trim()))} placeholder="React, Node.js, MongoDB, REST APIs, etc." rows={3} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }} />
            </div>
          </div>
        </div>
      )}

      {/* Select Company & Role */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
          🎯 {cvUploaded ? 'Step 2' : 'Step 3'}: Select Target Company & Role
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>Company *</label>
            <Select value={selectedCompany} onChange={setSelectedCompany} options={companyOptions} placeholder="Select company..." styles={{ control: (base) => ({ ...base, padding: '0.25rem', borderRadius: '8px', border: '1px solid #cbd5e0' }) }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>Role *</label>
            <Select value={selectedRole} onChange={setSelectedRole} options={roleOptions} placeholder={selectedCompany ? "Select role..." : "Select company first"} isDisabled={!selectedCompany} styles={{ control: (base) => ({ ...base, padding: '0.25rem', borderRadius: '8px', border: '1px solid #cbd5e0' }) }} />
            {selectedCompany && roleOptions.length === 0 && <p style={{ color: '#f56565', fontSize: '0.875rem', marginTop: '0.5rem' }}>No roles available</p>}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button onClick={handleGenerate} disabled={generating || !selectedCompany || !selectedRole || !userInfo.name || !userInfo.email} style={{ padding: '1rem 3rem', fontSize: '1.125rem', fontWeight: '600', color: 'white', background: generating ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '8px', cursor: generating ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}>
          {generating ? '⏳ Generating...' : '✨ Generate Cover Letter'}
        </button>
        {generating && <p style={{ marginTop: '1rem', color: '#667eea', fontWeight: '500' }}>Our AI is crafting the perfect cover letter for you. This might take a moment...</p>}
      </div>

      {/* Generated Cover Letter Display */}
      {coverLetter && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid #48bb78' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2d3748', marginBottom: '0.25rem' }}>✅ Cover Letter Generated!</h3>
              <p style={{ color: '#718096', fontSize: '0.9rem' }}>Version {coverLetter.version || 1} • Created {new Date(coverLetter.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setEditMode(!editMode)} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: editMode ? 'white' : '#4299e1', background: editMode ? '#4299e1' : 'white', border: `2px solid #4299e1`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                {editMode ? '👁️ Preview' : '✏️ Edit'}
              </button>
              <button onClick={handleRegenerate} disabled={generating} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#805ad5', background: 'white', border: '2px solid #805ad5', borderRadius: '6px', cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                🔄 Regenerate
              </button>
              <button onClick={handleDownload} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: 'white', background: '#48bb78', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                📥 Download PDF
              </button>
            </div>
          </div>
          <div style={{ background: '#f7fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {editMode ? (
              <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} style={{ width: '100%', minHeight: '500px', padding: '1rem', fontSize: '1rem', lineHeight: '1.6', fontFamily: 'Georgia, serif', border: '1px solid #cbd5e0', borderRadius: '6px', resize: 'vertical' }} />
            ) : (
              <div style={{ fontSize: '1rem', lineHeight: '1.8', color: '#2d3748', fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap' }}>
                {editedContent || coverLetter.content}
              </div>
            )}
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#edf2f7', borderRadius: '6px', borderLeft: '4px solid #4299e1' }}>
            <p style={{ fontSize: '0.875rem', color: '#4a5568', margin: 0 }}>
              💡 <strong>Tip:</strong> You can edit the content above and download your customized version.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!coverLetter && !generating && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f7fafc', borderRadius: '12px', border: '2px dashed #cbd5e0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontSize: '1.25rem', color: '#4a5568', marginBottom: '0.5rem' }}>Ready to Create Your Cover Letter?</h3>
          <p style={{ color: '#718096' }}>
            Fill in your information and select a company & role to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default CoverLetterGenerator;