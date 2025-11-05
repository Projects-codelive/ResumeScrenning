import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useAuth } from '../Context/AuthContext'; // 🔧 FIX: Added ../
import api from '../services/api'; // 🔧 FIX: Added ../
import companyData from '../assets/companies.json'; // 🔧 FIX: Added ../
import CoverLetterGenerator from '../components/CoverLetterGenerator'; // 🔧 FIX: Added ../

const Dashboard = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Upload and analyzer state
  const [cvFile, setCvFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Company and role selection
  const companyOptions = companyData.map(c => ({ label: c.name, value: c.id }));
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  // Role requirements state
  const [roleRequirements, setRoleRequirements] = useState(null);
  const [loadingRequirements, setLoadingRequirements] = useState(false);

  // Course recommendation state
  const [courseRecommendations, setCourseRecommendations] = useState([]);
  const [showCourses, setShowCourses] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  //  CV state
  const [improvedCV, setImprovedCV] = useState('');
  const [showImproved, setShowImproved] = useState(false);
  const [originalCV, setOriginalCV] = useState('');
  const [changes, setChanges] = useState([]);

  // NEW: Create from scratch functionality
  const [createFromScratch, setCreateFromScratch] = useState(false);
  const [generatedCV, setGeneratedCV] = useState('');

  // Template Selection State
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [activeTab, setActiveTab] = useState('cv-analyzer');

  // ✨ NEW: State for the email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // Dynamic role options based on selected company
  const roleOptions = selectedCompany
    ? companyData.find(c => c.id === selectedCompany.value)?.roles.map(r => ({ label: r, value: r })) || []
    : [];

  useEffect(() => {
    // Fetch profile from backend
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        if (response.data.success) {
          setProfileData(response.data.user);
          // ✨ NEW: Set default email recipient
          if (response.data.user.email) {
            setEmailRecipient(response.data.user.email);
          }
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Reset role selection when company changes
  useEffect(() => {
    setSelectedRole(null);
    setRoleRequirements(null);
  }, [selectedCompany]);

  // Fetch role requirements when company and role are selected
  const fetchRoleRequirements = async () => {
    if (!selectedCompany || !selectedRole) {
      setRoleRequirements(null);
      return;
    }
    
    setLoadingRequirements(true);
    try {
      // ✅ This path is correct and includes /api.
      const response = await api.get(
        `/api/role-requirements?companyId=${selectedCompany.value}&role=${selectedRole.value}`
      );
      const result = response.data; // api.get returns response.data directly
      
      if (result.success) {
        console.log('Role requirements:', result.data.requirements);
        setRoleRequirements(result.data.requirements);
      } else {
        setRoleRequirements(null);
      }
    } catch (error) {
      console.error('Error fetching role requirements:', error);
      setRoleRequirements(null);
    } finally {
      setLoadingRequirements(false);
    }
  };

  // Fetch requirements when company/role changes
  useEffect(() => {
    fetchRoleRequirements();
  }, [selectedCompany, selectedRole]);

  // Handle file upload
  const [uploadError, setUploadError] = useState('');
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload PDF, Word or Text file.');
      return;
    }
    setCvFile(file);
    setUploadError('');
  };

  // Function to create CV from scratch using profile data
  const createCVFromProfile = () => {
    if (!profileData || !selectedCompany || !selectedRole) {
      setFeedback('Please select a company and role, and ensure your profile is loaded.');
      return;
    }

    const newCV = `${profileData.fullname?.firstname} ${profileData.fullname?.lastname}
${profileData.email} | ${profileData.profile?.phone || ''}

PROFESSIONAL SUMMARY
${profileData.profile?.summary || `Experienced professional seeking ${selectedRole.value} position at ${selectedCompany.label}`}

TECHNICAL SKILLS
${profileData.skills?.technical?.join(', ') || 'Various technical skills'}

EXPERIENCE
${profileData.experience?.map(exp => 
  `${exp.position} - ${exp.company} (${exp.duration})\n${exp.description || ''}`
).join('\n\n') || 'Professional experience to be added'}

EDUCATION
${profileData.education?.map(edu => 
  `${edu.degree} - ${edu.institution} (${edu.year})`
).join('\n') || 'Educational background to be added'}

PROJECTS
${profileData.projects?.map(proj => 
  `${proj.name}: ${proj.description}`
).join('\n') || 'Key projects to be highlighted'}`;

    setGeneratedCV(newCV);
    setImprovedCV(newCV);
    setShowImproved(true);
  };

  // Enhanced handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (createFromScratch) {
      // If creating from scratch, use generated CV
      if (!selectedCompany || !selectedRole || !profileData) {
        setFeedback('Please select a company and role, and ensure your profile data is loaded.');
        return;
      }
      
      // Create CV from profile first
      createCVFromProfile();
      return;
    }
    
    if (!cvFile || !selectedCompany || !selectedRole || !profileData) {
      setFeedback('Please upload a CV file, select a company and role, and ensure your profile data is loaded.');
      return;
    }

    setAnalyzing(true);
    setFeedback(null);  


    const formData = new FormData();
    formData.append('cv', cvFile);
    formData.append('company', selectedCompany.value);
    formData.append('companyName', selectedCompany.label);
    formData.append('role', selectedRole.value);
    formData.append('profileData', JSON.stringify(profileData));
    formData.append('roleRequirements', JSON.stringify(roleRequirements));

    try {
      const response = await api.post('/api/cv/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const result = response.data;
      
      if (result.success) {
        const feedbackData = result.data;
        console.log('🔍 Full result data:', feedbackData);
        setFeedback(feedbackData); 
        
        setOriginalCV(feedbackData.originalText || '');
        setImprovedCV(feedbackData.aiImprovedCV || '');
        setShowImproved(!!feedbackData.aiImprovedCV);
        
        const missingSkills = feedbackData.analysis?.missingSkills || [];
        if (missingSkills.length > 0) {
          console.log('🎓 Missing skills:', missingSkills);
          fetchCourseRecommendations(missingSkills);
        }

      } else {
        setFeedback('Error: ' + result.message);
      }
      } catch (err) {
        setFeedback('Error analyzing CV: ' + err.message);
      } finally {
        setAnalyzing(false);
      }
    };

  // Fetch course recommendations after CV analysis
    const fetchCourseRecommendations = async (missingSkills) => {
      if (!missingSkills || missingSkills.length === 0) {
        console.log('No missing skills, skipping course recommendations');
        return;
      }

      setLoadingCourses(true);
      try {
        const response = await api.post('/api/learning/recommend-courses', {
          missingSkills,
          company: selectedCompany.label,
          role: selectedRole.value,
          userCV: originalCV
        });

        if (response.data.success) {
          setCourseRecommendations(response.data.recommendations);
          setShowCourses(true);
          console.log('✅ Course recommendations loaded:', response.data.recommendations);
        }
      } catch (error) {
        console.error('Failed to fetch course recommendations:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

  const generateProfessionalPDF = async (cvContent, companyName, roleName) => {
    try {
      setPdfLoading(true);
      
      if (!cvContent || cvContent.trim().length === 0) {
        alert('No CV content available. Please analyze your CV first.');
        setPdfLoading(false);
        return;
      }
      
      console.log('📄 Generating PDF with content length:', cvContent.length);
      console.log('🎨 Selected template:', selectedTemplate);
      
      // ✨ UPDATED: Send userProfile for hyperlink fix
      const response = await api.post('/api/pdf/generate-cv-pdf', {
        profileData: {
          cvContent: cvContent,
          template: selectedTemplate || 'classic',
          userProfile: user // Pass the full user object
        }
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CV-${companyName || 'company'}-${roleName || 'role'}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to generate PDF: ' + (error.response?.data?.message || error.message));
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
    if (!improvedCV) {
      setEmailError('CV data is not available.');
      return;
    }

    setEmailLoading(true);
    setEmailSuccess('');
    setEmailError('');

    try {
      // ✨ UPDATED: Send userProfile for hyperlink fix
      const payload = {
        toEmail: recipient,
        profileData: {
          cvContent: improvedCV,
          template: selectedTemplate,
          userProfile: user // Pass the full user object
        },
      };

      const response = await api.post('/api/pdf/email-cv-pdf', payload);

      if (response.data.success) {
        setEmailSuccess(`Successfully sent CV to ${recipient}!`);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSuccess('');
          setEmailRecipient(user?.email || ''); // Reset recipient
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

  // Download PDF function (for analyzed report)
  const handleDownloadPDF = async () => {
    const feedbackForPdf = {
        matchScore: feedback.matchScore,
        matchingSkills: feedback.analysis.matchingSkills,
        missingSkills: feedback.analysis.missingSkills,
        strengths: feedback.recommendations.strengths,
        weaknesses: feedback.recommendations.weaknesses,
        structure: feedback.recommendations.structure,
    };

    if (!feedbackForPdf || !selectedCompany || !selectedRole) {
      alert('Please analyze your CV first');
      return;
    }
  
    try {
      setPdfLoading(true);
  
      const response = await api.post('/api/pdf/generate-analyzed', { // ✅ This path is correct
        feedback: feedbackForPdf,
        company: selectedCompany.label,
        role: selectedRole.label,
        template: 'modern' 
      }, {
        responseType: 'blob'
      });
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AI-Analyzed-CV-${selectedCompany.label}-${selectedRole.label}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
  
      console.log('✅ Your AI-Analyzed CV has been downloaded!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('❌ Failed to download PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };


  
  const combineRealDataWithAI = (realUserData, cvContent, companyName, roleName) => {
    console.log('Real user data:', realUserData);
    console.log('AI enhanced content:', cvContent);
    
    let combinedData = {
      fullname: realUserData?.fullname || { firstname: "John", lastname: "Smith" },
      profile: {
        phone: realUserData?.profile?.phone || "+1-555-123-4567",
        email: realUserData?.profile?.email || "user@email.com",
        linkedIn: realUserData?.profile?.linkedIn || "linkedin.com/in/profile",
        github: realUserData?.profile?.github || "github.com/username",
        portfolio: realUserData?.profile?.portfolio || "",
        summary: realUserData?.profile?.summary || ""
      },
      experience: realUserData?.experience || [],
      education: realUserData?.education || [],
      projects: realUserData?.projects || [],
      certifications: realUserData?.certifications || [],
      awards: realUserData?.awards || [],
      volunteer: realUserData?.volunteer || [],
      interests: realUserData?.interests || [],
      skills: realUserData?.skills || { technical: [], soft: [], languages: [] }
    };
    
    const summaryMatch = cvContent.match(/PROFESSIONAL SUMMARY\s*\n([\s\S]*?)(?=\nSKILLS|$)/i);
    if (summaryMatch) {
      combinedData.profile.summary = summaryMatch[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    }
    
    const skillsMatch = cvContent.match(/SKILLS\s*\n([\s\S]*?)(?=\nEXPERIENCE|\nEDUCATION|$)/i);
    if (skillsMatch) {
      const aiSkills = [];
      const skillsText = skillsMatch[1];
      
      const skillParts = skillsText.split(/[,\n•\-:|()]/)
        .map(skill => skill.trim())
        .filter(skill => skill && 
                skill.length > 2 && 
                skill.length < 30 &&
                !skill.match(/^(Technical|Skills?|Product|Process|Stack|Tools?)$/i));
      
      aiSkills.push(...skillParts);
      
      const existingTechSkills = combinedData.skills.technical || [];
      const mergedTechSkills = [...new Set([...existingTechSkills, ...aiSkills])];
      
      combinedData.skills.technical = mergedTechSkills;
    }
    
    if (!combinedData.fullname.firstname || combinedData.fullname.firstname === "John") {
      const nameMatch = cvContent.match(/^([A-Z\s]+)/m);
      if (nameMatch) {
        const nameParts = nameMatch[1].replace(/AI-OPTIMIZED|CV FOR|Amazon|Microsoft|Google/g, '').trim().split(' ');
        if (nameParts.length >= 2) {
          combinedData.fullname.firstname = nameParts[0];
          combinedData.fullname.lastname = nameParts.slice(1).join(' ');
        }
      }
    }
    
    console.log('Combined data for PDF:', combinedData);
    return combinedData;
  };


  
  const parseImprovedCV = (cvContent, companyName, roleName) => {
    console.log('Parsing CV content:', cvContent);
    
    const sections = {
      fullname: { firstname: "JOHN", lastname: "SMITH" },
      profile: {
        phone: "+1-555-123-4567",
        email: "john.smith@email.com",
        linkedIn: "linkedin.com/in/johnsmith",
        github: "github.com/johnsmith", 
        portfolio: "",
        summary: ""
      },
      experience: [],
      education: [],
      skills: { technical: [], soft: [], languages: [] },
      projects: [],
      certifications: [],
      awards: [],
      volunteer: [],
      interests: []
    };

    const lines = cvContent.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const nameMatch = cvContent.match(/^([A-Z\s]+)/m);
      if (nameMatch) {
        const nameParts = nameMatch[1].trim().split(' ').filter(part => part.trim());
        if (nameParts.length >= 2) {
          sections.fullname.firstname = nameParts[0];
          sections.fullname.lastname = nameParts.slice(1).join(' ');
        }
      }
    }

    const phoneMatch = cvContent.match(/📞\s*([+\-\d\s()]+)/);
    if (phoneMatch) sections.profile.phone = phoneMatch[1].trim();

    const emailMatch = cvContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) sections.profile.email = emailMatch[1];

    const linkedInMatch = cvContent.match(/LinkedIn:\s*(linkedin\.com\/[^\s|]+)/);
    if (linkedInMatch) sections.profile.linkedIn = linkedInMatch[1];

    const githubMatch = cvContent.match(/GitHub:\s*(github\.com\/[^\s|]+)/);
    if (githubMatch) sections.profile.github = githubMatch[1];

    const summaryMatch = cvContent.match(/PROFESSIONAL SUMMARY\s*\n([\s\S]*?)(?=\nSKILLS|$)/i);
    if (summaryMatch) {
      sections.profile.summary = summaryMatch[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    }

    const skillsMatch = cvContent.match(/SKILLS\s*\n([\s\S]*?)(?=\nEXPERIENCE|\nEDUCATION|$)/i);
    if (skillsMatch) {
      const skillsText = skillsMatch[1];
      
      const allSkills = [];
      
      const skillParts = skillsText.split(/[,\n•\-:|()]/)
        .map(skill => skill.trim())
        .filter(skill => skill && 
                skill.length > 2 && 
                skill.length < 30 &&
                !skill.match(/^(Technical|Skills?|Product|Process|Stack|Tools?)$/i) &&
                !skill.includes('&') &&
                skill.match(/^[a-zA-Z][a-zA-Z.\s]*$/));
      
      const commonTechSkills = [
        'JavaScript', 'Python', 'Java', 'TypeScript', 'React', 'Vue.js', 'Node.js', 
        'Express.js', 'Django', 'REST APIs', 'MongoDB', 'PostgreSQL', 'MySQL', 
        'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'Jenkins', 'VS Code',
        'Agile', 'Scrum', 'JIRA', 'HTML', 'CSS', 'jQuery', 'Bootstrap'
      ];
      
      commonTechSkills.forEach(skill => {
        if (cvContent.includes(skill) && !allSkills.includes(skill)) {
          allSkills.push(skill);
        }
      });
      
      allSkills.push(...skillParts);
      
      sections.skills.technical = [...new Set(allSkills)].slice(0, 20);
    }

    sections.experience = [
      {
        position: `Software Engineer`,
        company: "Tech Solutions Inc.",
        location: "Remote",
        startDate: "Jan 2022",
        endDate: "Present",
        isCurrentJob: true,
        description: `Developed scalable web applications using modern technologies. Collaborated with cross-functional teams to deliver high-quality software solutions. Improved application performance by 30% through code optimization and database tuning.`
      },
      {
        position: "Junior Software Developer", 
        company: "Digital Innovations LLC",
        location: "San Francisco, CA",
        startDate: "Jun 2020",
        endDate: "Dec 2021",
        isCurrentJob: false,
        description: `Built responsive web interfaces using React and JavaScript. Participated in agile development processes and code reviews. Contributed to the development of REST APIs and database integrations.`
      }
    ];

    sections.education = [
      {
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        institution: "University of California",
        location: "Berkeley, CA",
        startDate: "2016",
        endDate: "2020",
        gpa: "3.7"
      }
    ];

    sections.projects = [
      {
        title: "E-Commerce Web Application",
        technologies: "React, Node.js, MongoDB, Express.js",
        startDate: "2023",
        endDate: "2023", 
        description: `Developed a full-stack e-commerce platform with user authentication, shopping cart functionality, and payment integration. Implemented responsive design and optimized for mobile devices.`,
        projectUrl: "https://github.com/username/ecommerce-app",
        githubUrl: "https://github.com/username/ecommerce-app"
      },
      {
        title: "Task Management API",
        technologies: "Python, Django, PostgreSQL",
        startDate: "2022",
        endDate: "2022",
        description: `Built RESTful API for task management with user authentication, CRUD operations, and real-time notifications. Deployed on AWS with automated CI/CD pipeline.`,
        githubUrl: "https://github.com/username/task-api"
      }
    ];

    sections.interests = ["Technology Innovation", "Open Source Development", "Machine Learning", "Cloud Computing", "Agile Methodologies"];

    console.log('Parsed sections:', sections);
    return sections;
  };




  // Function to highlight changes between original and improved CV
  const highlightChanges = (original, improved) => {
    const changes = [];
    const originalLines = original.split('\n');
    const improvedLines = improved.split('\n');
    
    for (let i = 0; i < Math.max(originalLines.length, improvedLines.length); i++) {
      const originalLine = originalLines[i] || '';
      const improvedLine = improvedLines[i] || '';
      
      if (originalLine !== improvedLine) {
        changes.push({
          type: originalLine ? (improvedLine ? 'modified' : 'removed') : 'added',
          original: originalLine,
          improved: improvedLine,
          lineNumber: i + 1
        });
      }
    }
    
    return changes;
  };

  // Professional CV Templates
  const cvTemplates = {
    classic: {
      id: 'classic',
      name: 'Classic Professional',
      description: 'Traditional, ATS-friendly format perfect for corporate roles',
      preview: 'Clean, structured layout with clear sections',
      bestFor: ['Corporate', 'Finance', 'Consulting', 'Legal'],
      color: '#2563eb',
      style: 'traditional'
    },
    modern: {
      id: 'modern',
      name: 'Modern Tech',
      description: 'Contemporary design with subtle colors, ideal for tech roles',
      preview: 'Modern typography with accent colors and icons',
      bestFor: ['Technology', 'Startups', 'Design', 'Marketing'],
      color: '#7c3aed',
      style: 'modern'
    },
    creative: {
      id: 'creative',
      name: 'Creative Portfolio',
      description: 'Visually appealing design for creative professionals',
      preview: 'Bold layout with visual elements and creative sections',
      bestFor: ['Design', 'Creative', 'Media', 'Arts'],
      color: '#dc2626',
      style: 'creative'
    },
    minimal: {
      id: 'minimal',
      name: 'Minimal Executive',
      description: 'Clean, minimal design for senior-level positions',
      preview: 'Sophisticated, minimal approach with focus on content',
      bestFor: ['Executive', 'Senior Roles', 'Consulting', 'Management'],
      color: '#059669',
      style: 'minimal'
    },
    technical: {
      id: 'technical',
      name: 'Technical Expert',
      description: 'Detailed format highlighting technical skills and projects',
      preview: 'Technical-focused layout with skills matrix and project details',
      bestFor: ['Engineering', 'DevOps', 'Data Science', 'Research'],
      color: '#ea580c',
      style: 'technical'
    }
  };

  // Enhanced function to generate improved CV with AI results
  const generateImprovedCV = (originalData, analysis) => {
    if (!originalData || !analysis) {
      console.log('Missing data for CV improvement:', { originalData: !!originalData, analysis: !!analysis });
      return '';
    }
    
    console.log('Original Data:', originalData);
    console.log('Analysis:', analysis);
    
    if (originalData.aiImprovedCV) {
      const improved = `AI-OPTIMIZED CV FOR ${selectedCompany.label} - ${selectedRole.value}

${originalData.aiImprovedCV}

=== ANALYSIS SUMMARY ===
Overall Score: ${analysis.recommendations?.overallScore || analysis.score}%

Strengths Identified:
${(analysis.recommendations?.strengths || analysis.strengths || []).map(s => `• ${s}`).join('\n') || 'N/A'}

Areas for Improvement:
${(analysis.recommendations?.weaknesses || analysis.weaknesses || []).map(w => `• ${w}`).join('\n') || 'N/A'}

Changes Made by AI:
${(analysis.recommendations?.changesMade || analysis.changesMade || []).map(c => `• ${c}`).join('\n') || 'N/A'}

💡 Pro Tip: This CV has been optimized using advanced AI analysis. Remember to actually develop the skills mentioned - recruiters can tell the difference! 😉`;

      const detectedChanges = highlightChanges(originalCV, improved);
      setChanges(detectedChanges);
      
      return improved;
    }

    const basicImproved = `IMPROVED CV FOR ${selectedCompany.label} - ${selectedRole.value}

${originalData.parsedSections?.contact?.email ? `Email: ${originalData.parsedSections.contact.email}` : ''}
${originalData.parsedSections?.contact?.phone ? `Phone: ${originalData.parsedSections.contact.phone}` : ''}

PROFESSIONAL SUMMARY
[Enhanced summary tailored for ${selectedRole.value} at ${selectedCompany.label}]

TECHNICAL SKILLS
${(analysis.recommendations?.skillsMatched || analysis.matchingSkills || []).join(', ')}${(analysis.recommendations?.skillsToAdd || analysis.missingSkills || []).length > 0 ? ', ' + (analysis.recommendations?.skillsToAdd || analysis.missingSkills || []).join(', ') : ''}

EXPERIENCE
${(originalData.parsedSections?.experience || []).map(exp => 
  `${exp.position || 'Position'} - ${exp.company || 'Company'}\n${exp.duration || ''}`
).join('\n\n')}

IMPROVEMENTS MADE:
• Added missing skills: ${(analysis.recommendations?.skillsToAdd || analysis.missingSkills || []).join(', ') || 'None needed'}
• Enhanced existing skills presentation
• Optimized for ${selectedCompany.label}'s ATS system
• Tailored content for ${selectedRole.value} position

Note: AI analysis was not available, but basic optimizations have been applied.`;

    const detectedChanges = highlightChanges(originalCV, basicImproved);
    setChanges(detectedChanges);
    
    return basicImproved;
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


  if (loadingProfile) {
    return (
      <div className="dashboard-container" style={{ padding: '2rem', textAlign: 'center', color: '#444' }}>
        Loading profile data...
      </div>
    );
  }

  return (
    <>
      {/* ✨ NEW: Render the modal if showEmailModal is true */}
      {showEmailModal && <EmailCVModal />}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f7fafc, #edf2f7)', paddingBottom: '3rem' }}>

        {/* Beautiful Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          padding: '2rem', 
          color: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Welcome back, {user?.fullname?.firstname || 'User'}! 👋
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              Create perfect CVs and cover letters tailored to your dream job
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
            gap: '1rem',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setActiveTab('cv-analyzer')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: activeTab === 'cv-analyzer' ? '#4c51bf' : '#4a5568',
                background: activeTab === 'cv-analyzer' ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'cv-analyzer' ? '3px solid #4c51bf' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>📄</span>
              CV Analyzer
            </button>

            <button
              onClick={() => setActiveTab('cover-letter')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: activeTab === 'cover-letter' ? '#4c51bf' : '#4a5568',
                background: activeTab === 'cover-letter' ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'cover-letter' ? '3px solid #4c51bf' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>💼</span>
              Cover Letter
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1rem' }}>

          {/* CV Analyzer Tab Content */}
          {activeTab === 'cv-analyzer' && (
            <div style={{ minHeight: '100vh', padding: '0' }}>

              <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
                {/* Company Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Select Target Company *
                  </label>
                  <Select
                    value={selectedCompany}
                    onChange={setSelectedCompany}
                    options={companyOptions}
                    placeholder="Choose company..."
                    isSearchable
                  />
                </div>

                {/* Role Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Select Target Role *
                  </label>
                  <Select
                    value={selectedRole}
                    onChange={setSelectedRole}
                    options={roleOptions}
                    placeholder="Choose role..."
                    isDisabled={!selectedCompany}
                    isSearchable
                  />
                </div>

                {/* Role Requirements Display */}
                {roleRequirements && (
                  <div style={{ 
                    backgroundColor: '#e3f2fd', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    border: '1px solid #90caf9'
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1565c0' }}>
                      📋 Role Requirements
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: '#0d47a1' }}>
                      {roleRequirements.description && (
                        <p style={{ marginBottom: '0.5rem' }}>{roleRequirements.description}</p>
                      )}
                      {roleRequirements.skills && roleRequirements.skills.length > 0 && (
                        <div>
                          <strong>Required Skills:</strong> {roleRequirements.skills.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload or Create Options */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={createFromScratch}
                      onChange={(e) => setCreateFromScratch(e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ fontWeight: '500' }}>Create CV from scratch using my profile data</span>
                  </label>
                </div>

                {!createFromScratch && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Upload Your CV *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      style={{ display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    {uploadError && (
                      <p style={{ color: '#d32f2f', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={(!cvFile && !createFromScratch) || !selectedCompany || !selectedRole}
                  style={{
                    backgroundColor: (!cvFile && !createFromScratch) || !selectedCompany || !selectedRole ? '#ccc' : '#1976d2',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (!cvFile && !createFromScratch) || !selectedCompany || !selectedRole ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Analyze & Improve CV
                </button>

                {analyzing && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    animation: 'pulse 2s infinite'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                      <div style={{
                        border: '3px solid rgba(255,255,255,0.3)',
                        borderTop: '3px solid white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        animation: 'spin 1s linear infinite'
                      }}>

                      </div>
                      <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                        🔍 Analyzing your CV...
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.95, fontWeight: '500' }}>
                      Our AI is comparing your skills with {selectedRole?.value} job requirements at {selectedCompany?.label}
                    </p>
                  </div>
                )}
              </form>

              {/* CV Analysis Results Section */}
              {feedback && feedback.analysis && (
                <div style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '1.5rem', 
                  borderRadius: '8px', 
                  marginBottom: '2rem',
                  border: '1px solid #e0e0e0'
                }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1976d2' }}>
                    CV Analysis Results
                  </h2>

                  {/* Match Score */}
                  {feedback.matchScore && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'white', borderRadius: '6px' }}>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Match Score</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          fontSize: '3rem', 
                          fontWeight: 'bold', 
                          color: feedback.matchScore.score >= 70 ? '#4caf50' : feedback.matchScore.score >= 40 ? '#ff9800' : '#f44336'
                        }}>
                          {feedback.matchScore.score}%
                        </div>
                        <div>
                          <div>Matching: {feedback.matchScore.matched}</div>
                          <div>Missing: {feedback.matchScore.missing}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CV Strengths & Weaknesses */}
                  {feedback.recommendations?.strengths && feedback.recommendations?.weaknesses && (
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem'}}>
                      {/* Strengths */}
                      <div style={{
                        background: '#f0fdf4',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '2px solid #22c55e'
                      }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#16a34a',
                          marginBottom: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          ✅ CV Strengths
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {feedback.recommendations.strengths.map((strength, idx) => (
                            <li key={idx} style={{
                              marginBottom: '10px',
                              paddingLeft: '20px',
                              position: 'relative',
                              color: '#166534',
                              fontSize: '0.95rem',
                              lineHeight: '1.6'
                            }}>
                              <span style={{ position: 'absolute', left: '0', top: '2px', fontSize: '1.2rem' }}>✓</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div style={{
                        background: '#fef2f2',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '2px solid #ef4444'
                      }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#dc2626',
                          marginBottom: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          ⚠️ Areas to Improve
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {feedback.recommendations.weaknesses.map((weakness, idx) => (
                            <li key={idx} style={{
                              marginBottom: '10px',
                              paddingLeft: '20px',
                              position: 'relative',
                              color: '#991b1b',
                              fontSize: '0.95rem',
                              lineHeight: '1.6'
                            }}>
                              <span style={{ position: 'absolute', left: '0', top: '2px', fontSize: '1.2rem' }}>!</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Structure Analysis */}
                  {feedback.recommendations?.structure && (
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      padding: '25px',
                      borderRadius: '12px',
                      marginBottom: '30px',
                      color: 'white'
                    }}>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        📊 CV Structure Analysis
                      </h3>

                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem'}}>
                        {Object.entries(feedback.recommendations.structure).filter(([key]) => key !== 'comments').map(([key, value]) => (
                          <div key={key} style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '15px',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '8px', textTransform: 'capitalize' }}>{key}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}/10</div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                              <div style={{ width: `${value * 10}%`, height: '100%', background: 'white', borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {feedback.recommendations.structure.comments && feedback.recommendations.structure.comments.length > 0 && (
                        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>💡 Structural Feedback</h4>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {feedback.recommendations.structure.comments.map((comment, idx) => (
                              <li key={idx} style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                <span style={{ position: 'absolute', left: '0', top: '2px' }}>•</span>
                                {comment}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Download Analyzed Report Button */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={pdfLoading}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        padding: '15px 40px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: pdfLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.3s ease',
                        opacity: pdfLoading ? 0.6 : 1
                      }}
                      onMouseOver={(e) => { if (!pdfLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)'; } }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)'; }}
                    >
                      {pdfLoading ? (
                        <>
                          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <span>📊</span>
                          Download AI Analysis Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Improved CV Section */}
              {showImproved && improvedCV && (
                <div style={{ marginTop: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1976d2' }}>
                    Improved CV Preview
                  </h2>

                  {/* Template Selection */}
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Choose CV Template</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {Object.values(cvTemplates).map(template => (
                        <div
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          style={{
                            padding: '1rem',
                            border: selectedTemplate === template.id ? `3px solid ${template.color}` : '1px solid #ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: selectedTemplate === template.id ? `${template.color}10` : 'white',
                            transition: 'all 0.2s'
                          }}>
                          
                          <h4 style={{ marginBottom: '0.5rem', color: template.color }}>{template.name}</h4>
                          <p style={{ fontSize: '0.875rem', color: '#666' }}>{template.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ✨ UPDATED: Button container */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '30px' }}>
                    {/* Download Button */}
                    <button
                      onClick={async () => {
                        const parsedData = combineRealDataWithAI(user, improvedCV, selectedCompany?.label, selectedRole?.value);
                        console.log('Generating PDF with data:', parsedData);
                        await generateProfessionalPDF(improvedCV, selectedCompany?.label, selectedRole?.value);
                      }}
                      disabled={pdfLoading}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '15px 40px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: pdfLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        transition: 'all 0.3s ease',
                        opacity: pdfLoading ? 0.6 : 1
                      }}
                      onMouseOver={(e) => { if (!pdfLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'; } }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'; }}
                    >
                      {pdfLoading ? (
                        <>
                          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <span>📥</span>
                          Download Improved CV
                        </>
                      )}
                    </button>

                    {/* ✨ NEW: "Send to Email" Button */}
                    <button
                        onClick={() => {
                          setEmailSuccess('');
                          setEmailError('');
                          setEmailRecipient(user?.email || ''); // Reset recipient to user's email
                          setShowEmailModal(true);
                        }}
                        disabled={pdfLoading || emailLoading}
                        style={{
                          background: 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
                          color: 'white',
                          padding: '15px 40px',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: (pdfLoading || emailLoading) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(56, 178, 172, 0.4)',
                          transition: 'all 0.3s ease',
                          opacity: (pdfLoading || emailLoading) ? 0.6 : 1
                        }}
                        onMouseOver={(e) => { if (!pdfLoading && !emailLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 178, 172, 0.6)'; } }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(56, 178, 172, 0.4)'; }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        Send to Email
                    </button>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    maxHeight: '600px',
                    overflowY: 'auto'
                  }}>
                    {improvedCV}
                  </div>
                </div>
              )}

              {/* Course Recommendations Section */}
              {showCourses && courseRecommendations.length > 0 && (
                <div style={{
                  marginTop: '30px',
                  padding: '25px',
                  backgroundColor: '#faf5ff',
                  borderRadius: '12px',
                  border: '2px solid #e9d5ff'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '8px',
                    color: '#6b21a8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    📚 Recommended Learning Resources
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#6b21a8',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: '600'
                    }}>
                      {courseRecommendations.filter(c => !c.isPaid).length} FREE + {courseRecommendations.filter(c => c.isPaid).length} PAID
                    </span>
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '0.875rem' }}>
                    Curated courses from YouTube, Telegram, and premium platforms to help you land your dream role!
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                  }}>
                    {courseRecommendations.map((course, index) => (
                      <div key={index} style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: course.isPaid ? '2px solid #fef3c7' : '2px solid #dcfce7',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                        }}>

                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: course.isPaid ? '#fef3c7' : '#dcfce7',
                          color: course.isPaid ? '#92400e' : '#166534'
                          }}>
                          {course.isPaid ? course.price : 'FREE'}
                        </div>

                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>
                          {course.platform === 'YouTube' ? '▶️' :
                          course.platform === 'Telegram' ? '✈️' :
                          course.platform === 'Udemy' ? '🎓' :
                          course.platform === 'Coursera' ? '📚' : '💡'}
                        </div>

                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: '8px',
                          lineHeight: '1.4',
                          minHeight: '40px'
                        }}>
                          {course.title}
                        </h4>

                        {course.channelName && (
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginBottom: '10px',
                            fontStyle: 'italic'
                          }}>
                            by {course.channelName}
                          </p>
                        )}

                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap',
                          marginBottom: '12px'
                          }}>
                          <span style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#ede9fe',
                            color: '#6b21a8',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            {course.platform}
                          </span>

                          <span style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#f3f4f6',
                            color: '#4b5563',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            ⏱️ {course.duration}
                          </span>

                          <span style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#f3f4f6',
                            color: '#4b5563',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}>
                            📊 {course.difficulty}
                          </span>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}>
                            🎯 {course.skillGap}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          marginBottom: '16px',
                          lineHeight: '1.5',
                          minHeight: '60px'
                        }}>
                          {course.description}
                        </p>

                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            textAlign: 'center',
                            backgroundColor: course.isPaid ? '#f59e0b' : '#10b981',
                            color: 'white',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = course.isPaid ? '#d97706' : '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = course.isPaid ? '#f59e0b' : '#10b981';
                          }}
                        >
                          {course.isPaid ? '🎓 View Course →' : '▶️ Start Learning Free'}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cover Letter Tab Content */}
          {activeTab === 'cover-letter' && <CoverLetterGenerator />}
          
        </div>
      </div>
    </>
  );
};

export default Dashboard;


