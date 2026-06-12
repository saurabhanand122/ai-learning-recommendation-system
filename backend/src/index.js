import express from 'express';
import cors from 'cors';
import { PORT } from './config/env.js';

// Route Imports
import courseRouter from './routes/courses.js';
import studentRouter from './routes/students.js';
import feedbackRouter from './routes/feedback.js';
import recommendRouter from './routes/recommend.js';
import chatRouter from './routes/chat.js';
import importRouter from './routes/import.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow Next.js frontend or postman calls
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-mock-email', 'x-mock-name', 'x-mock-role', 'x-mock-user-id']
}));
app.use(express.json());

// Routes mapping
app.use('/api/courses', courseRouter);
app.use('/api/students', studentRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/recommendations', recommendRouter);
app.use('/api/chat', chatRouter);
app.use('/api/import', importRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Start listening if not running on Vercel Serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`🚀 Learning Path Recommender Server running on port ${PORT}`);
    console.log(`👉 Health check available at: http://localhost:${PORT}/api/health`);
    console.log(`========================================================`);
  });
}

export default app;
