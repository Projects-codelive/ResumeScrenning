const { GoogleGenAI } = require('@google/genai'); // ✅ MATCHES ai.service.js

// ✅ MATCHES ai.service.js
const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Generate a professional cover letter using AI
 * @param {Object} params - Generation parameters
 * @param {Object} params.userInfo - User's information (name, skills, experience)
 * @param {String} params.company - Target company name
 * @param {String} params.role - Target job role
 * @param {String} params.jobDescription - Job description/requirements
 * @param {String} params.template - Template style (professional/creative/technical)
 * @returns {Promise<String>} - Generated cover letter content
 */
async function generateCoverLetter({ userInfo, company, role, jobDescription, template = 'professional' }) {
  try {
    const prompt = buildPrompt(userInfo, company, role, jobDescription, template);
    console.log('🤖 Generating cover letter with Gemini AI...');

    // ✅ SYNTAX MATCHES ai.service.js
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    // ✅ SYNTAX MATCHES ai.service.js
    const coverLetterContent = response.candidates[0]?.content?.parts[0]?.text || '';

    if (!coverLetterContent) {
      throw new Error("AI response was empty.");
    }

    console.log('✅ Cover letter generated successfully');
    return coverLetterContent.trim();

  } catch (error) {
    console.error('❌ Error in generateCoverLetter, using fallback:', error.message);
    // ✅ ADDED FALLBACK to prevent 500 error, just like in your ai.service.js
    return `[Date]

Hiring Manager
${company}
[City, State]

Dear Hiring Manager,

I am writing to express my keen interest in the ${role} position at ${company}, which I discovered through [Platform where you saw the opening]. With a background that includes experience in ${userInfo.experience || 'relevant fields'} and a strong command of skills such as ${userInfo.skills.slice(0, 3).join(', ')}, I am confident that I possess the qualifications necessary to contribute significantly to your team.

My experience has prepared me to tackle the challenges of this role and deliver results. I am particularly drawn to ${company} because of its reputation for innovation and its impactful work in the industry. I am eager to bring my abilities to your organization and help you achieve your goals.

Thank you for your time and consideration. I have attached my resume for your review and look forward to the possibility of discussing my application further in an interview.

Sincerely,
${userInfo.name}`;
  }
}

/**
 * Build the AI prompt based on template style
 */
function buildPrompt(userInfo, company, role, jobDescription, template) {
  const { name, email, phone, skills, experience } = userInfo;

  // Base prompt structure
  let styleGuide = '';

  switch (template) {
    case 'creative':
      styleGuide = `Write in a creative, engaging tone that showcases personality while maintaining professionalism. 
      Use vivid language and show enthusiasm. Include a memorable opening line.`;
      break;

    case 'technical':
      styleGuide = `Write in a technical, precise tone focusing on technical skills, methodologies, and achievements. 
      Use industry-specific terminology and emphasize problem-solving capabilities.`;
      break;

    case 'professional':
    default:
      styleGuide = `Write in a formal, professional tone that is confident and respectful. 
      Focus on qualifications, achievements, and value proposition.`;
      break;
  }

  // YOUR ORIGINAL, FULL PROMPT IS PRESERVED HERE
  const prompt = `You are an expert career counselor and professional cover letter writer.

Write a compelling cover letter for the following candidate:

**CANDIDATE INFORMATION:**
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Key Skills: ${skills && skills.length > 0 ? skills.join(', ') : 'General skills'}
- Experience: ${experience || 'Entry-level professional'}

**TARGET POSITION:**
- Company: ${company}
- Role: ${role}
${jobDescription ? `- Job Requirements: ${jobDescription}` : ''}

**WRITING STYLE:**
${styleGuide}

**STRUCTURE REQUIREMENTS:**
1. **Opening Paragraph (2-3 sentences):**
   - Express enthusiasm for the role
   - Mention how you learned about the position
   - Brief statement about why you're a strong fit

2. **Body Paragraph 1 (3-4 sentences):**
   - Highlight relevant skills and experience
   - Provide specific examples of achievements
   - Connect your background to the job requirements

3. **Body Paragraph 2 (3-4 sentences):**
   - Demonstrate knowledge of the company
   - Explain why you're interested in this specific company
   - Show how you can contribute to their success

4. **Closing Paragraph (2-3 sentences):**
   - Restate interest in the position
   - Express desire for an interview
   - Thank them for consideration

**IMPORTANT GUIDELINES:**
- Keep the letter between 250-350 words
- Use specific examples and quantifiable achievements when possible
- Avoid generic phrases like "I am writing to apply"
- Don't repeat information verbatim from the resume
- Make it personal and tailored to this specific role and company
- Use action verbs and confident language
- Maintain a positive, enthusiastic tone throughout
- End with a professional closing: "Sincerely," followed by the candidate's name

**FORMAT:**
Return ONLY the cover letter content in plain text format (no markdown, no formatting tags).
Start with the date and recipient's address, then the salutation, then the body paragraphs, then the closing.

Format:
[Today's Date]

Hiring Manager
${company}
[City, State - use typical location or leave generic]

Dear Hiring Manager,

[Opening paragraph]

[Body paragraph 1]

[Body paragraph 2]

[Closing paragraph]

Sincerely,
${name}
${email}
${phone}

Generate the cover letter now:`;

  return prompt;
}

/**
 * Regenerate a cover letter with variations
 * @param {String} originalContent - Original cover letter content
 * @param {Object} userInfo - User's information
 * @param {String} company - Target company
 * @param {String} role - Target role
 * @returns {Promise<String>} - Regenerated cover letter
 */
async function regenerateCoverLetter(originalContent, userInfo, company, role) {
  try {
    const prompt = `You are a professional cover letter writer. 

I have a cover letter, but I want you to create a DIFFERENT VERSION that:
- Maintains the same core qualifications and experience
- Uses different phrasing and examples
- Has a fresh opening and closing
- Keeps the same professional tone
- Is still tailored to the same company and role

**ORIGINAL COVER LETTER:**
${originalContent}

**REQUIREMENTS:**
- Create a NEW version, not just minor edits
- Change the opening hook completely
- Use different examples or phrase them differently
- Vary the sentence structure and flow
- Keep the same length (250-350 words)
- Maintain professional formatting

Generate the new version now:`;

    // ✅ SYNTAX MATCHES ai.service.js
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    // ✅ SYNTAX MATCHES ai.service.js
    const newContent = response.candidates[0]?.content?.parts[0]?.text || '';
    
    if (!newContent) {
        throw new Error("AI failed to regenerate response.");
    }

    return newContent.trim();

  } catch (error) {
    console.error('❌ Error regenerating cover letter, returning original:', error.message);
    // As a fallback, return the original content instead of crashing
    return originalContent;
  }
}

module.exports = {
  generateCoverLetter,
  regenerateCoverLetter
};