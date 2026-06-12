import express from 'express';
import { supabase } from '../config/supabase.js';
import { SUPABASE_URL } from '../config/env.js';
import { mockCourses } from '../config/dbMock.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const isDbReady = SUPABASE_URL && !SUPABASE_URL.includes('placeholder');

// Helper to get active courses list
async function getCoursesList() {
  if (isDbReady) {
    const { data, error } = await supabase.from('courses').select('*');
    if (!error) return data;
    console.error('[Supabase Error - Fetch Courses]', error);
  }
  return mockCourses;
}

// 1. Get all courses
router.get('/', requireAuth, async (req, res) => {
  try {
    const courses = await getCoursesList();
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
});

// 2. Get course availability stats (Admin/POD)
router.get('/availability', requireAuth, requireRole(['admin', 'pod']), async (req, res) => {
  try {
    const courses = await getCoursesList();
    const stats = courses.map(c => ({
      course_code: c.course_code,
      course_name: c.course_name,
      capacity: c.capacity,
      available_seats: c.available_seats,
      enrolled_students: c.capacity - c.available_seats
    }));
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch course availability.' });
  }
});

// 3. Get single course details
router.get('/:course_code', requireAuth, async (req, res) => {
  const { course_code } = req.params;
  try {
    if (isDbReady) {
      const { data, error } = await supabase.from('courses').select('*').eq('course_code', course_code).single();
      if (!error && data) return res.json(data);
    }
    
    const course = mockCourses.find(c => c.course_code.toUpperCase() === course_code.toUpperCase());
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch course details.' });
  }
});

// 4. Create course (Admin only)
router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  const { course_code, course_name, level, capacity, available_seats, term } = req.body;
  if (!course_code || !course_name || !level || !term) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newCourse = {
    course_code,
    course_name,
    level,
    capacity: parseInt(capacity) || 50,
    available_seats: parseInt(available_seats !== undefined ? available_seats : capacity) || 50,
    term
  };

  try {
    if (isDbReady) {
      const { data, error } = await supabase.from('courses').insert([newCourse]).select();
      if (!error) return res.status(201).json(data[0]);
      console.error('[Supabase Error - Insert Course]', error);
    }

    // Fallback Mock write
    const exists = mockCourses.find(c => c.course_code === course_code);
    if (exists) {
      return res.status(400).json({ error: 'Course with this code already exists' });
    }
    mockCourses.push(newCourse);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add course.' });
  }
});

// 5. Update course (Admin only)
router.put('/:course_code', requireAuth, requireRole(['admin']), async (req, res) => {
  const { course_code } = req.params;
  const { course_name, level, capacity, available_seats, term } = req.body;

  try {
    if (isDbReady) {
      const { data, error } = await supabase
        .from('courses')
        .update({ course_name, level, capacity, available_seats, term })
        .eq('course_code', course_code)
        .select();
      if (!error && data?.length) return res.json(data[0]);
      console.error('[Supabase Error - Update Course]', error);
    }

    // Fallback Mock update
    const index = mockCourses.findIndex(c => c.course_code === course_code);
    if (index === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }
    mockCourses[index] = { ...mockCourses[index], course_name, level, capacity, available_seats, term };
    res.json(mockCourses[index]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

// 6. Delete course (Admin only)
router.delete('/:course_code', requireAuth, requireRole(['admin']), async (req, res) => {
  const { course_code } = req.params;

  try {
    if (isDbReady) {
      const { error } = await supabase.from('courses').delete().eq('course_code', course_code);
      if (!error) return res.json({ success: true, message: `Course ${course_code} deleted` });
      console.error('[Supabase Error - Delete Course]', error);
    }

    // Fallback Mock delete
    const index = mockCourses.findIndex(c => c.course_code === course_code);
    if (index === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }
    mockCourses.splice(index, 1);
    res.json({ success: true, message: `Course ${course_code} deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

export default router;
