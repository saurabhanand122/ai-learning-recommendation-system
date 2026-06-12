# Learning Path Recommendation System

An AI-driven course advisory and personalized curriculum recommendation system built with modern technology stacks. It replaces the legacy Vue/Django codebase with a streamlined, full-stack Javascript architecture.

## 🚀 Tech Stack
- **Frontend**: [Next.js](https://nextjs.org/) (App Router) styled with **Vanilla CSS Modules** (no Tailwind, using responsive glassmorphism & dark-mode styling).
- **Backend**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) API.
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL).
- **Authentication**: [Clerk](https://clerk.com/).
- **AI Integrations**:
  - **Voice Assistant**: [Vapi](https://vapi.ai/) Web SDK (with browser speech synthesis mock fallback).
  - **Recommender Engine**: [OpenAI ChatGPT API](https://openai.com/) (with rules-based local mock fallback).
  - **Chatbot Advisor**: [Google Gemini API](https://ai.google.dev/) (with keyword-based local mock fallback).

---

## 📁 Project Structure

```
ai - learning - recommendation- system/
├── backend/                  # Node.js + Express API Server
│   ├── src/
│   │   ├── config/           # Database adapters, environmental controls
│   │   ├── middleware/       # Clerk session JWT verification
│   │   ├── routes/           # REST endpoints (courses, feedback, recommend, Gemini chat)
│   │   └── index.js          # Entrypoint server script
│   ├── .env                  # Configuration variables
│   ├── seed.sql              # Database initialization statements
│   └── package.json
├── frontend/                 # Next.js client portal
│   ├── src/
│   │   ├── app/              # Next.js App Router folders
│   │   ├── components/       # Shared Sidebar, VapiButton, GeminiChat
│   │   ├── context/          # Clerk + local mock authentication context
│   │   └── styles/           # CSS modules (Home, Dashboard, Sidebar, etc.)
│   ├── .env.local            # Frontend variables
│   └── package.json
└── README.md
```

---

## ⚙️ Local Development Setup

The application features a **Dual-Mode execution design**. If you do not have Clerk, Supabase, Vapi, OpenAI, or Gemini credentials ready, **the system automatically triggers Mock Fallbacks**. You can run, test, and explore all dashboards, chatbot queries, voice conversations, CSV imports, and CRUD tables out-of-the-box!

### 1. Database Setup (Supabase)
To use real database storage instead of mock memory lists:
1. Create a project on [Supabase](https://supabase.com/).
2. Open the **SQL Editor** tab in your Supabase dashboard.
3. Copy the contents of `backend/seed.sql` and click **Run**.
4. Retrieve your Supabase URL and Anon Key from your settings.

### 2. Run the Backend Server
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Configure environmental variables in `.env`:
   - Fill in your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
   - Fill in your `CLERK_SECRET_KEY` (if using Clerk).
   - Fill in your `OPENAI_API_KEY` (for ChatGPT recommendations).
   - Fill in your `GEMINI_API_KEY` (for the Gemini advisor chatbot).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server in hot-reload development mode:
   ```bash
   npm run dev
   ```
   The backend will start listening on [http://localhost:5000](http://localhost:5000).

### 3. Run the Frontend App
1. Navigate to the `frontend/` folder:
   ```bash
   cd ../frontend
   ```
2. Ensure `.env.local` points to the backend server:
   - `NEXT_PUBLIC_API_URL=http://localhost:5000`
   - Include `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (if using Clerk authentication).
3. Install client-side packages:
   ```bash
   npm install
   ```
4. Spin up the Next.js development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 👥 Portals & Features Demo Guide
If you are running in Mock Mode (which is default on fresh checkout):
- **Role Switcher**: You will see a dropdown in the Sidebar and Landing Page. Switch between **Student**, **Admin**, and **POD Coordinator** roles instantly!
- **Student Dashboard**: Trigger the **Vapi Voice Advisor** using the simulated mic controls, or chat with **Advisobot** (Gemini chatbot).
- **Get Recommendations**: Fill out interests and select a course to check the **partial recommendations** feature.
- **Admin Management**: View course capacity utilization alerts, perform CRUD operations on student profiles, or upload CSV logs in the uploader page.
- **POD Portal**: Inspect Recharts resource-demand diagrams and audit student reviews in the repository.
