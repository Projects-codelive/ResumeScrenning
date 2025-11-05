const express = require('express');
const puppeteer = require('puppeteer');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const emailService = require('../services/email.service'); // ✨ IMPORT EMAIL SERVICE

// ========================================================
// ✨ NEW HELPER: Refactored PDF Generation Logic
// ========================================================
async function generatePdfAsBuffer(profileData) {
    if (!profileData || !profileData.cvContent) {
        throw new Error('CV content is required');
    }

    // Parse and clean the CV content
    const parsedData = parseAndCleanResumeContent(profileData.cvContent);

    // Initialize data structure that templates expect
    const data = {
        name: parsedData.name || "Your Name",
        contact: parsedData.contact || "", // ✨ This now comes from the CV text
        summary: "",
        experience: [],
        skills: [],
        education: [],
        projects: [],
        certifications: [],
        highlights: []
    };

    // Transform dynamicSections into the arrays that templates expect
    if (parsedData.dynamicSections && parsedData.dynamicSections.length > 0) {
        console.log('Processing sections:', parsedData.dynamicSections.map(s => s.title));
        
        parsedData.dynamicSections.forEach(section => {
            const content = Array.isArray(section.content) ? section.content : [section.content];
            const type = section.type ? section.type.toLowerCase() : 'other';

            switch(type) {
                case 'summary':
                    data.summary = content.join(' \n ');
                    break;
                case 'experience':
                    data.experience.push(...content);
                    break;
                case 'skills':
                    data.skills.push(...content);
                    break;
                case 'education':
                    data.education.push(...content);
                    break;
                case 'projects':
                    data.projects.push(...content);
                    break;
                case 'certifications':
                    data.certifications.push(...content);
                    break;
                case 'highlights':
                    data.highlights.push(...content);
                    break;
                case 'declaration':
                    data.highlights.push(...content);
                    break;
                default:
                    // Only add if it's not the contact info we already handled
                    if (type !== 'contact') {
                         data.highlights.push(`${section.title}:`, ...content);
                    }
            }
        });
    }

    // Create HTML template based on selected template
    const htmlContent = generateProfessionalHTML(data, profileData);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '0.4in', right: '0.5in', bottom: '0.4in', left: '0.5in' },
        printBackground: true,
        preferCSSPageSize: true
    });

    await browser.close();
    
    return pdf; // Return the PDF buffer
}


// ========================================================
// UPDATED ROUTE: Use the refactored function
// ========================================================
router.post('/generate-cv-pdf', auth, async (req, res) => {
    try {
        console.log('PDF generation request received:', req.body.profileData.template);
        
        // ✨ UPDATED: Pass the whole profileData object
        // The frontend will now send { cvContent, template, userProfile }
        const pdf = await generatePdfAsBuffer(req.body.profileData);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=professional-cv.pdf',
            'Content-Length': pdf.length
        });

        res.send(pdf);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
});


// ========================================================
// ✨ NEW ROUTE: Email CV
// ========================================================
router.post('/email-cv-pdf', auth, async (req, res) => {
    try {
        const { profileData, toEmail } = req.body;

        if (!toEmail) {
            return res.status(400).json({ message: 'Email address (toEmail) is required' });
        }

        console.log(`Email CV request received for: ${toEmail}`);

        // 1. Generate the PDF buffer
        const pdf = await generatePdfAsBuffer(profileData);
        
        // 2. Get user's name for personalizing the email
        const userFullname = req.user.fullname ? 
            `${req.user.fullname.firstname || ''} ${req.user.fullname.lastname || ''}`.trim() : 
            req.user.email;
        
        // 3. Send the email
        await emailService.sendCvEmail(toEmail, pdf, userFullname || 'User');

        res.status(200).json({ success: true, message: `CV successfully sent to ${toEmail}` });

    } catch (error) {
        console.error('Email CV error:', error);
        res.status(500).json({ message: 'Error emailing PDF', error: error.message });
    }
});


