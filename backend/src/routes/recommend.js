import express from 'express';
import OpenAI from 'openai';
import { supabase } from '../config/supabase.js';
import { SUPABASE_URL, OPENAI_API_KEY } from '../config/env.js';
import { mockRecommendations, mockStudents, mockCourses, mockSettings } from '../config/dbMock.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const isDbReady = SUPABASE_URL && !SUPABASE_URL.includes('placeholder');

let openai = null;
if (OPENAI_API_KEY && !OPENAI_API_KEY.includes('placeholder')) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

// Helper to get student profile & completed courses
async function getFullStudentData(clerkId, email) {
  let student = null;
  let completedCourses = [];

  if (isDbReady) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    if (!error && student) {
      student = data;
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_code')
        .eq('roll_no', student.roll_no)
        .eq('status', 'completed');
      
      completedCourses = enrollments ? enrollments.map(e => e.course_code) : [];
    }
  }

  if (!student) {
    student = mockStudents.find(s => s.clerk_id === clerkId || s.email === email);
    if (student) {
      completedCourses = ['BSCS1001', 'BSMA1001']; // Default mock completed courses
    }
  }

  return { student, completedCourses };
}

// 1. Get recommendation history
router.get('/history', requireAuth, async (req, res) => {
  const clerkId = req.auth.userId;

  try {
    let roll_no = 'mock-roll-default';
    if (isDbReady) {
      const { data: student } = await supabase
        .from('students')
        .select('roll_no')
        .eq('clerk_id', clerkId)
        .maybeSingle();
      if (student) {
        roll_no = student.roll_no;
        const { data, error } = await supabase
          .from('recommendations')
          .select('*')
          .eq('roll_no', roll_no)
          .order('created_at', { ascending: false });
        if (!error) return res.json(data);
      }
    } else {
      const student = mockStudents.find(s => s.clerk_id === clerkId);
      if (student) roll_no = student.roll_no;
    }

    // Fallback Mock
    const history = mockRecommendations.filter(r => r.roll_no === roll_no);
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve recommendation history.' });
  }
});

// 2. Clear recommendation history
router.delete('/history', requireAuth, async (req, res) => {
  const clerkId = req.auth.userId;

  try {
    let roll_no = 'mock-roll-default';
    if (isDbReady) {
      const { data: student } = await supabase
        .from('students')
        .select('roll_no')
        .eq('clerk_id', clerkId)
        .maybeSingle();
      if (student) {
        roll_no = student.roll_no;
        const { error } = await supabase.from('recommendations').delete().eq('roll_no', roll_no);
        if (!error) return res.json({ success: true, message: 'Recommendation history cleared.' });
      }
    } else {
      const student = mockStudents.find(s => s.clerk_id === clerkId);
      if (student) roll_no = student.roll_no;
    }

    // Mock Delete
    const indices = [];
    mockRecommendations.forEach((r, idx) => {
      if (r.roll_no === roll_no) indices.push(idx);
    });
    // Remove in reverse order
    for (let i = indices.length - 1; i >= 0; i--) {
      mockRecommendations.splice(indices[i], 1);
    }
    res.json({ success: true, message: 'Recommendation history cleared.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to clear recommendation history.' });
  }
});

