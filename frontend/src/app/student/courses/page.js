'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { MessageSquare, Star, Award, BookOpen, AlertCircle, Plus, Trash2, Edit } from 'lucide-react';
import styles from '@/styles/Courses.module.css';

export default function CoursesPage() {
  const { token, user } = useSessionAuth();
  
  // Data States
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [userFeedback, setUserFeedback] = useState(null); // Feedback left by current user if any

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setCourses(data);
          if (data.length > 0) {
            handleSelectCourse(data[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (token) {
      loadCourses();
    }
  }, [token]);

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setFormError('');
    setIsEditing(false);
    
    // Reset form
    setRating(5);
    setTitle('');
    setDescription('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // 1. Fetch course stats (average rating)
      const statsRes = await fetch(`${backendUrl}/api/feedback/stats/course/${course.course_code}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setCourseStats(statsData);
      }

      // 2. Fetch feedbacks list for this course
      const fbRes = await fetch(`${backendUrl}/api/feedback?course_code=${course.course_code}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fbData = await fbRes.json();
      if (fbRes.ok) {
        setFeedbacks(fbData);
        
        // Check if current user has already submitted feedback
        const found = fbData.find(f => f.students?.email === user?.email || f.roll_no === user?.id);
        if (found) {
          setUserFeedback(found);
          // Pre-populate form for editing
          setRating(found.rating);
          setTitle(found.title);
          setDescription(found.description);
        } else {
          setUserFeedback(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      course_code: selectedCourse.course_code,
      rating: parseInt(rating),
      title,
      description
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const url = isEditing && userFeedback 
        ? `${backendUrl}/api/feedback/modify/${userFeedback.id}`
        : `${backendUrl}/api/feedback`;
        
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh course view
        handleSelectCourse(selectedCourse);
      } else {
        setFormError(data.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network error submitting feedback.');
    }
  };

  const handleDeleteFeedback = async () => {
    if (!userFeedback || !confirm('Are you sure you want to delete your feedback?')) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/feedback/modify/${userFeedback.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        handleSelectCourse(selectedCourse);
      } else {
        alert('Failed to delete feedback.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>Student Portal / Courses & Feedback</span>
            <h1 className={styles.title}>Courses <span className="gradient-text">& Feedback</span></h1>
            <p className={styles.subtitle}>Browse standard courses offered and view or submit student feedback ratings.</p>
          </div>
        </header>

        <div className={styles.workspace}>
          {/* Left Course Catalog Panel */}
          <div className={`${styles.catalogPanel} glass-panel`}>
            <span className={styles.panelHeader}>Course Catalog</span>
            <div className={styles.catalogList}>
              {courses.map((c) => {
                const isSelected = selectedCourse?.course_code === c.course_code;
                return (
                  <div 
                    key={c.course_code}
                    onClick={() => handleSelectCourse(c)}
                    className={`${styles.courseItem} ${isSelected ? styles.itemActive : ''}`}
                  >
                    <BookOpen size={16} className={styles.courseIcon} />
                    <div className={styles.courseItemText}>
                      <span className={styles.courseItemCode}>{c.course_code}</span>
                      <span className={styles.courseItemName}>{c.course_name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Details, Feedbacks & Form Panel */}
          {selectedCourse && (
            <div className={`${styles.detailsPanel} glass-panel`}>
              <div className={styles.detailsHeader}>
                <div>
                  <span className={styles.courseTag}>{selectedCourse.level}</span>
                  <h2>{selectedCourse.course_name}</h2>
                  <span className={styles.courseCodeLabel}>{selectedCourse.course_code} • {selectedCourse.term}</span>
                </div>
                
                {/* Visual stats indicators */}
                {courseStats && (
                  <div className={styles.statsSummary}>
                    <div className={styles.statBox}>
                      <div className={styles.statLabel}>Avg Rating</div>
                      <div className={styles.ratingVal}>
                        <Star size={16} className={styles.starIcon} />
                        <span>{courseStats.average_rating ? courseStats.average_rating.toFixed(1) : '0.0'}</span>
                      </div>
                    </div>
                    <div className={styles.statBox}>
                      <div className={styles.statLabel}>Enrolled</div>
                      <div className={styles.enrolledVal}>{courseStats.n_students || 0}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feedbacks reviews List */}
              <div className={styles.feedbackSection}>
                <h3>Student Reviews ({feedbacks.length})</h3>
                <div className={styles.reviewsList}>
                  {feedbacks.map((f) => (
                    <div key={f.id} className={`${styles.reviewCard} glass-card`}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewerInfo}>
                          <span className={styles.reviewerAvatar}>{f.students?.name?.charAt(0) || 'S'}</span>
                          <div>
                            <h5>{f.students?.name || 'Anonymous Student'}</h5>
                            <span className={styles.reviewDate}>{new Date(f.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className={styles.reviewRating}>
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < f.rating ? styles.starFilled : styles.starEmpty} 
                            />
                          ))}
                        </div>
                      </div>
                      <h4 className={styles.reviewTitle}>{f.title}</h4>
                      <p className={styles.reviewDesc}>{f.description}</p>
                    </div>
                  ))}
                  {feedbacks.length === 0 && (
                    <p className={styles.noReviews}>No reviews submitted for this course yet.</p>
                  )}
                </div>
              </div>

              {/* Submit Feedback Form / Review Owner Details */}
              <div className={styles.submitSection}>
                {userFeedback && !isEditing ? (
                  /* Shows details of submitted feedback + option to edit/delete */
                  <div className={`${styles.userFeedbackSummary} glass-card`}>
                    <div className={styles.summaryTitleRow}>
                      <h4>Your Submitted Feedback</h4>
                      <div className={styles.summaryActions}>
                        <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                          <Edit size={14} /> Edit
                        </button>
                        <button onClick={handleDeleteFeedback} className={styles.deleteBtn}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                    <div className={styles.userRatingRow}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < userFeedback.rating ? styles.starFilled : styles.starEmpty} 
                        />
                      ))}
                      <span className={styles.userFeedbackTitle}><b>{userFeedback.title}</b></span>
                    </div>
                    <p className={styles.userFeedbackText}>{userFeedback.description}</p>
                  </div>
                ) : (
                  /* Form to Add or Edit review */
                  <form onSubmit={handleSubmitFeedback} className={styles.feedbackForm}>
                    <h3>{isEditing ? 'Modify Your Feedback' : 'Submit Subject Feedback'}</h3>
                    {formError && (
                      <div className={styles.errorAlert}>
                        <AlertCircle size={16} />
                        <span>{formError}</span>
                      </div>
                    )}
                    
                    <div className={styles.formRow}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label font-bold">Rating (1 to 5 Stars)</label>
                        <div className={styles.starsSelector}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={star <= rating ? styles.starSelectActive : styles.starSelectInactive}
                            >
                              <Star size={24} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="form-label">Review Headline</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Challenging syllabus but excellent lecturer"
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Review Comments</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write details about your experience, workload, and tips..."
                        rows={3}
                        required
                        className="form-textarea"
                      />
                    </div>

                    <div className={styles.formActions}>
                      {isEditing && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditing(false);
                            setFormError('');
                          }} 
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                      <button type="submit" className="btn-primary">
                        {isEditing ? 'Save Changes' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