// ========================================================
// 🔧 FIX: Hyperlink Function
// This is the most important function for your links
// ========================================================
function markdownToHtml(text) {
  if (!text) return '';

  let html = text;

  // 1. Convert Markdown links: [text](url) -> <a href="url">text</a>
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a href="$2" target="_blank" style="color: #0000EE; text-decoration: underline;">$1</a>');

  // 2. Convert standalone http/https URLs -> <a href="url">url</a>
  html = html.replace(/(?<!href="|>)(https?:\/\/[^\s<)"']+)/g,
    '<a href="$1" target="_blank" style="color: #0000EE; text-decoration: underline;">$1</a>');

  // 3. Convert standalone www. URLs -> <a href="//url">url</a>
  html = html.replace(/(?<!href="|https?:\/\/|>)(\bwww\.[^\s<)"']+)/g,
    '<a href="http://$1" target="_blank" style="color: #0000EE; text-decoration: underline;">$1</a>');

  // 4. Convert email addresses -> <a href="mailto:email">email</a>
  html = html.replace(/(?<!href=")(?<!mailto:)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?!<\/a>)/g,
    '<a href="mailto:$1" style="color: #0000EE; text-decoration: underline;">$1</a>');

  // 5. Convert newlines to <br> for summary/description blocks
  html = html.replace(/\n/g, '<br>');

  return html;
}



// SUPER DYNAMIC parsing that detects ANY section type
function parseAndCleanResumeContent(content) {
  const cleanContent = content
    // Remove AI analysis sections
    .replace(/AI-OPTIMIZED CV FOR.*?\n/gi, '')
    .replace(/===\s*ANALYSIS SUMMARY\s*===[\s\S]*$/gi, '')
    .replace(/Overall Score:.*?\n/gi, '')
    .replace(/\*\*Analysis:.*?\*\*/gi, '')
    .replace(/Analysis:.*?\n/gi, '')
    .replace(/AI Enhancement:.*?\n/gi, '')
    .replace(/Improvements made:.*?\n/gi, '')
    
    // Keep **bold** as <b>
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\* \*\*/g, '• ')
    .replace(/^\*\s+/gm, '• ')
    .trim();


    const lines = cleanContent.split('\n').filter(line => line.trim() && !line.includes('Analysis'));
    
    const sections = {
        name: '',
        contact: '',
        dynamicSections: [] // This will store ALL sections found in original resume
    };

    let currentSection = null;
    let currentContent = [];

    // Extract name (first meaningful line)
    sections.name = lines.find(line => 
        line.length > 5 && line.length < 50 &&
        /^[A-Z][a-zA-Z\s]+$/.test(line.trim()) &&
        !line.includes('@') && 
        !line.includes('http') &&
        !line.includes('|') &&
        !line.match(/^(OBJECTIVE|SUMMARY|EDUCATION|SKILLS|EXPERIENCE|PROJECTS|CERTIFICATION)/i)
    )?.trim() || 'Your Name';

    // ✨ FIX: This now finds the contact line from your CV text
    // It looks for @, http, linkedin, github, or markdown links [text](url)
    const contactLine = lines.find(line => 
        line.includes('@') || 
        line.includes('http') || 
        line.includes('linkedin.com') || 
        line.includes('github.com') || 
        line.includes('(') || // for phone
        /\[.*\]\(.*\)/.test(line) || // Markdown links
        /\|/.test(line) // Pipe separators
    );
    sections.contact = contactLine || '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip name and contact line if found
        if (line === sections.name || line === sections.contact) continue;

        const commonSections = /^(objective|summary|education|technical skills|skills|experience|projects|certifications|achievements|strengths|highlights|declaration|professional summary|work experience|qualifications|core skills|soft skills|languages|frontend|backend|tools|frameworks|concepts|internships)/i;

        const isSectionHeader = 
            (commonSections.test(line) && !line.endsWith(':')) ||
            (/^[A-Z][A-Z\s-]+$/.test(line) && line.length < 50 && line.length > 3) ||
            (line.startsWith('<b>') && line.endsWith('</b>')) ||
            (/^\d+\.\s*[A-Za-z]/.test(line));


        if (isSectionHeader && !line.includes('@') && !line.includes('|')) {
            // Save previous section if exists
            if (currentSection && currentContent.length > 0) {
                sections.dynamicSections.push({
                    title: currentSection.replace(/<b>/g, '').replace(/<\/b>/g, ''), // Clean title
                    content: currentContent.filter(c => c.trim()),
                    type: getSectionType(currentSection)
                });
            }
            
            // Start new section
            currentSection = line;
            currentContent = [];
        } else if (currentSection && line) {
            currentContent.push(line);
        }
    }

    // Add final section
    if (currentSection && currentContent.length > 0) {
        sections.dynamicSections.push({
            title: currentSection.replace(/<b>/g, '').replace(/<\/b>/g, ''), // Clean title
            content: currentContent.filter(c => c.trim()),
            type: getSectionType(currentSection)
        });
    }

    console.log('Detected sections:', sections.dynamicSections.map(s => s.title));
    console.log('Detected contact line:', sections.contact); // This should now show your CV's contact line
    return sections;
}

// Determine section type for styling
function getSectionType(sectionTitle) {
    const title = sectionTitle.toLowerCase();
    
    if (title.includes('objective') || title.includes('summary') || title.includes('profile')) {
        return 'summary';
    } else if (title.includes('skill') || title.includes('competenc') || title.includes('technolog')) {
        return 'skills';
    } else if (title.includes('education') || title.includes('qualification') || title.includes('academic background')) {
        return 'education';
    } else if (title.includes('project')) {
        return 'projects';
    } else if (title.includes('experience') || title.includes('employment') || title.includes('work')) {
        return 'experience';
    } else if (title.includes('certification') || title.includes('achievement') || title.includes('award')) {
        return 'certifications';
    } else if (title.includes('strength') || title.includes('highlight')) {
        return 'highlights';
    } else if (title.includes('declaration')) {
        return 'declaration';
    } else if (title.includes('contact') || title.includes('linkedin') || title.includes('@')) {
        return 'contact'; // Help filter out contact info
    } else {
        return 'other';
    }
}

// ✨ UPDATED HELPER FUNCTION - Now uses markdownToHtml
function formatContentWithBullets(contentArray) {
  if (!Array.isArray(contentArray)) {
    contentArray = [contentArray];
  }
  
  return contentArray.map(content => {
    const hasBullets = content.includes('•') || 
                      content.includes('◦') || 
                      content.includes('▪') ||
                      content.includes('-') ||
                      content.startsWith('*') ||
                      /^\d+\./.test(content.trim());
    
    // Apply link conversion
    const linkedContent = markdownToHtml(content);

    if (/^[A-Za-z\s]+:/.test(content.trim()) && content.length < 50) {
      return `<div class="subsection-header">${linkedContent}</div>`;
    }
    
    if (hasBullets) {
      return `<div class="content-line">${linkedContent}</div>`;
    }
    
    // Add bullet if one isn't detected
    return `<div class="content-line">• ${linkedContent}</div>`;
  }).join('');
}


function generateProfessionalHTML(data, profileData) {
    const template = profileData.template || 'classic';
    
    switch (template) {
        case 'modern':
            return generateModernTemplate(data, profileData);
        case 'creative':
            return generateCreativeTemplate(data, profileData);
        case 'minimal':
            return generateMinimalTemplate(data, profileData);
        case 'technical':
            return generateTechnicalTemplate(data, profileData);
        default:
            return generateClassicTemplate(data, profileData);
    }
}

// ✨ FIX: All templates now use data.contact and markdownToHtml
function generateClassicTemplate(data, profileData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #1a1a1a; background: white; padding: 20px; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
        .name { font-size: 20pt; font-weight: bold; color: #2c3e50; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .contact { font-size: 9pt; color: #555; line-height: 1.3; }
        .contact a { color: #0000EE !important; text-decoration: underline !important; }
        .section { margin-bottom: 12px; page-break-inside: avoid; }
        .section-title { font-size: 12pt; font-weight: bold; color: #2c3e50; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #34495e; padding-bottom: 3px; margin-bottom: 8px; }
        .content { font-size: 10pt; color: #333; line-height: 1.5; text-align: justify; }
        .content-item { margin-bottom: 8px; padding-left: 0; }
        .content-line { margin-bottom: 4px; padding-left: 15px; text-indent: -15px; }
        .subsection-header { font-weight: 600; color: #2c3e50; margin-top: 6px; margin-bottom: 3px; padding-left: 0; text-indent: 0; }
        a { color: #0000EE; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${data.name}</div>
        <!-- ✨ FIX: This now uses data.contact (from the CV text) and makes it clickable -->
        <div class="contact">${markdownToHtml(data.contact)}</div>
      </div>
      
      ${data.summary ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="content">${markdownToHtml(data.summary)}</div>
        </div>
      ` : ''}
      
      ${data.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Technical Skills</div>
          <div class="content">${formatContentWithBullets(data.skills)}</div>
        </div>
      ` : ''}
      
      ${data.experience.length > 0 ? `
        <div class="section">
          <div class="section-title">Professional Experience</div>
          ${data.experience.map(exp => `
            <div class="content-item">
              ${formatContentWithBullets([exp])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.education.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${data.education.map(edu => `
            <div class="content-item">
              ${formatContentWithBullets([edu])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.projects.length > 0 ? `
        <div class="section">
          <div class="section-title">Projects</div>
          ${data.projects.map(proj => `
            <div class="content-item">
              ${formatContentWithBullets([proj])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.certifications.length > 0 ? `
        <div class="section">
          <div class="section-title">Certifications & Achievements</div>
          ${data.certifications.map(cert => `
            <div class="content-item">
              ${formatContentWithBullets([cert])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.highlights.length > 0 ? `
        <div class="section">
          <div class="section-title">Additional Information</div>
          ${data.highlights.map(highlight => `
            <div class="content-item">
              ${formatContentWithBullets([highlight])}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

function generateModernTemplate(data, profileData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', 'Calibri', 'Arial', sans-serif; font-size: 10pt; line-height: 1.45; color: #2d3748; background: white; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; margin: -20px -20px 15px -20px; }
        .name { font-size: 22pt; font-weight: 600; margin-bottom: 5px; }
        .contact { font-size: 9pt; opacity: 0.95; }
        .contact a { color: #FFFFFF !important; text-decoration: underline !important; }
        .section { margin-bottom: 14px; page-break-inside: avoid; }
        .section-title { font-size: 13pt; font-weight: 600; color: #667eea; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #667eea; }
        .content { font-size: 10pt; color: #4a5568; line-height: 1.5; }
        .content-item { margin-bottom: 8px; }
        .content-line { margin-bottom: 4px; padding-left: 15px; text-indent: -15px; }
        a { color: #0000EE; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${data.name}</div>
        <!-- ✨ FIX: This now uses data.contact (from the CV text) and makes it clickable -->
        <div class="contact">${markdownToHtml(data.contact)}</div>
      </div>
      
      ${data.summary ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="content">${markdownToHtml(data.summary)}</div>
        </div>
      ` : ''}
      
      ${data.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Core Competencies</div>
          <div class="content">${formatContentWithBullets(data.skills)}</div>
        </div>
      ` : ''}
      
      ${data.experience.length > 0 ? `
        <div class="section">
          <div class="section-title">Experience</div>
          ${data.experience.map(exp => `
            <div class="content-item">
              ${formatContentWithBullets([exp])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.education.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${data.education.map(edu => `
            <div class="content-item">
              ${formatContentWithBullets([edu])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.projects.length > 0 ? `
        <div class="section">
          <div class="section-title">Key Projects</div>
          ${data.projects.map(proj => `
            <div class="content-item">
              ${formatContentWithBullets([proj])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.certifications.length > 0 ? `
        <div class="section">
          <div class="section-title">Certifications</div>
          ${data.certifications.map(cert => `
            <div class="content-item">
              ${formatContentWithBullets([cert])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.highlights.length > 0 ? `
        <div class="section">
          <div class="section-title">Additional</div>
          ${data.highlights.map(h => `
            <div class="content-item">
              ${formatContentWithBullets([h])}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

function generateCreativeTemplate(data, profileData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; font-size: 10pt; line-height: 1.45; color: #2c2c2c; background: white; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 18px 20px; margin: -20px -20px 18px -20px; border-radius: 0 0 15px 15px; }
        .name { font-size: 24pt; font-weight: 700; margin-bottom: 6px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
        .contact { font-size: 9.5pt; opacity: 0.95; }
        .contact a { color: #FFFFFF !important; text-decoration: underline !important; }
        .section { margin-bottom: 15px; page-break-inside: avoid; }
        .section-title { font-size: 13pt; font-weight: 700; color: #f5576c; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #f093fb; position: relative; }
        .section-title::before { content: ''; position: absolute; bottom: -2px; left: 0; width: 40px; height: 2px; background: #f5576c; }
        .content { font-size: 10pt; color: #444; line-height: 1.6; }
        .content-item { margin-bottom: 10px; padding-left: 5px; }
        .content-line { margin-bottom: 4px; padding-left: 15px; text-indent: -15px; }
        a { color: #0000EE; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${data.name}</div>
        <!-- ✨ FIX: This now uses data.contact (from the CV text) and makes it clickable -->
        <div class="contact">${markdownToHtml(data.contact)}</div>
      </div>
      
      ${data.summary ? `
        <div class="section">
          <div class="section-title">About Me</div>
          <div class="content">${markdownToHtml(data.summary)}</div>
        </div>
      ` : ''}
      
      ${data.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Skills & Expertise</div>
          <div class="content">${formatContentWithBullets(data.skills)}</div>
        </div>
      ` : ''}
      
      ${data.experience.length > 0 ? `
        <div class="section">
          <div class="section-title">Experience</div>
          ${data.experience.map(exp => `
            <div class="content-item">
              ${formatContentWithBullets([exp])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.projects.length > 0 ? `
        <div class="section">
          <div class="section-title">Notable Projects</div>
          ${data.projects.map(proj => `
            <div class="content-item">
              ${formatContentWithBullets([proj])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.education.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${data.education.map(edu => `
            <div class="content-item">
              ${formatContentWithBullets([edu])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.certifications.length > 0 ? `
        <div class="section">
          <div class="section-title">Certifications</div>
          ${data.certifications.map(cert => `
            <div class="content-item">
              ${formatContentWithBullets([cert])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.highlights.length > 0 ? `
        <div class="section">
          <div class="section-title">More About Me</div>
          ${data.highlights.map(h => `
            <div class="content-item">
              ${formatContentWithBullets([h])}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

function generateMinimalTemplate(data, profileData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 10pt; line-height: 1.6; color: #2c2c2c; background: white; padding: 25px 30px; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ccc; }
        .name { font-size: 24pt; font-weight: normal; color: #1a1a1a; margin-bottom: 8px; }
        .contact { font-size: 9pt; color: #666; font-family: 'Arial', sans-serif; }
        .contact a { color: #0000EE !important; text-decoration: underline !important; }
        .section { margin-bottom: 15px; page-break-inside: avoid; }
        .section-title { font-size: 11pt; font-weight: bold; color: #1a1a1a; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
        .content { font-size: 10pt; color: #444; line-height: 1.6; text-align: justify; }
        .content-item { margin-bottom: 10px; }
        .content-line { margin-bottom: 4px; padding-left: 15px; text-indent: -15px; }
        a { color: #0000EE; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${data.name}</div>
        <!-- ✨ FIX: This now uses data.contact (from the CV text) and makes it clickable -->
        <div class="contact">${markdownToHtml(data.contact)}</div>
      </div>
      
      ${data.summary ? `
        <div class="section">
          <div class="section-title">Profile</div>
          <div class="content">${markdownToHtml(data.summary)}</div>
        </div>
      ` : ''}
      
      ${data.experience.length > 0 ? `
        <div class="section">
          <div class="section-title">Experience</div>
          ${data.experience.map(exp => `
            <div class="content-item">
              ${formatContentWithBullets([exp])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.education.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${data.education.map(edu => `
            <div class="content-item">
              ${formatContentWithBullets([edu])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="content">${formatContentWithBullets(data.skills)}</div>
        </div>
      ` : ''}
      
      ${data.projects.length > 0 ? `
        <div class="section">
          <div class="section-title">Projects</div>
          ${data.projects.map(proj => `
            <div class="content-item">
              ${formatContentWithBullets([proj])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.certifications.length > 0 || data.highlights.length > 0 ? `
        <div class="section">
          <div class="section-title">Additional</div>
          ${[...data.certifications, ...data.highlights].map(item => `
            <div class="content-item">
              ${formatContentWithBullets([item])}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

function generateTechnicalTemplate(data, profileData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Consolas', 'Courier New', monospace; font-size: 9.5pt; line-height: 1.5; color: #1a1a1a; background: white; padding: 18px; }
        .header { background: #2d2d2d; color: #00ff00; padding: 12px 15px; margin: -18px -18px 15px -18px; font-family: 'Courier New', monospace; }
        .name { font-size: 18pt; font-weight: bold; margin-bottom: 4px; letter-spacing: 1px; }
        .contact { font-size: 8.5pt; color: #00cc00; }
        .contact a { color: #33ccff !important; text-decoration: underline !important; }
        .section { margin-bottom: 12px; page-break-inside: avoid; }
        .section-title { font-size: 11pt; font-weight: bold; color: #0066cc; margin-bottom: 6px; padding: 4px 8px; background: #f0f0f0; border-left: 4px solid #0066cc; font-family: 'Arial', sans-serif; }
        .content { font-size: 9.5pt; color: #333; line-height: 1.5; font-family: 'Arial', sans-serif; }
        .content-item { margin-bottom: 8px; padding-left: 5px; }
        .content-line { margin-bottom: 4px; padding-left: 15px; text-indent: -15px; }
        a { color: #0000EE; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${data.name}</div>
        <!-- ✨ FIX: This now uses data.contact (from the CV text) and makes it clickable -->
        <div class="contact">${markdownToHtml(data.contact)}</div>
      </div>
      
      ${data.summary ? `
        <div class="section">
          <div class="section-title">// PROFILE</div>
          <div class="content">${markdownToHtml(data.summary)}</div>
        </div>
      ` : ''}
      
      ${data.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">// TECHNICAL STACK</div>
          <div class="content">${formatContentWithBullets(data.skills)}</div>
        </div>
      ` : ''}
      
      ${data.experience.length > 0 ? `
        <div class="section">
          <div class="section-title">// WORK EXPERIENCE</div>
          ${data.experience.map(exp => `
            <div class="content-item">
              ${formatContentWithBullets([exp])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.projects.length > 0 ? `
        <div class="section">
          <div class="section-title">// PROJECTS</div>
          ${data.projects.map(proj => `
            <div class="content-item">
              ${formatContentWithBullets([proj])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.education.length > 0 ? `
        <div class="section">
          <div class="section-title">// EDUCATION</div>
          ${data.education.map(edu => `
            <div class="content-item">
              ${formatContentWithBullets([edu])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.certifications.length > 0 ? `
        <div class="section">
          <div class="section-title">// CERTIFICATIONS</div>
          ${data.certifications.map(cert => `
            <div class="content-item">
              ${formatContentWithBullets([cert])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.highlights.length > 0 ? `
        <div class="section">
          <div class="section-title">// ADDITIONAL INFO</div>
          ${data.highlights.map(h => `
            <div class="content-item">
              ${formatContentWithBullets([h])}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

// ========================================================
// AI-Analyzed CV PDF Route (Unchanged - Functionality Preserved)
// ========================================================
router.post('/generate-analyzed', auth, async (req, res) => {
  try {
    console.log('AI-Analyzed PDF generation request received');

    const { feedback, company, role, template } = req.body;

    if (!feedback) {
      return res.status(400).json({ 
        message: 'CV analysis feedback is required' 
      });
    }

    // Create enhanced HTML with analysis data
    const htmlContent = generateAnalyzedCVHTML(feedback, company, role);

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0' 
    });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { 
        top: '0.5in', 
        right: '0.6in', 
        bottom: '0.5in', 
        left: '0.6in' 
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();

    const filename = `AI-Analyzed-CV-${company || 'Resume'}-${role || 'Position'}.pdf`.replace(/\s+/g, '-');
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${filename}`,
      'Content-Length': pdf.length
    });
    
    res.send(pdf);

  } catch (error) {
    console.error('AI-Analyzed PDF generation error:', error);
    res.status(500).json({ 
      message: 'Error generating AI-Analyzed PDF', 
      error: error.message 
    });
  }
});

// ========================================================
// HELPER FUNCTION - Generate HTML for AI-Analyzed CV (Unchanged - Functionality Preserved)
// ========================================================
function generateAnalyzedCVHTML(feedback, company, role) {
  const matchScore = feedback.matchScore || {};
  const score = matchScore.score || matchScore.percentage || 0;
  const matchingSkills = feedback.matchingSkills || [];
  const missingSkills = feedback.missingSkills || [];
  const strengths = feedback.strengths || [];
  const weaknesses = feedback.weaknesses || [];
  const structure = feedback.structure || {};
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI-Analyzed CV Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
        }

        .container {
          max-width: 100%;
          padding: 20px;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 30px;
          text-align: center;
        }

        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }

        .header p {
          font-size: 14px;
          opacity: 0.9;
        }

        .score-section {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 10px;
          margin-bottom: 25px;
          border-left: 5px solid ${score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'};
        }

        .score-number {
          font-size: 48px;
          font-weight: bold;
          color: ${score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'};
          margin-bottom: 10px;
        }

        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }

        .box {
          padding: 20px;
          border-radius: 8px;
        }

        .strengths-box {
          background: #f0fdf4;
          border: 2px solid #22c55e;
        }

        .weaknesses-box {
          background: #fef2f2;
          border: 2px solid #ef4444;
        }

        .box-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .strengths-box .box-title {
          color: #16a34a;
        }

        .weaknesses-box .box-title {
          color: #dc2626;
        }

        .box ul {
          list-style: none;
          padding: 0;
        }

        .box li {
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
          font-size: 14px;
          line-height: 1.5;
        }

        .strengths-box li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #16a34a;
          font-weight: bold;
        }

        .weaknesses-box li:before {
          content: '!';
          position: absolute;
          left: 0;
          color: #dc2626;
          font-weight: bold;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .skill-tag {
          background: #e0e7ff;
          color: #4338ca;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .missing-skill {
          background: #fee2e2;
          color: #991b1b;
        }

        .structure-scores {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 15px;
        }

        .score-card {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }

        .score-card-title {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .score-card-value {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 AI-Analyzed CV Report</h1>
          <p>${company && role ? `${company} - ${role}` : 'Professional CV Analysis'}</p>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <div class="score-section">
          <div class="score-number">${score}%</div>
          <h3>Job Match Score</h3>
          <p>
            <strong>${matchScore.matching || 0}</strong> skills matching • 
            <strong>${matchScore.missing || 0}</strong> skills missing out of 
            <strong>${matchScore.total || 0}</strong> required
          </p>
        </div>

        ${strengths.length > 0 || weaknesses.length > 0 ? `
        <div class="grid">
          ${strengths.length > 0 ? `
          <div class="box strengths-box">
            <div class="box-title">✅ CV Strengths</div>
            <ul>
              ${strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${weaknesses.length > 0 ? `
          <div class="box weaknesses-box">
            <div class="box-title">⚠️ Areas to Improve</div>
            <ul>
              ${weaknesses.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${matchingSkills.length > 0 ? `
        <div class="section">
          <div class="section-title">✅ Matching Skills (${matchingSkills.length})</div>
          <div class="skills-list">
            ${matchingSkills.map(skill => `
              <span class="skill-tag">${skill}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${missingSkills.length > 0 ? `
        <div class="section">
          <div class="section-title">❌ Missing Skills (${missingSkills.length})</div>
          <div class="skills-list">
            ${missingSkills.map(skill => `
              <span class="skill-tag missing-skill">${skill}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${structure.clarity !== undefined || structure.formatting !== undefined || structure.impact !== undefined ? `
        <div class="section">
          <div class="section-title">📊 CV Structure Analysis</div>
          <div class="structure-scores">
            ${structure.clarity !== undefined ? `
            <div class="score-card">
              <div class="score-card-title">Clarity</div>
              <div class="score-card-value">${structure.clarity}/10</div>
            </div>
            ` : ''}
            ${structure.formatting !== undefined ? `
            <div class="score-card">
              <div class="score-card-title">Formatting</div>
              <div class="score-card-value">${structure.formatting}/10</div>
            </div>
            ` : ''}
            ${structure.impact !== undefined ? `
            <div class="score-card">
              <div class="score-card-title">Impact</div>
              <div class="score-card-value">${structure.impact}/10</div>
            </div>
            ` : ''}
          </div>

          ${structure.comments && structure.comments.length > 0 ? `
          <div style="margin-top: 15px;">
            <strong>💡 Improvement Suggestions:</strong>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${structure.comments.map(comment => `<li>${comment}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>AI-Powered CV Analysis • Resume Builder Platform</p>
          <p>This report was generated automatically based on AI analysis of your CV.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;