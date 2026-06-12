'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { Star, MessageSquareCode, Search, HelpCircle, ArrowUpDown } from 'lucide-react';
import styles from '@/styles/FeedbackRepo.module.css';

export default function PodFeedbackRepository() {
  const { token } = useSessionAuth();
  
  // Data States
  const [feedbacks, setFeedbacks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'highest', 'lowest'

  useEffect(() => {
    async function loadData() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // 1. Fetch all feedback
        const fbRes = await fetch(`${backendUrl}/api/feedback`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fbData = await fbRes.json();
        if (fbRes.ok) {
          setFeedbacks(fbData);
        }

        // 2. Fetch courses list
        const courseRes = await fetch(`${backendUrl}/api/courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const courseData = await courseRes.json();
        if (courseRes.ok) {
          setCourses(courseData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (token) {
      loadData();
    }
  }, [token]);

  // Apply filters
  let filteredFeedbacks = [...feedbacks];

  if (selectedCourse !== 'ALL') {
    filteredFeedbacks = filteredFeedbacks.filter(f => f.course_code === selectedCourse);
  }

  if (searchTerm.trim() !== '') {
    const term = searchTerm.toLowerCase();
    filteredFeedbacks = filteredFeedbacks.filter(f => 
      f.title.toLowerCase().includes(term) ||
      f.description.toLowerCase().includes(term) ||
      f.roll_no.toLowerCase().includes(term) ||
      (f.students?.name && f.students.name.toLowerCase().includes(term))
    );
  }

  // Apply sorting
  filteredFeedbacks.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === 'highest') {
      return b.rating - a.rating;
    }
    if (sortBy === 'lowest') {
      return a.rating - b.rating;
    }
    return 0;
  });

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>POD Coordinator / Feedback Repository</span>
            <h1 className={styles.title}>Student <span className="gradient-text">Feedback</span></h1>
            <p className={styles.subtitle}>Audit course quality index ratings and read student experience logs.</p>
          </div>
        </header>

        {/* Filter Controls Bar */}
        <div className={`${styles.filterBar} glass-card`}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by student, roll no, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.selectsWrapper}>
            {/* Filter by course */}
            <div className={styles.selectGroup}>
              <span className={styles.selectLabel}>Filter Course:</span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className={styles.selectInput}
              >
                <option value="ALL">All Subjects</option>
                {courses.map(c => (
                  <option key={c.course_code} value={c.course_code}>{c.course_code} - {c.course_name}</option>
                ))}
              </select>
            </div>

            {/* Sort by */}
            <div className={styles.selectGroup}>
              <span className={styles.selectLabel}>Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.selectInput}
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Loading Feedback Logs...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className={`${styles.emptyCard} glass-card`}>
            <HelpCircle size={48} className={styles.emptyIcon} />
            <h3>No Feedbacks Found</h3>
            <p>No student review entries match the selected filter query criteria.</p>
          </div>
        ) : (
          <div className={styles.feedbackGrid}>
            {filteredFeedbacks.map((f) => (
              <div key={f.id} className={`${styles.feedbackCard} glass-card`}>
                <div className={styles.cardHeader}>
                  <div className={styles.reviewerArea}>
                    <span className={styles.avatar}>{f.students?.name?.charAt(0) || 'S'}</span>
                    <div>
                      <h4>{f.students?.name || 'Anonymous Student'}</h4>
                      <span className={styles.rollNo}>{f.roll_no}</span>
                    </div>
                  </div>
                  <span className={styles.courseBadge}>{f.course_code}</span>
                </div>

                <div className={styles.ratingRow}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < f.rating ? styles.starFilled : styles.starEmpty} 
                      />
                    ))}
                  </div>
                  <span className={styles.dateLabel}>{new Date(f.created_at).toLocaleDateString()}</span>
                </div>

                <h4 className={styles.reviewTitle}>{f.title}</h4>
                <p className={styles.reviewText}>{f.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
