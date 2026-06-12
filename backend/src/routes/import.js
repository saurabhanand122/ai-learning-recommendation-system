import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { supabase } from '../config/supabase.js';
import { SUPABASE_URL } from '../config/env.js';
import { mockEnrollments } from '../config/dbMock.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const isDbReady = SUPABASE_URL && !SUPABASE_URL.includes('placeholder');

router.post('/enrollments', requireAuth, requireRole(['admin']), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a CSV file.' });
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csvParser())
    .on('data', (data) => {
      // Clean up headers and trim whitespace
      const cleaned = {};
      Object.keys(data).forEach(key => {
        cleaned[key.trim().toLowerCase()] = data[key].trim();
      });
      results.push(cleaned);
    })
    .on('end', async () => {
      try {
        const recordsToInsert = [];
        const invalidRecords = [];

        results.forEach((row, index) => {
          const roll_no = row.roll_no || row.rollno || row.student_id;
          const course_code = row.course_code || row.coursecode || row.course;
          const term = row.term || 'Term 1';
          const grade = row.grade || 'S';
          const status = row.status || 'completed';

          if (!roll_no || !course_code) {
            invalidRecords.push({ index: index + 1, row, error: 'Missing roll_no or course_code' });
            return;
          }

          recordsToInsert.push({
            roll_no,
            course_code,
            term,
            grade,
            status
          });
        });

        if (recordsToInsert.length === 0) {
          return res.status(400).json({
            error: 'No valid records found in the CSV. Ensure columns like roll_no, course_code are present.'
          });
        }

        if (isDbReady) {
          const { error } = await supabase.from('enrollments').insert(recordsToInsert);
          if (error) {
            console.error('[Supabase Import Error]', error);
            return res.status(500).json({ error: 'Failed to write CSV records to database.', details: error.message });
          }
        } else {
          // Mock mode write
          recordsToInsert.forEach(rec => {
            mockEnrollments.push({
              id: `e-${Math.floor(1000 + Math.random() * 9000)}`,
              ...rec
            });
          });
        }

        res.json({
          success: true,
          message: `Successfully imported ${recordsToInsert.length} enrollment records.`,
          ignoredCount: invalidRecords.length,
          ignoredDetails: invalidRecords
        });

      } catch (err) {
        console.error('[IMPORT ERROR]', err);
        res.status(500).json({ error: 'Error processing imported data.' });
      }
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'Error reading CSV upload.' });
    });
});

export default router;
