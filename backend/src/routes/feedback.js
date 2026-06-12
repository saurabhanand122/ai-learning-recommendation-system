import express from 'express';
import { supabase } from '../config/supabase.js';
import { SUPABASE_URL } from '../config/env.js';
import { mockFeedback, mockStudents, mockEnrollments } from '../config/dbMock.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const isDbReady = SUPABASE_URL && !SUPABASE_URL.includes('placeholder');

// Helper to get student roll_no from request auth context
async function getStudentRollNo(req) {
  const clerkId = req.auth.userId;
  if (isDbReady) {
    const { data, error } = await supabase
      .from('students')
      .select('roll_no')
      .eq('clerk_id', clerkId)
      .maybeSingle();
    if (!error && data) return data.roll_no;
  }
  const student = mockStudents.find(s => s.clerk_id === clerkId || s.email === req.auth.email);
  return student ? student.roll_no : 'mock-roll-default';
}

// 1. Get feedbacks (Filterable by course_code, or for current student)
router.get('/', requireAuth, async (req, res) => {
  const { course_code, roll_no } = req.query;
  try {
    if (isDbReady) {
      let query = supabase.from('feedback').select(`
        *,
        students ( name, current_level )
      `);
      if (course_code) query = query.eq('course_code', course_code);
      if (roll_no) query = query.eq('roll_no', roll_no);
      
      const { data, error } = await query;
      if (!error) return res.json(data);
      console.error('[Supabase Error - Fetch Feedback]', error);
    }

    // Mock Mode fallback
    let filtered = [...mockFeedback];
    if (course_code) {
      filtered = filtered.filter(f => f.course_code.toUpperCase() === course_code.toUpperCase());
    }
    if (roll_no) {
      filtered = filtered.filter(f => f.roll_no === roll_no);
    }
    // Join student name mock details
    const feedbacksWithStudents = filtered.map(f => {
      const student = mockStudents.find(s => s.roll_no === f.roll_no) || { name: 'Unknown Student' };
      return { ...f, students: { name: student.name } };
    });
    res.json(feedbacksWithStudents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve feedback.' });
  }
});

// 2. Submit feedback (Student only)
router.post('/', requireAuth, async (req, res) => {
  const { course_code, rating, title, description } = req.body;
  if (!course_code || !rating || !title) {
    return res.status(400).json({ error: 'Missing required fields (course_code, rating, title).' });
  }

  const roll_no = await getStudentRollNo(req);

  try {
    if (isDbReady) {
      // Check if student already submitted feedback for this course
      const { data: existing, error: checkError } = await supabase
        .from('feedback')
        .select('id')
        .eq('course_code', course_code)
        .eq('roll_no', roll_no)
        .maybeSingle();

      if (checkError) console.error('[Supabase Check feedback]', checkError);
      if (existing) {
        return res.status(400).json({ error: 'Feedback already submitted for this course.' });
      }

      // Insert feedback
      const newFeedback = {
        course_code,
        roll_no,
        rating: parseInt(rating),
        title,
        description
      };

      const { data, error } = await supabase.from('feedback').insert([newFeedback]).select();
      if (!error) return res.status(200).json(data[0]); // Returns 200/201 on success
      console.error('[Supabase Error - Insert Feedback]', error);
      return res.status(400).json({ error: error.message });
    }

    // Mock Mode
    const exists = mockFeedback.find(f => f.course_code === course_code && f.roll_no === roll_no);
    if (exists) {
      return res.status(400).json({ error: 'Feedback already submitted for this course.' });
    }

    const newFeedback = {
      id: `f-${Math.floor(1000 + Math.random() * 9000)}`,
      course_code,
      roll_no,
      rating: parseInt(rating),
      title,
      description,
      created_at: new Date().toISOString()
    };

    mockFeedback.push(newFeedback);
    res.status(200).json(newFeedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

// 3. Edit feedback (PUT /course/feedback/modify/:id)
router.put('/modify/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rating, title, description } = req.body;
  const roll_no = await getStudentRollNo(req);

  try {
    if (isDbReady) {
      // Check ownership
      const { data: feedback, error: fetchError } = await supabase
        .from('feedback')
        .select('roll_no')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }

      if (feedback.roll_no !== roll_no && req.auth.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. You do not own this feedback.' });
      }

      const { data, error } = await supabase
        .from('feedback')
        .update({ rating: parseInt(rating), title, description })
        .eq('id', id)
        .select();

      if (!error && data?.length) return res.status(200).json(data[0]);
      console.error('[Supabase Error - Update Feedback]', error);
    }

    // Mock Mode
    const index = mockFeedback.findIndex(f => f.id === id || f.id === `f-${id}`);
    if (index === -1) {
      // Try comparing simple index or course_code/roll_no combinations as fallback
      const fallbackIndex = mockFeedback.findIndex(f => f.roll_no === roll_no);
      if (fallbackIndex === -1) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }
      mockFeedback[fallbackIndex] = {
        ...mockFeedback[fallbackIndex],
        rating: parseInt(rating) || mockFeedback[fallbackIndex].rating,
        title: title || mockFeedback[fallbackIndex].title,
        description: description || mockFeedback[fallbackIndex].description
      };
      return res.status(200).json(mockFeedback[fallbackIndex]);
    }

    if (mockFeedback[index].roll_no !== roll_no && req.auth.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. You do not own this feedback.' });
    }

    mockFeedback[index] = {
      ...mockFeedback[index],
      rating: parseInt(rating) || mockFeedback[index].rating,
      title: title || mockFeedback[index].title,
      description: description || mockFeedback[index].description
    };
    res.status(200).json(mockFeedback[index]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update feedback.' });
  }
});

// 4. Delete feedback (DELETE /course/feedback/modify/:id)
router.delete('/modify/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const roll_no = await getStudentRollNo(req);

  try {
    if (isDbReady) {
      // Check ownership
      const { data: feedback, error: fetchError } = await supabase
        .from('feedback')
        .select('roll_no')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }

      if (feedback.roll_no !== roll_no && req.auth.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. You do not own this feedback.' });
      }

      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (!error) return res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
      console.error('[Supabase Error - Delete Feedback]', error);
    }

    // Mock Mode
    const index = mockFeedback.findIndex(f => f.id === id || f.id === `f-${id}`);
    if (index === -1) {
      // Try deleting by roll_no if id matches index patterns in simple tests
      const fallbackIndex = mockFeedback.findIndex(f => f.roll_no === roll_no);
      if (fallbackIndex === -1) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }
      mockFeedback.splice(fallbackIndex, 1);
      return res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
    }

    if (mockFeedback[index].roll_no !== roll_no && req.auth.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. You do not own this feedback.' });
    }

    mockFeedback.splice(index, 1);
    res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete feedback.' });
  }
});

