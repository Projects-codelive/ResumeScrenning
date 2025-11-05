const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const CourseRecommendation = require('../models/courseRecommendation.model');
const { GoogleGenAI } = require('@google/genai');

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// ✅ Helper function to normalize difficulty values
function normalizeDifficulty(difficulty) {
  if (!difficulty) return 'Beginner';

  const lower = difficulty.toLowerCase();

  if (lower.includes('beginner')) return 'Beginner';
  if (lower.includes('intermediate')) return 'Intermediate';
  if (lower.includes('advanced')) return 'Advanced';

  return 'Beginner';
}

// Generate course recommendations
router.post('/recommend-courses', auth, async (req, res) => {
  try {
    const { missingSkills, company, role, userCV } = req.body;

    if (!missingSkills || missingSkills.length === 0) {
      return res.json({
        success: true,
        message: 'No skill gaps found! Your CV matches the role perfectly.',
        recommendations: []
      });
    }

    console.log('🎓 Generating course recommendations for:', missingSkills);

    const prompt = `You are a career development expert. A user is applying for a ${role} position at ${company}.

Their CV is missing these skills: ${missingSkills.join(', ')}

Generate EXACTLY 5 LEARNING RESOURCES (3 FREE + 2 PAID) to help them learn these skills.

PRIORITIZE FREE RESOURCES:
- YouTube playlists (with channel names)
- Telegram channels/groups
- freeCodeCamp courses
- GitHub learning repositories
- Free documentation sites

For EACH resource, provide:
1. title: Specific name
2. platform: YouTube, Telegram, GitHub, freeCodeCamp, Udemy, Coursera, etc.
3. url: Direct realistic link
4. skillGap: Which missing skill it addresses
5. duration: Estimated time
6. difficulty: MUST be EXACTLY one of: "Beginner", "Intermediate", or "Advanced" (no combinations!)
7. isPaid: true or false
8. price: "Free" or Indian Rupees (₹) amount (e.g., ₹499, ₹1,699, ₹3,499)
9. rating: 4.0 to 5.0
10. description: 1-2 sentences
11. channelName: (Only for YouTube/Telegram) Channel name

IMPORTANT: difficulty MUST be exactly "Beginner", "Intermediate", or "Advanced" - no other values!
- For PAID courses, use realistic Indian Rupees prices (₹499 to ₹5,999)


Return ONLY JSON array (no markdown):
[
  {
    "title": "Python Full Course",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=...",
    "skillGap": "Python",
    "duration": "12 hours",
    "difficulty": "Beginner",
    "isPaid": false,
    "price": "Free",
    "rating": 4.7,
    "description": "Complete Python tutorial.",
    "channelName": "freeCodeCamp.org"
  }
]`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.candidates[0]?.content?.parts[0]?.text || '';
    console.log('Raw AI response:', text);

    let courses;
    try {
      let cleanedResponse = text.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```$/, '');
      }

      courses = JSON.parse(cleanedResponse);

      // ✅ CLEAN THE DATA - Normalize difficulty and ensure structure
      courses = courses.map(course => ({
        ...course,
        difficulty: normalizeDifficulty(course.difficulty),
        channelName: course.channelName || null,
        isPaid: course.isPaid === true || course.isPaid === 'true',
        rating: parseFloat(course.rating) || 4.5
      }));

      // Ensure we have 3 free + 2 paid
      const freeCourses = courses.filter(c => !c.isPaid).slice(0, 3);
      const paidCourses = courses.filter(c => c.isPaid).slice(0, 2);
      courses = [...freeCourses, ...paidCourses];

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Using fallback resources...');

      const topSkills = missingSkills.slice(0, 3);
      courses = [
        {
          title: `${topSkills[0] || 'Programming'} - Complete Tutorial`,
          platform: 'YouTube',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent((topSkills[0] || 'programming') + ' full course')}`,
          skillGap: topSkills[0] || 'Programming',
          duration: '10+ hours',
          difficulty: 'Beginner',
          isPaid: false,
          price: 'Free',
          rating: 4.5,
          description: `Comprehensive video tutorial series covering ${topSkills[0] || 'programming'}.`,
          channelName: 'freeCodeCamp.org'
        },
        {
          title: `Learn ${topSkills[1] || 'Development'}`,
          platform: 'freeCodeCamp',
          url: 'https://www.freecodecamp.org/learn',
          skillGap: topSkills[1] || 'Development',
          duration: 'Self-paced',
          difficulty: 'Beginner',
          isPaid: false,
          price: 'Free',
          rating: 4.8,
          description: 'Interactive coding challenges with certification.',
          channelName: null
        },
        {
          title: `${topSkills[2] || 'Tech'} Resources`,
          platform: 'Telegram',
          url: 'https://t.me/programming_resources',
          skillGap: topSkills[2] || 'Tech',
          duration: 'Ongoing',
          difficulty: 'Intermediate',
          isPaid: false,
          price: 'Free',
          rating: 4.3,
          description: 'Community sharing tutorials and resources.',
          channelName: 'Tech Learning Hub'
        },
        {
          title: `${topSkills[0] || 'Programming'} Bootcamp`,
          platform: 'Udemy',
          url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(topSkills[0] || 'programming')}`,
          skillGap: topSkills[0] || 'Programming',
          duration: '40 hours',
          difficulty: 'Intermediate',
          isPaid: true,
          price: '$49.99',
          rating: 4.6,
          description: 'Complete bootcamp with certificate.',
          channelName: null
        },
        {
          title: `Professional ${topSkills[1] || 'Development'}`,
          platform: 'Coursera',
          url: 'https://www.coursera.org/',
          skillGap: topSkills[1] || 'Development',
          duration: '6 weeks',
          difficulty: 'Advanced',
          isPaid: true,
          price: '$79',
          rating: 4.7,
          description: 'University-backed professional course.',
          channelName: null
        }
      ];
    }

    // Save to database
    const recommendation = new CourseRecommendation({
      userId: req.user._id,
      company,
      role,
      missingSkills,
      recommendations: courses
    });

    await recommendation.save();
    console.log('✅ Saved course recommendations to database');

    res.json({
      success: true,
      message: `Found ${courses.length} resources!`,
      recommendations: courses,
      recommendationId: recommendation._id
    });

  } catch (error) {
    console.error('❌ Error generating course recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate course recommendations',
      error: error.message
    });
  }
});

// Get saved recommendations
router.get('/my-recommendations', auth, async (req, res) => {
  try {
    const recommendations = await CourseRecommendation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations'
    });
  }
});

module.exports = router;
