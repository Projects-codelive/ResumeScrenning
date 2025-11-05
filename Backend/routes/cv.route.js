const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer'); // 1. ADDED THIS IMPORT
const { getRoleRequirements } = require('../services/role.service');
const { analyzeAndCustomizeCV, generateCVSuggestions } = require('../services/ai.service');
const CVHistory = require('../models/cvHistory.model');
const auth = require('../middleware/auth.middleware');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Calculate job match score based on skills analysis
function calculateMatchScore(analysis, roleRequirements) {
  if (!analysis || !roleRequirements) {
    return { 
      score: 0, 
      level: 'Poor', 
      color: '#d32f2f', 
      emoji: '🔴',
      totalRequired: 0,
      matched: 0,
      missing: 0,
      details: {
        matchedSkills: [],
        missingSkills: []
      }
    };
  }

  const matchedSkills = analysis.skillsMatch || analysis.matchingSkills || [];
  const missingSkills = analysis.missingSkills || [];

  const matchedCount = matchedSkills.length;
  const missingCount = missingSkills.length;
  const totalRequiredSkills = matchedCount + missingCount;

  let skillScore = totalRequiredSkills > 0 
    ? (matchedCount / totalRequiredSkills) * 100 
    : 0;

  skillScore = Math.round(skillScore);

  let matchLevel, matchColor, matchEmoji;

  if (skillScore >= 75) {
    matchLevel = 'Excellent Match';
    matchColor = '#2e7d32';
    matchEmoji = '🟢';
  } else if (skillScore >= 50) {
    matchLevel = 'Good Match';
    matchColor = '#f57c00';
    matchEmoji = '🟡';
  } else {
    matchLevel = 'Needs Improvement';
    matchColor = '#d32f2f';
    matchEmoji = '🔴';
  }

  return {
    score: skillScore,
    level: matchLevel,
    color: matchColor,
    emoji: matchEmoji,
    totalRequired: totalRequiredSkills,
    matched: matchedCount,
    missing: missingCount,
    details: {
      matchedSkills,
      missingSkills
    }
  };
}


