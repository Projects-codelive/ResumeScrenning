import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import api from "../services/api";
import DeleteAccount from '../components/DeleteAccount';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);


  const [profileData, setProfileData] = useState({
    fullname: {
      firstname: "",
      lastname: "",
    },
    profile: {
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      linkedIn: "",
      github: "",
      portfolio: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
    },
    projects: [],
    certifications: [],
    awards: [],
    volunteer: [],
    interests: [],
  });

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      if (response.data.success) {
        const userData = response.data.user;
        setProfileData({
          fullname: userData.fullname || { firstname: "", lastname: "" },
          profile: {
            phone: userData.personalInfo?.phone || "",
            address: userData.personalInfo?.address || {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "",
            },
            linkedIn: userData.personalInfo?.linkedIn || "",
            github: userData.personalInfo?.github || "",
            portfolio: userData.personalInfo?.portfolio || "",
            summary: userData.personalInfo?.summary || "",
          },
          experience: userData.experience || [],
          education: userData.education || [],
          skills: {
            technical: userData.skills?.technical || [],
            soft: userData.skills?.soft || [],
            languages: userData.skills?.languages || []
          },
          projects: userData.projects || [],
          certifications: userData.certifications || [],
          awards: userData.awards || [],
          volunteer: userData.volunteer || [],
          interests: userData.interests || [],
        });
      }
    } catch (error) {
      setErrors({ load: "Failed to load profile data" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value, index = null) => {
    setProfileData((prev) => {
      if (index !== null) {
        const newArray = [...prev[section]];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prev, [section]: newArray };
      } else if (section === "profile" && typeof prev[section][field] === "object") {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: { ...prev[section][field], ...value },
          },
        };
      } else if (section === "fullname") {
        return {
          ...prev,
          fullname: { ...prev.fullname, [field]: value },
        };
      } else {
        return {
          ...prev,
          [section]: { ...prev[section], [field]: value },
        };
      }
    });
  };

  const handleSkillsChange = (type, value) => {
    setProfileData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [type]: value },
    }));
  };

  const handleSkillsBlur = (type, value) => {
    const skillsArray = value
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
    
    setProfileData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [type]: skillsArray },
    }));
  };

  // Add new item to array sections
  const addArrayItem = (section) => {
    const newItem = getEmptyItem(section);
    setProfileData((prev) => ({
      ...prev,
      [section]: [...prev[section], newItem],
    }));
  };

  // Remove item from array sections
  const removeArrayItem = (section, index) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  // Get empty item structure for different sections
  const getEmptyItem = (section) => {
    switch (section) {
      case 'experience':
        return {
          company: '',
          position: '',
          location: '',
          startDate: '',
          endDate: '',
          isCurrentJob: false,
          description: '',
        };
      case 'education':
        return {
          institution: '',
          degree: '',
          fieldOfStudy: '',
          location: '',
          startDate: '',
          endDate: '',
          gpa: '',
        };
      case 'projects':
        return {
          title: '',
          description: '',
          technologies: '',
          startDate: '',
          endDate: '',
          projectUrl: '',
          githubUrl: '',
        };
      case 'certifications':
        return {
          name: '',
          issuer: '',
          issueDate: '',
          expiryDate: '',
          credentialId: '',
          credentialUrl: '',
        };
      case 'awards':
        return {
          title: '',
          issuer: '',
          date: '',
          description: '',
        };
      case 'volunteer':
        return {
          organization: '',
          position: '',
          location: '',
          startDate: '',
          endDate: '',
          description: '',
        };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const response = await api.put("/users/profile", profileData);

      if (response.data.success) {
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      }
    } catch (error) {
      setErrors({
        save: error.response?.data?.message || "Failed to save profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    window.location.href = "/dashboard";
  };
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative mx-auto w-20 h-20 mb-8">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading your profile...</h3>
          <p className="text-gray-500">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
                <p className="text-blue-100">Fill in your details to create a professional resume</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl shadow-sm animate-fade-in-down">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  {successMessage}
                </div>
              </div>
            )}
            {errors.save && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-2xl shadow-sm animate-shake">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">❌</span>
                  {errors.save}
                </div>
              </div>
            )}
            
            {/* Basic Information */}
            <section className="animate-fade-in-up">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileData.fullname.firstname}
                      onChange={(e) => handleInputChange('fullname', 'firstname', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white"
                      placeholder="Enter your first name"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileData.fullname.lastname}
                      onChange={(e) => handleInputChange('fullname', 'lastname', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white"
                      placeholder="Enter your last name"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="animate-fade-in-up animation-delay-200">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Contact Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'phone', label: 'Phone', placeholder: '+1 (555) 123-4567', type: 'tel' },
                  { key: 'linkedIn', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile', type: 'url' },
                  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourusername', type: 'url' },
                  { key: 'portfolio', label: 'Portfolio', placeholder: 'https://yourportfolio.com', type: 'url' }
                ].map((field, index) => (
                  <div key={field.key} className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type={field.type}
                        value={profileData.profile[field.key]}
                        onChange={(e) => handleInputChange('profile', field.key, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white"
                        placeholder={field.placeholder}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Professional Summary */}
            <section className="animate-fade-in-up animation-delay-400">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Professional Summary</h2>
              </div>
              <div className="group">
                <div className="relative">
                  <textarea
                    value={profileData.profile.summary}
                    onChange={(e) => handleInputChange('profile', 'summary', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white resize-none"
                    placeholder="Write a brief professional summary that highlights your key skills, experience, and career objectives..."
                  />
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {profileData.profile.summary.length}/500 characters
                </p>
              </div>
            </section>

            {/* Experience Section */}
            <section className="animate-fade-in-up animation-delay-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                    4
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Work Experience</h2>
                </div>
                <button
                  onClick={() => addArrayItem('experience')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  + Add Experience
                </button>
              </div>
              
              {profileData.experience.map((exp, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Experience #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('experience', index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleInputChange('experience', 'company', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => handleInputChange('experience', 'position', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Job Title"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => handleInputChange('experience', 'location', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="City, State"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => handleInputChange('experience', 'startDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => handleInputChange('experience', 'endDate', e.target.value, index)}
                        disabled={exp.isCurrentJob}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 disabled:bg-gray-200"
                      />
                    </div>
                    <div className="group flex items-center">
                      <input
                        type="checkbox"
                        id={`current-job-${index}`}
                        checked={exp.isCurrentJob}
                        onChange={(e) => handleInputChange('experience', 'isCurrentJob', e.target.checked, index)}
                        className="mr-2"
                      />
                      <label htmlFor={`current-job-${index}`} className="text-sm font-semibold text-gray-700">
                        Current Job
                      </label>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => handleInputChange('experience', 'description', e.target.value, index)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none"
                      placeholder="Describe your role and responsibilities..."
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Education Section */}
            <section className="animate-fade-in-up animation-delay-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                    5
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Education</h2>
                </div>
                <button
                  onClick={() => addArrayItem('education')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  + Add Education
                </button>
              </div>
              
              {profileData.education.map((edu, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Education #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('education', index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleInputChange('education', 'institution', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="University/College Name"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleInputChange('education', 'degree', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Bachelor's, Master's, etc."
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Field of Study</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => handleInputChange('education', 'fieldOfStudy', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Computer Science, Business, etc."
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={edu.location}
                        onChange={(e) => handleInputChange('education', 'location', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="City, State"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={edu.startDate}
                        onChange={(e) => handleInputChange('education', 'startDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={edu.endDate}
                        onChange={(e) => handleInputChange('education', 'endDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GPA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={edu.gpa}
                        onChange={(e) => handleInputChange('education', 'gpa', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="3.75"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Skills */}
            <section className="animate-fade-in-up animation-delay-800">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                  6
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Skills</h2>
              </div>
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                    Technical Skills
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={Array.isArray(profileData.skills.technical) 
                        ? profileData.skills.technical.join(', ') 
                        : profileData.skills.technical || ''}
                      onChange={(e) => handleSkillsChange('technical', e.target.value)}
                      onBlur={(e) => handleSkillsBlur('technical', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white"
                      placeholder="JavaScript, React, Node.js, Python, AWS (comma separated)"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                    Soft Skills
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={Array.isArray(profileData.skills.soft) 
                        ? profileData.skills.soft.join(', ') 
                        : profileData.skills.soft || ''}
                      onChange={(e) => handleSkillsChange('soft', e.target.value)}
                      onBlur={(e) => handleSkillsBlur('soft', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white"
                      placeholder="Leadership, Communication, Problem Solving, Team Management (comma separated)"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Projects Section */}
            <section className="animate-fade-in-up animation-delay-900">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                    7
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                </div>
                <button
                  onClick={() => addArrayItem('projects')}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  + Add Project
                </button>
              </div>
              
              {profileData.projects.map((project, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Project #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('projects', index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="group md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title</label>
                      <input
                        type="text"
                        value={project.title}
                        onChange={(e) => handleInputChange('projects', 'title', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Project Name"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Technologies Used</label>
                      <input
                        type="text"
                        value={project.technologies}
                        onChange={(e) => handleInputChange('projects', 'technologies', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="React, Node.js, MongoDB (comma separated)"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Project URL</label>
                      <input
                        type="url"
                        value={project.projectUrl}
                        onChange={(e) => handleInputChange('projects', 'projectUrl', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="https://yourproject.com"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub URL</label>
                      <input
                        type="url"
                        value={project.githubUrl}
                        onChange={(e) => handleInputChange('projects', 'githubUrl', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={project.startDate}
                        onChange={(e) => handleInputChange('projects', 'startDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={project.endDate}
                        onChange={(e) => handleInputChange('projects', 'endDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={project.description}
                      onChange={(e) => handleInputChange('projects', 'description', e.target.value, index)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none"
                      placeholder="Describe your project..."
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Certifications Section */}
            <section className="animate-fade-in-up animation-delay-1000">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                    8
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Certifications</h2>
                </div>
                <button
                  onClick={() => addArrayItem('certifications')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  + Add Certification
                </button>
              </div>
              
              {profileData.certifications.map((cert, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Certification #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('certifications', index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Certification Name</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => handleInputChange('certifications', 'name', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="AWS Certified Solutions Architect"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Issuer</label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => handleInputChange('certifications', 'issuer', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Amazon Web Services"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Date</label>
                      <input
                        type="date"
                        value={cert.issueDate}
                        onChange={(e) => handleInputChange('certifications', 'issueDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="date"
                        value={cert.expiryDate}
                        onChange={(e) => handleInputChange('certifications', 'expiryDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Credential ID</label>
                      <input
                        type="text"
                        value={cert.credentialId}
                        onChange={(e) => handleInputChange('certifications', 'credentialId', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="ABC123456789"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Credential URL</label>
                      <input
                        type="url"
                        value={cert.credentialUrl}
                        onChange={(e) => handleInputChange('certifications', 'credentialUrl', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="https://verify.certification.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Awards Section */}
            <section className="animate-fade-in-up animation-delay-1100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                    9
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Awards & Achievements</h2>
                </div>
                <button
                  onClick={() => addArrayItem('awards')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  + Add Award
                </button>
              </div>
              
              {profileData.awards.map((award, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Award #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('awards', index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Award Title</label>
                      <input
                        type="text"
                        value={award.title}
                        onChange={(e) => handleInputChange('awards', 'title', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Employee of the Year"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Issuer</label>
                      <input
                        type="text"
                        value={award.issuer}
                        onChange={(e) => handleInputChange('awards', 'issuer', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Company/Organization Name"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={award.date}
                        onChange={(e) => handleInputChange('awards', 'date', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={award.description}
                      onChange={(e) => handleInputChange('awards', 'description', e.target.value, index)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none"
                      placeholder="Describe the award and achievement..."
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Volunteer Section */}
            <section className="animate-fade-in-up animation-delay-1200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                    10
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Volunteer Experience</h2>
                </div>
                <button
                  onClick={() => addArrayItem('volunteer')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  + Add Volunteer
                </button>
              </div>
              
              {profileData.volunteer.map((vol, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Volunteer #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('volunteer', index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Organization</label>
                      <input
                        type="text"
                        value={vol.organization}
                        onChange={(e) => handleInputChange('volunteer', 'organization', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Non-profit Organization"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={vol.position}
                        onChange={(e) => handleInputChange('volunteer', 'position', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="Volunteer Coordinator"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={vol.location}
                        onChange={(e) => handleInputChange('volunteer', 'location', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        placeholder="City, State"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={vol.startDate}
                        onChange={(e) => handleInputChange('volunteer', 'startDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={vol.endDate}
                        onChange={(e) => handleInputChange('volunteer', 'endDate', e.target.value, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={vol.description}
                      onChange={(e) => handleInputChange('volunteer', 'description', e.target.value, index)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none"
                      placeholder="Describe your volunteer activities..."
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Interests */}
            <section className="animate-fade-in-up animation-delay-1300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                  11
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Interests</h2>
              </div>
              <div className="group">
                <div className="relative">
                  <input
                    type="text"
                    value={Array.isArray(profileData.interests) 
                      ? profileData.interests.join(', ') 
                      : profileData.interests || ''}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, interests: e.target.value }));
                    }}
                    onBlur={(e) => {
                      const interestsArray = e.target.value.split(',').map(interest => interest.trim()).filter(interest => interest.length > 0);
                      setProfileData(prev => ({ ...prev, interests: interestsArray }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white"
                    placeholder="Photography, Hiking, Open Source, Machine Learning (comma separated)"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            
              <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-200 animate-fade-in-up animation-delay-1400">
                <button onClick={handleSkip} className="group px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5">
                  <span className="flex items-center justify-center">
                    <span className="mr-2">Skip for Now</span>
                    <span className="text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                </button>

                <button onClick={handleSave} disabled={saving} className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:hover:scale-100 disabled:hover:translate-y-0">
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">Save & Continue</span>
                      <span className="text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                  )}
                </button>
              </div>


                

            {/* ✅ DANGER ZONE - ONLY ADDITION */}
            <section className="animate-fade-in-up animation-delay-1500">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mt-8 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                    ⚠️
                  </div>
                  <h3 className="text-xl font-bold text-red-800">Danger Zone</h3>
                </div>
                <p className="text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => setShowDeleteAccount(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  Delete Account
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ✅ DELETE ACCOUNT MODAL - ONLY ADDITION */}
      {showDeleteAccount && (
        <DeleteAccount onBack={() => setShowDeleteAccount(false)} />
      )}
    </div>
  );
};

export default Profile;
