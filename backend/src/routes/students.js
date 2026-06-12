import express from 'express';
import { supabase } from '../config/supabase.js';
import { SUPABASE_URL } from '../config/env.js';
import { mockStudents } from '../config/dbMock.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const isDbReady = SUPABASE_URL && !SUPABASE_URL.includes('placeholder');

// Helper to get all students
async function getStudentsList() {
  if (isDbReady) {
    const { data, error } = await supabase.from('students').select('*');
    if (!error) return data;
    console.error('[Supabase Error - Fetch Students]', error);
  }
  return mockStudents;
}

// 1. Get all students (Admin only)
router.get('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const students = await getStudentsList();
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve students.' });
  }
});

// 2. Get active logged in user's student profile (/me)
router.get('/me', requireAuth, async (req, res) => {
  const clerkId = req.auth.userId;
  const email = req.auth.email;
  const name = req.auth.name;

  try {
    if (isDbReady) {
      // Try fetching student by clerk_id
      let { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('clerk_id', clerkId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase Error - Fetch Student me]', error);
      }

      if (!student) {
        // If not found, let's create a default profile on the fly!
        const roll_no = `roll-${Math.floor(1000 + Math.random() * 9000)}`;
        const defaultProfile = {
          roll_no,
          clerk_id: clerkId,
          name: name || 'Student User',
          email: email || '',
          interests: [],
          goals: [],
          schedule: 'Morning',
          commitment: 12,
          cgpa: 8.0,
          current_level: 'Foundation'
        };

        const { data: createdStudent, error: createError } = await supabase
          .from('students')
          .insert([defaultProfile])
          .select()
          .single();

        if (createError) {
          console.error('[Supabase Error - Auto-create Student]', createError);
        } else {
          student = createdStudent;
        }
      }

      if (student) {
        return res.json(student);
      }
    }

    // Mock mode implementation
    let student = mockStudents.find(s => s.clerk_id === clerkId || s.email === email);
    if (!student) {
      // Auto-create in mock list
      student = {
        roll_no: `mock-roll-${Math.floor(1000 + Math.random() * 9000)}`,
        clerk_id: clerkId,
        name: name || 'Mock Student',
        email: email || 'student@example.com',
        interests: ['Web Development', 'Algorithms'],
        goals: ['Frontend Engineer'],
        schedule: 'Morning',
        commitment: 15,
        cgpa: 8.2,
        current_level: 'Foundation'
      };
      mockStudents.push(student);
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch your student profile.' });
  }
});

// 3. Get student by roll_no (Admin/POD)
router.get('/:roll_no', requireAuth, requireRole(['admin', 'pod']), async (req, res) => {
  const { roll_no } = req.params;
  try {
    if (isDbReady) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('roll_no', roll_no)
        .maybeSingle();
      if (!error && data) return res.json(data);
    }

    const student = mockStudents.find(s => s.roll_no === roll_no);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student details.' });
  }
});

// 4. Create student profile manually (Admin or system)
router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  const { roll_no, name, email, interests, goals, schedule, commitment, cgpa, current_level } = req.body;
  if (!roll_no || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields (roll_no, name, email).' });
  }

  const profile = {
    roll_no,
    name,
    email,
    interests: interests || [],
    goals: goals || [],
    schedule: schedule || 'Morning',
    commitment: parseInt(commitment) || 12,
    cgpa: parseFloat(cgpa) || 7.0,
    current_level: current_level || 'Foundation'
  };

  try {
    if (isDbReady) {
      const { data, error } = await supabase.from('students').insert([profile]).select();
      if (!error) return res.status(201).json(data[0]);
      console.error('[Supabase Error - Insert Student]', error);
    }

    // Mock Mode
    const exists = mockStudents.find(s => s.roll_no === roll_no);
    if (exists) {
      return res.status(400).json({ error: 'Student with this roll number already exists.' });
    }
    mockStudents.push(profile);
    res.status(201).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create student profile.' });
  }
});

// 5. Update student profile (Self or Admin)
router.put('/:roll_no', requireAuth, async (req, res) => {
  const { roll_no } = req.params;
  const { name, interests, goals, schedule, commitment, cgpa, current_level } = req.body;

  // Security check: Students can only update their own profile
  if (req.auth.role !== 'admin') {
    // If not admin, check if this roll_no corresponds to their clerk_id
    if (isDbReady) {
      const { data, error } = await supabase
        .from('students')
        .select('clerk_id')
        .eq('roll_no', roll_no)
        .single();
      if (error || !data || data.clerk_id !== req.auth.userId) {
        return res.status(403).json({ error: 'Forbidden. You can only update your own profile.' });
      }
    } else {
      const student = mockStudents.find(s => s.roll_no === roll_no);
      if (!student || student.clerk_id !== req.auth.userId) {
        return res.status(403).json({ error: 'Forbidden. You can only update your own profile.' });
      }
    }
  }

  const updates = { name, interests, goals, schedule, commitment, cgpa, current_level };

  try {
    if (isDbReady) {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('roll_no', roll_no)
        .select();
      if (!error && data?.length) return res.json(data[0]);
      console.error('[Supabase Error - Update Student]', error);
    }

    // Mock Mode
    const index = mockStudents.findIndex(s => s.roll_no === roll_no);
    if (index === -1) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    mockStudents[index] = { ...mockStudents[index], ...updates };
    res.json(mockStudents[index]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update student profile.' });
  }
});

// 6. Delete student profile (Admin only)
router.delete('/:roll_no', requireAuth, requireRole(['admin']), async (req, res) => {
  const { roll_no } = req.params;

  try {
    if (isDbReady) {
      const { error } = await supabase.from('students').delete().eq('roll_no', roll_no);
      if (!error) return res.json({ success: true, message: `Student profile ${roll_no} deleted` });
      console.error('[Supabase Error - Delete Student]', error);
    }

    // Mock Mode
    const index = mockStudents.findIndex(s => s.roll_no === roll_no);
    if (index === -1) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    mockStudents.splice(index, 1);
    res.json({ success: true, message: `Student profile ${roll_no} deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete student.' });
  }
});

export default router;