// Enhanced CV analysis endpoint with AI and history saving
router.post('/analyze', auth, upload.single('cv'), async (req, res) => { 
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CV file uploaded'
      });
    }

    const { buffer, originalname } = req.file;
    const { company, role, companyName, profileData, roleRequirements } = req.body;

    let cvText = '';
    const filename = originalname.toLowerCase();

    if (filename.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      cvText = data.text;
    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
      const { value } = await mammoth.extractRawText({ buffer });
      cvText = value;
    } else if (filename.endsWith('.txt')) {
      cvText = buffer.toString('utf-8');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Please upload PDF, Word, or Text file.'
      });
    }

    const parsedProfileData = profileData ? JSON.parse(profileData) : {};
    let requirements = roleRequirements ? JSON.parse(roleRequirements) : null;
    
    if (!requirements && company && role) {
      requirements = getRoleRequirements(company, role);
    }

    const parsedCV = parseCV(cvText);

    let aiAnalysis = null;
    try {
      if (requirements) {
        const roleDetails = {
          company: company,
          role: role,
          skills: requirements.skills || [],
          experience: requirements.experience || 0,
          jobDescription: requirements.jobDescription || ''
        };

        aiAnalysis = await analyzeAndCustomizeCV(cvText, parsedProfileData, roleDetails);
      }
    } catch (aiError) {
      console.log('AI analysis failed, using basic analysis:', aiError.message);
      
      if (requirements && requirements.skills) {
        const cvSkills = parsedCV.skills.map(s => s.toLowerCase());
        const requiredSkills = requirements.skills.map(s => s.toLowerCase());

        const matchingSkills = requirements.skills.filter(skill =>
          cvSkills.some(cvSkill => cvSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cvSkill))
        );

        const missingSkills = requirements.skills.filter(skill =>
          !cvSkills.some(cvSkill => cvSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cvSkill))
        );

        const score = Math.round((matchingSkills.length / requirements.skills.length) * 100);

        aiAnalysis = {
          analysis: {
            skillsMatch: matchingSkills,
            missingSkills: missingSkills,
            overallScore: score.toString(),
            strengths: ["CV processed successfully"],
            weaknesses: missingSkills.length > 0 ? ["Missing some required skills"] : []
          },
          recommendations: [
            `Consider adding these missing skills: ${missingSkills.join(', ')}`,
            "Highlight relevant experience that demonstrates required skills"
          ],
          changesMade: ["Basic analysis completed"],
          improvedCV: null
        };
      }
    }

    const matchingSkills = aiAnalysis?.analysis?.skillsMatch || [];
    const missingSkills = aiAnalysis?.analysis?.missingSkills || [];
    const score = parseInt(aiAnalysis?.analysis?.overallScore) || 0;

    const strengths = [];
    if (matchingSkills.length > 0) {
      strengths.push(`✅ Possesses ${matchingSkills.length} out of ${matchingSkills.length + missingSkills.length} required skills`);
    }
    if (parsedCV.experience && parsedCV.experience.length > 0) {
      strengths.push(`✅ Has ${parsedCV.experience.length} relevant work experience entries`);
    }
    if (parsedCV.education && parsedCV.education.length > 0) {
      strengths.push(`✅ Educational background in relevant field`);
    }
    if (parsedCV.skills && parsedCV.skills.length > 5) {
      strengths.push(`✅ Strong technical skill set with ${parsedCV.skills.length} skills listed`);
    }
    if (score >= 60) {
      strengths.push(`✅ Good alignment with ${role} role requirements`);
    }

    const weaknesses = [];
    if (missingSkills.length > 0) {
      weaknesses.push(`⚠️ Missing ${missingSkills.length} key skills: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? '...' : ''}`);
    }
    if (score < 50) {
      weaknesses.push(`⚠️ Skills match score is below 50% - significant upskilling needed`);
    }
    if (!parsedCV.certifications || parsedCV.certifications.length === 0) {
      weaknesses.push('⚠️ No professional certifications mentioned');
    }
    if (parsedCV.experience && parsedCV.experience.length < 2) {
      weaknesses.push('⚠️ Limited work experience demonstrated');
    }

    const suggestions = [];
    if (missingSkills.length > 0) {
      suggestions.push(`💡 Consider learning: ${missingSkills.slice(0, 3).join(', ')}`);
      suggestions.push(`💡 Take online courses to develop missing skills`);
    }
    suggestions.push(`💡 Tailor your CV specifically for ${companyName || company} by highlighting relevant projects`);
    suggestions.push('💡 Add quantifiable achievements (e.g., "Improved performance by 30%")');
    if (score < 70) {
      suggestions.push('💡 Gain practical experience through projects or internships');
    }

    const analysis = {
      matchingSkills,
      missingSkills,
      suggestions: aiAnalysis?.recommendations || suggestions,
      score,
      strengths: aiAnalysis?.analysis?.strengths?.length > 0 ? aiAnalysis.analysis.strengths : strengths,
      weaknesses: aiAnalysis?.analysis?.weaknesses?.length > 0 ? aiAnalysis.analysis.weaknesses : weaknesses,
      changesMade: aiAnalysis?.changesMade || []
    };

    const responseData = {
      originalText: cvText,
      parsedSections: parsedCV,
      roleRequirements: requirements,
      analysis: analysis,
      aiImprovedCV: aiAnalysis?.improvedCV || null,
      matchScore: calculateMatchScore(analysis, requirements),
      recommendations: {
        skillsToAdd: analysis.missingSkills,
        skillsMatched: analysis.matchingSkills,
        overallScore: analysis.score,
        suggestions: analysis.suggestions,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        changesMade: analysis.changesMade,
        structure: {
          clarity: aiAnalysis?.analysis?.structure?.clarity || 8,
          formatting: aiAnalysis?.analysis?.structure?.formatting || 7,
          impact: aiAnalysis?.analysis?.structure?.impact || 6,
          comments: aiAnalysis?.analysis?.structure?.comments || analysis.suggestions || []
        }
      }
    };

    try {
      const cvHistory = new CVHistory({
        userId: req.user._id,
        companyName: companyName || company,
        roleName: role,
        originalCV: cvText,
        improvedCV: aiAnalysis?.improvedCV || 'Basic improvements applied',
        analysisResults: {
          score: responseData.matchScore.score, // ✅ CORRECTED: Saving the calculated score
          matchingSkills: analysis.matchingSkills,
          missingSkills: analysis.missingSkills,
          suggestions: analysis.suggestions || [],
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || []
        }
      });
      
      await cvHistory.save();
      console.log('CV analysis saved to history successfully');
    } catch (historyError) {
      console.log('Failed to save to history:', historyError.message);
    }

    res.json({
        success: true,
        data: responseData
    });


  } catch (error) {
    console.error('CV analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing CV',
      error: error.message
    });
  }
});