// 3. Get / Set recommendation limit settings (Admin only / General)
router.get('/settings/limit', requireAuth, async (req, res) => {
  try {
    if (isDbReady) {
      const { data, error } = await supabase.from('settings').select('*').eq('key', 'max_recommendation_limit').maybeSingle();
      if (!error && data) return res.json({ limit: parseInt(data.value) });
    }
    res.json({ limit: mockSettings.max_recommendation_limit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

router.post('/settings/limit', requireAuth, requireRole(['admin']), async (req, res) => {
  const { limit } = req.body;
  if (limit === undefined || isNaN(parseInt(limit))) {
    return res.status(400).json({ error: 'Limit must be a valid number.' });
  }

  try {
    if (isDbReady) {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'max_recommendation_limit', value: JSON.stringify(limit) });
      if (!error) return res.json({ success: true, limit: parseInt(limit) });
    }
    mockSettings.max_recommendation_limit = parseInt(limit);
    res.json({ success: true, limit: parseInt(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// 4. Generate recommendation
router.post('/generate', requireAuth, async (req, res) => {
  const clerkId = req.auth.userId;
  const email = req.auth.email;
  const { interests, goals, schedule, commitment, chosen_courses } = req.body; 
  // chosen_courses represents optional course(s) student has in mind (partial recommendations)

  try {
    // 1. Fetch student roll_no and profile
    const { student, completedCourses } = await getFullStudentData(clerkId, email);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found. Please setup profile first.' });
    }

    const roll_no = student.roll_no;

    // 2. Fetch limit
    let limit = mockSettings.max_recommendation_limit;
    if (isDbReady) {
      const { data } = await supabase.from('settings').select('*').eq('key', 'max_recommendation_limit').maybeSingle();
      if (data) limit = parseInt(data.value);
    }

    // 3. Fetch all courses in database to provide context to ChatGPT
    let allCourses = [];
    if (isDbReady) {
      const { data } = await supabase.from('courses').select('*');
      if (data) allCourses = data;
    }
    if (allCourses.length === 0) {
      allCourses = mockCourses;
    }

    // Prepare student profile details for recommendation
    const studentProfileStr = `
      Current Level: ${student.current_level || 'Foundation'}
      CGPA: ${student.cgpa || 'N/A'}
      Interests: ${interests ? interests.join(', ') : (student.interests || []).join(', ')}
      Career Goals: ${goals ? goals.join(', ') : (student.goals || []).join(', ')}
      Preferred Schedule: ${schedule || student.schedule || 'Flexible'}
      Weekly Availability: ${commitment || student.commitment || 12} hours
      Completed Courses: ${completedCourses.join(', ') || 'None'}
    `;

    const chosenCoursesStr = chosen_courses && chosen_courses.length > 0
      ? `The student has chosen to enroll in: ${chosen_courses.join(', ')}. Please recommend complementary courses to make a well-rounded schedule, up to the limit.`
      : `Provide course recommendations for the upcoming term.`;

    let recommendedCourses = [];

    // Check if we can use ChatGPT
    if (openai) {
      const systemPrompt = `
        You are an advanced academic advisor and course recommendation bot.
        Given a student's academic profile, goals, interests, schedule, weekly study commitment hours, completed courses, and a catalog of all offered courses, recommend the best courses for the student's next term.
        
        RULES:
        1. Only recommend courses from the provided catalog.
        2. Recommend no more than ${limit} courses.
        3. Respect course level progression (e.g. recommend Foundation level before Diploma, and Diploma before BSc, unless student profile justifies it).
        4. If the student has already selected one or more specific courses (provided in the prompt), consider them enrolled and recommend additional complementary courses that complement them.
        5. Return ONLY a valid JSON object in the following format, with no markdown tags, explanation text, or formatting.
        
        JSON FORMAT:
        {
          "recommendations": [
            {
              "course_code": "BSCS1002",
              "course_name": "Data Structures and Algorithms",
              "explanation": "Since you have completed Introduction to Programming (Python) and seek a career in Software Engineering, DSA is critical to build your core coding and problem-solving skills."
            }
          ]
        }
      `;

      const userPrompt = `
        --- Catalog of Offered Courses ---
        ${JSON.stringify(allCourses, null, 2)}
        
        --- Student Profile ---
        ${studentProfileStr}
        
        --- Specific Selection ---
        ${chosenCoursesStr}
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // default chatgpt model
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      });

      const parsedResponse = JSON.parse(response.choices[0].message.content);
      recommendedCourses = parsedResponse.recommendations || [];
    } else {
      // Mock Recommendation Algorithm (Rules-based)
      console.warn('[WARN] OpenAI key is unconfigured. Falling back to local rules-based recommender.');
      
      const availableCourses = allCourses.filter(c => !completedCourses.includes(c.course_code));
      
      // If student has chosen courses, let's include them, then fill up
      const chosenCodes = chosen_courses || [];
      const chosenCoursesObjs = allCourses.filter(c => chosenCodes.includes(c.course_code));

      const otherRecs = availableCourses.filter(c => !chosenCodes.includes(c.course_code));

      // Match interests to course names
      const matched = otherRecs.filter(c => {
        const query = c.course_name.toLowerCase();
        const interestsList = interests || student.interests || [];
        return interestsList.some(int => query.includes(int.toLowerCase()));
      });

      const pool = matched.length > 0 ? matched : otherRecs;
      
      // limit recommendations
      const countToRecommend = Math.min(limit - chosenCoursesObjs.length, pool.length);
      const items = pool.slice(0, countToRecommend);

      recommendedCourses = [
        ...chosenCoursesObjs.map(c => ({
          course_code: c.course_code,
          course_name: c.course_name,
          explanation: `Student selected course. Fits well with your current term goals.`
        })),
        ...items.map(c => ({
          course_code: c.course_code,
          course_name: c.course_name,
          explanation: `Recommended based on your interest matching "${c.course_name}" and your target commitment of ${commitment || student.commitment || 12} hours.`
        }))
      ].slice(0, limit);
    }

    // Save recommendation in database
    const recRecord = {
      roll_no,
      criteria: {
        interests: interests || student.interests || [],
        goals: goals || student.goals || [],
        schedule: schedule || student.schedule || 'Morning',
        commitment: commitment || student.commitment || 12,
        chosen_courses: chosen_courses || []
      },
      recommended_courses: recommendedCourses
    };

    if (isDbReady) {
      const { data, error } = await supabase.from('recommendations').insert([recRecord]).select();
      if (!error) return res.json(data[0]);
      console.error('[Supabase Error - Insert Recommendation]', error);
    }

    // Mock save
    const mockRecRecord = {
      id: `r-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      ...recRecord
    };
    mockRecommendations.unshift(mockRecRecord);
    res.json(mockRecRecord);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

export default router;
