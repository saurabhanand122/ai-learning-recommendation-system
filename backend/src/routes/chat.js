import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { mockCourses } from '../config/dbMock.js';

const router = express.Router();

let ai = null;
if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('placeholder')) {
  try {
    ai = new GoogleGenerativeAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.error('Failed to initialize Google GenerativeAI SDK:', err);
  }
}

router.post('/', requireAuth, async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    if (ai) {
      // Structure prompt with course catalog context for Gemini
      const systemContext = `
        You are "Advisobot", an AI academic advisor for the Learning Path Recommendation System.
        Here is the catalog of courses currently offered:
        ${JSON.stringify(mockCourses, null, 2)}
        
        Answer student questions about courses, level progression (Foundation -> Diploma -> BSc), workload, prerequisites, and careers. Keep your answers supportive, concise, and structured.
      `;

      // Map history to Gemini API format if provided
      // history looks like: [{ sender: 'user', text: 'hi' }, { sender: 'bot', text: 'hello' }]
      const contents = [];
      if (history && history.length > 0) {
        history.forEach(h => {
          contents.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }
      
      // Append current message
      contents.push({
        role: 'user',
        parts: [{ text: `${systemContext}\n\nStudent: ${message}` }]
      });

      // Call Gemini 2.5 Flash / 1.5 Flash (the SDK uses gemini-2.5-flash or gemini-1.5-flash)
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: contents,
      });

      const replyText = response.text || 'I am sorry, I could not generate a response.';
      return res.json({ text: replyText });
    }

    // Mock Response Fallback
    console.warn('[WARN] Gemini API key is unconfigured. Replying with mock academic advisor response.');
    
    // Simple regex matching to make the mock bot feel responsive
    const msgLower = message.toLowerCase();
    let reply = "Hello! I am your AI academic advisor. Since the Gemini API key is not yet set in the `.env` file, I am running in demo mode. How can I help you today?";
    
    if (msgLower.includes('math') || msgLower.includes('mathematics')) {
      reply = "We offer Mathematics I (Term 1) and Mathematics II (Term 2) at the Foundation level. Math II requires Math I knowledge!";
    } else if (msgLower.includes('ai') || msgLower.includes('machine learning') || msgLower.includes('ml')) {
      reply = "Artificial Intelligence & Machine Learning (BSAI3002) is offered at the BSc level in Term 2. It is highly recommended to complete Mathematics II and Python programming first.";
    } else if (msgLower.includes('python') || msgLower.includes('programming')) {
      reply = "Introduction to Programming (BSCS1001) uses Python and is available in Term 1 at the Foundation level. It has no prerequisites!";
    } else if (msgLower.includes('recommend') || msgLower.includes('courses') || msgLower.includes('path')) {
      reply = "You can use the 'Get Recommendations' tab in the sidebar to generate a custom roadmap based on your interests, schedule, and study hour limits!";
    } else if (msgLower.includes('diploma')) {
      reply = "At the Diploma level, we offer Database Management Systems (BSCS2001) in Term 1 and Web Application Development (BSCS2002) in Term 2.";
    }

    res.json({ text: reply });

  } catch (error) {
    console.error('[GEMINI ERROR]', error);
    res.status(500).json({ error: 'Failed to communicate with the AI bot.' });
  }
});

export default router;