// Simple CV upload endpoint (for Cover Letter Generator)
router.post('/upload', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { buffer, originalname } = req.file;
    let cvText = '';

    if (originalname.toLowerCase().endsWith('.pdf')) {
      cvText = (await pdfParse(buffer)).text;
    } else if (originalname.toLowerCase().endsWith('.docx')) {
      cvText = (await mammoth.extractRawText({ buffer })).value;
    } else if (originalname.toLowerCase().endsWith('.txt')) {
      cvText = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }

    const parsedCV = parseCV(cvText);

    res.json({
      success: true,
      data: {
        filename: originalname,
        parsedSections: parsedCV
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing file', error: error.message });
  }
});

// Download Route for history items
router.get('/download/:id', auth, async (req, res) => {
    try {
        const cvHistoryItem = await CVHistory.findOne({ _id: req.params.id, userId: req.user._id });
        if (!cvHistoryItem) {
            return res.status(404).json({ success: false, message: 'CV history not found.' });
        }
        const cvContent = cvHistoryItem.improvedCV || cvHistoryItem.originalCV;
        if (!cvContent) {
            return res.status(400).json({ success: false, message: 'No content available for this CV.' });
        }
        const htmlContent = `<!DOCTYPE html><html><head><style>body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; line-height: 1.5; margin: 1in; } pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }</style></head><body><pre>${cvContent}</pre></body></html>`;
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        const filename = `CV-${cvHistoryItem.companyName}-${cvHistoryItem.roleName}.pdf`.replace(/\s+/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdf);
    } catch (error) {
        console.error('Error downloading CV from history:', error);
        res.status(500).json({ success: false, message: 'Failed to generate and download CV PDF.' });
    }
});


// Helper function for basic CV parsing
function parseCV(cvText) {
  const sections = {
    name: '',
    skills: [],
    experience: [],
    education: [],
    contact: {},
    summary: ''
  };
  const lines = cvText.split('\n').map(line => line.trim()).filter(line => line);
  sections.name = lines.find(line =>
    line.length > 4 && line.length < 50 &&
    /^[A-Z][a-zA-Z\s.-]+$/.test(line.trim()) &&
    !/(summary|education|skills|experience|projects|contact|@|http)/i.test(line)
  )?.trim() || '';
  const emailMatch = cvText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) sections.contact.email = emailMatch[0];
  const phoneMatch = cvText.match(/[\+]?[\d\s\-\(\)]{8,15}/);
  if (phoneMatch) sections.contact.phone = phoneMatch[0];
  const skillsIndex = lines.findIndex(line => /skills?|technologies?|expertise/i.test(line));
  if (skillsIndex !== -1) {
    for (let i = skillsIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line && !(/experience|education|projects/i.test(line))) {
        sections.skills.push(...line.split(/[,•·\-\|]/).map(s => s.trim()).filter(s => s));
      } else {
        break;
      }
    }
  }
  const expIndex = lines.findIndex(line => /experience|work|employment|career/i.test(line));
  if (expIndex !== -1) {
    let currentExp = {};
    for (let i = expIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || /education|skills|projects/i.test(line)) break;
      if (line.match(/\d{4}/)) {
        if (currentExp.position) {
          sections.experience.push(currentExp);
          currentExp = {};
        }
        currentExp.duration = line;
      } else if (!currentExp.position) {
        currentExp.position = line;
      } else if (!currentExp.company) {
        currentExp.company = line;
      }
    }
    if (currentExp.position) sections.experience.push(currentExp);
  }
  return sections;
}

module.exports = router;