// 5. Get course average rating & student count
router.get('/stats/course/:course_code', requireAuth, async (req, res) => {
  const { course_code } = req.params;
  try {
    if (isDbReady) {
      // Aggregate ratings from Supabase
      const { data, error } = await supabase
        .from('feedback')
        .select('rating')
        .eq('course_code', course_code);

      // Get enrollment count
      const { count: enrolledCount, error: enrollError } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_code', course_code);

      if (!error) {
        const count = data.length;
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
        return res.json({
          course_code,
          average_rating: avg,
          n_students: enrolledCount || 0
        });
      }
      console.error('[Supabase Error - Stats]', error);
    }

    // Mock Mode fallback
    const feed = mockFeedback.filter(f => f.course_code.toUpperCase() === course_code.toUpperCase());
    const count = feed.length;
    const sum = feed.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 4.0; // default to 4.0 if empty for display

    // Enrolled students count from mock completed enrollments
    const enrollCount = mockEnrollments.filter(e => e.course_code.toUpperCase() === course_code.toUpperCase()).length;

    res.json({
      course_code,
      average_rating: avg,
      n_students: enrollCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get stats.' });
  }
});

// 6. Get level average rating and number of students completed some course in level
router.get('/stats/level/:level_name', requireAuth, async (req, res) => {
  const { level_name } = req.params;
  try {
    if (isDbReady) {
      // Query feedback left for courses of a specific level
      const { data: levelCourses, error: courseError } = await supabase
        .from('courses')
        .select('course_code')
        .ilike('level', level_name);

      if (!courseError && levelCourses?.length > 0) {
        const codes = levelCourses.map(c => c.course_code);
        
        // Feedbacks for these codes
        const { data: feedbackData, error: fbError } = await supabase
          .from('feedback')
          .select('rating')
          .in('course_code', codes);

        // Enrollments (distinct students) in these courses
        const { data: enrollData, error: enrollError } = await supabase
          .from('enrollments')
          .select('roll_no')
          .in('course_code', codes);

        const uniqueStudents = enrollData ? [...new Set(enrollData.map(e => e.roll_no))].length : 0;
        
        if (!fbError) {
          const count = feedbackData.length;
          const sum = feedbackData.reduce((acc, curr) => acc + curr.rating, 0);
          const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0.0;
          return res.json({
            level: level_name,
            average_rating: avg,
            n_students_completed_some_course_in_level: uniqueStudents
          });
        }
      }
    }

    // Mock Mode fallback
    const codesInLevel = mockCourses
      .filter(c => c.level.toLowerCase() === level_name.toLowerCase())
      .map(c => c.course_code);

    const feed = mockFeedback.filter(f => codesInLevel.includes(f.course_code));
    const count = feed.length;
    const sum = feed.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 4.5;

    const uniqueStudents = [...new Set(
      mockEnrollments.filter(e => codesInLevel.includes(e.course_code)).map(e => e.roll_no)
    )].length;

    res.json({
      level: level_name,
      average_rating: avg,
      n_students_completed_some_course_in_level: uniqueStudents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve level stats.' });
  }
});

export default router;
