'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { Sparkles, Calendar, BookOpen, Lightbulb, Clock, Plus, Trash, ArrowRight, BrainCircuit } from 'lucide-react';
import styles from '@/styles/Recommend.module.css';

export default function RecommendPage() {
  const { token } = useSessionAuth();
  
  // Form State
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState([]);
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState([]);
  const [schedule, setSchedule] = useState('Morning');
  const [commitment, setCommitment] = useState(12);
  const [chosenCourses, setChosenCourses] = useState([]);
  
  // Meta data states
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recommendationResult, setRecommendationResult] = useState(null);

  // Load Course list for partial recommendations
  useEffect(() => {
    async function loadCourses() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
        const res = await fetch(`${backendUrl}/api/courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setCourses(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    // Auto load student profile properties to pre-fill the form
    async function loadProfile() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
        const res = await fetch(`${backendUrl}/api/students/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setInterests(data.interests || []);
          setGoals(data.goals || []);
          setSchedule(data.schedule || 'Morning');
          setCommitment(data.commitment || 12);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (token) {
      loadCourses();
      loadProfile();
    }
  }, [token]);

  // Loading indicator helper
  useEffect(() => {
    let interval = null;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const removeInterest = (index) => {
    setInterests(interests.filter((_, idx) => idx !== index));
  };

  const addGoal = () => {
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  const removeGoal = (index) => {
    setGoals(goals.filter((_, idx) => idx !== index));
  };

  const toggleCourseChoice = (courseCode) => {
    if (chosenCourses.includes(courseCode)) {
      setChosenCourses(chosenCourses.filter(code => code !== courseCode));
    } else {
      setChosenCourses([...chosenCourses, courseCode]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRecommendationResult(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
      const response = await fetch(`${backendUrl}/api/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          interests,
          goals,
          schedule,
          commitment: parseInt(commitment),
          chosen_courses: chosenCourses
        })
      });
      const data = await response.json();
      if (response.ok) {
        setRecommendationResult(data);
      } else {
        alert(data.error || 'Failed to generate recommendations');
      }
    } catch (err) {
      console.error(err);
      alert('Network error generating recommendation.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLoadingMessage = () => {
    const messages = [
      "Analyzing student profile & Completed courses...",
      "Reading course catalogs & Checking prerequisites...",
      "Connecting to ChatGPT Recommendation Engine...",
      "Synthesizing your personalized study path..."
    ];
    return messages[loadingStep];
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>Student Portal / Get Recommendation</span>
            <h1 className={styles.title}>Generate <span className="gradient-text">Academic Roadmap</span></h1>
            <p className={styles.subtitle}>Specify your interests, career targets, and study load to fetch custom course paths.</p>
          </div>
        </header>

        {isLoading ? (
          /* Loading Animation Block */
          <div className={`${styles.loadingBox} glass-card`}>
            <BrainCircuit className={styles.loadingIcon} />
            <h3>Generating Roadmaps</h3>
            <p>{getLoadingMessage()}</p>
            <div className={styles.loadingBarContainer}>
              <div className={styles.loadingBar} style={{ width: `${(loadingStep + 1) * 25}%` }}></div>
            </div>
          </div>
        ) : recommendationResult ? (
          /* Results Display Block */
          <div className={styles.resultsContainer}>
            <div className={`${styles.resultsHeader} glass-card`}>
              <div>
                <h2>Your Recommended Study Path</h2>
                <p>Generated on {new Date(recommendationResult.created_at).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => window.print()} className="btn-primary">
                  Download PDF
                </button>
                <button onClick={() => setRecommendationResult(null)} className="btn-secondary">
                  Generate New
                </button>
              </div>
            </div>

            <div className={styles.resultsGrid}>
              <div className={styles.recsCol}>
                <h3 className={styles.colHeader}><Sparkles size={16} /> Recommended Subjects</h3>
                <div className={styles.recsList}>
                  {recommendationResult.recommended_courses.map((rec, idx) => (
                    <div key={idx} className={`${styles.recCard} glass-card`}>
                      <div className={styles.recSubject}>
                        <span className={styles.recNumber}>{idx + 1}</span>
                        <div>
                          <h4>{rec.course_name}</h4>
                          <span className={styles.subjectCode}>{rec.course_code}</span>
                        </div>
                      </div>
                      <p className={styles.recExplanation}>{rec.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.criteriaCol}>
                <div className="glass-card">
                  <h3>Generation Criteria</h3>
                  <div className={styles.criteriaGroup}>
                    <h5>Interests</h5>
                    <div className={styles.tags}>
                      {recommendationResult.criteria.interests.map((int, i) => (
                        <span key={i} className={styles.tag}>{int}</span>
                      ))}
                      {recommendationResult.criteria.interests.length === 0 && <span className={styles.noTags}>None set</span>}
                    </div>
                  </div>

                  <div className={styles.criteriaGroup}>
                    <h5>Career Targets</h5>
                    <div className={styles.tags}>
                      {recommendationResult.criteria.goals.map((g, i) => (
                        <span key={i} className={styles.tag}>{g}</span>
                      ))}
                      {recommendationResult.criteria.goals.length === 0 && <span className={styles.noTags}>None set</span>}
                    </div>
                  </div>

                  <div className={styles.criteriaGroup}>
                    <h5>Preferences</h5>
                    <p className={styles.critVal}>Schedule: <b>{recommendationResult.criteria.schedule}</b></p>
                    <p className={styles.critVal}>Study hours: <b>{recommendationResult.criteria.commitment} hrs/wk</b></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Recommendation Input Form */
          <form onSubmit={handleGenerate} className={styles.formGrid}>
            <div className={`${styles.inputsCard} glass-panel`}>
              {/* Interests Inputs */}
              <div className="form-group">
                <label className="form-label">Academic / Tech Interests</label>
                <div className={styles.inputBtnGroup}>
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="e.g. Artificial Intelligence, Web Development"
                    className="form-input"
                  />
                  <button type="button" onClick={addInterest} className={styles.addBtn}>
                    <Plus size={16} />
                  </button>
                </div>
                <div className={styles.tagsContainer}>
                  {interests.map((int, idx) => (
                    <span key={idx} className={styles.tagItem}>
                      {int}
                      <button type="button" onClick={() => removeInterest(idx)} className={styles.tagRemove}>
                        <Trash size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Goals Inputs */}
              <div className="form-group">
                <label className="form-label">Target Roles / Career Goals</label>
                <div className={styles.inputBtnGroup}>
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="e.g. Software Engineer, Data Scientist"
                    className="form-input"
                  />
                  <button type="button" onClick={addGoal} className={styles.addBtn}>
                    <Plus size={16} />
                  </button>
                </div>
                <div className={styles.tagsContainer}>
                  {goals.map((g, idx) => (
                    <span key={idx} className={styles.tagItem}>
                      {g}
                      <button type="button" onClick={() => removeGoal(idx)} className={styles.tagRemove}>
                        <Trash size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Schedule and Commitment */}
              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preferred Schedule</label>
                  <select 
                    value={schedule} 
                    onChange={(e) => setSchedule(e.target.value)}
                    className="form-select"
                  >
                    <option value="Morning">Morning Classes</option>
                    <option value="Evening">Evening Classes</option>
                    <option value="Flexible">Flexible/Online</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Weekly Hours Availability</label>
                  <input
                    type="number"
                    value={commitment}
                    onChange={(e) => setCommitment(e.target.value)}
                    min={4}
                    max={40}
                    className="form-input"
                  />
                </div>
              </div>

              <button type="submit" className={`${styles.submitBtn} btn-primary`}>
                Generate Course Recommendations <ArrowRight size={18} />
              </button>
            </div>

            {/* Partial recommendation course checklist */}
            <div className={`${styles.coursesCard} glass-panel`}>
              <div className={styles.cardHeader}>
                <BookOpen size={20} className={styles.cardHeaderIcon} />
                <div>
                  <h3>Partial Enrollments</h3>
                  <p>Already got a course in mind? Select it and we will recommend complementary courses around it!</p>
                </div>
              </div>
              
              <div className={styles.coursesChecklist}>
                {courses.map((course) => {
                  const isChecked = chosenCourses.includes(course.course_code);
                  return (
                    <div 
                      key={course.course_code}
                      onClick={() => toggleCourseChoice(course.course_code)}
                      className={`${styles.checkRow} ${isChecked ? styles.rowChecked : ''}`}
                    >
                      <div className={styles.checkbox}>
                        {isChecked && <div className={styles.checkboxInner} />}
                      </div>
                      <div className={styles.checkText}>
                        <span className={styles.courseCode}>{course.course_code}</span>
                        <span className={styles.courseName}>{course.course_name}</span>
                        <span className={styles.courseLevel}>{course.level}</span>
                      </div>
                    </div>
                  );
                })}
                {courses.length === 0 && (
                  <p className={styles.emptyCourses}>No courses currently offered.</p>
                )}
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
