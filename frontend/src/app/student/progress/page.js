'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { CheckCircle2, Circle, GraduationCap, Award, BookOpen, ChevronRight, Lock } from 'lucide-react';
import styles from '@/styles/Progress.module.css';

export default function ProgressPage() {
  const { token, user } = useSessionAuth();
  
  // Data States
  const [completedList, setCompletedList] = useState(['BSCS1001', 'BSMA1001']); // Mock completed courses list
  const [isLoading, setIsLoading] = useState(true);

  // Course structure mapping
  const degreeStructure = [
    {
      levelName: 'Foundation Level',
      creditsRequired: 32,
      courses: [
        { code: 'BSCS1001', name: 'Introduction to Programming (Python)', credits: 4 },
        { code: 'BSMA1001', name: 'Mathematics I', credits: 4 },
        { code: 'BSMA1002', name: 'Mathematics II', credits: 4 },
        { code: 'BSCS1002', name: 'Data Structures and Algorithms', credits: 4 }
      ]
    },
    {
      levelName: 'Diploma Level',
      creditsRequired: 24,
      courses: [
        { code: 'BSCS2001', name: 'Database Management Systems', credits: 4 },
        { code: 'BSCS2002', name: 'Application Development (Web)', credits: 4 }
      ]
    },
    {
      levelName: 'BSc Degree Level',
      creditsRequired: 28,
      courses: [
        { code: 'BSSE3001', name: 'Software Engineering', credits: 4 },
        { code: 'BSAI3002', name: 'Artificial Intelligence & Machine Learning', credits: 4 }
      ]
    }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
        
        // Fetch completed courses from user profile details
        const res = await fetch(`${backendUrl}/api/students/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          // If we have actual enrollments, we can map them, otherwise keep mock default
          setCompletedList(['BSCS1001', 'BSMA1001']);
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

  // Helper calculation functions
  const getLevelProgress = (levelCourses) => {
    const completedInLevel = levelCourses.filter(c => completedList.includes(c.code)).length;
    return {
      completed: completedInLevel,
      total: levelCourses.length,
      percentage: Math.round((completedInLevel / levelCourses.length) * 100)
    };
  };

  const getOverallProgress = () => {
    let totalCourses = 0;
    let completedCourses = 0;
    degreeStructure.forEach(level => {
      totalCourses += level.courses.length;
      completedCourses += level.courses.filter(c => completedList.includes(c.code)).length;
    });
    return Math.round((completedCourses / totalCourses) * 100);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>Student Portal / Degree Progress</span>
            <h1 className={styles.title}>Academic <span className="gradient-text">Checklist</span></h1>
            <p className={styles.subtitle}>Track your degree graduation requirements across Foundation, Diploma, and BSc phases.</p>
          </div>
        </header>

        {/* Overall Progress Banner */}
        <div className={`${styles.overallBanner} glass-card animate-fade-in`}>
          <div className={styles.bannerInfo}>
            <Award className={styles.bannerIcon} />
            <div>
              <h3>Overall Program Completion</h3>
              <p>You have completed <b>{completedList.length}</b> out of <b>8</b> core requirements.</p>
            </div>
          </div>
          <div className={styles.progressCircleContainer}>
            <div className={styles.progressCircleOuter}>
              <span className={styles.progressVal}>{getOverallProgress()}%</span>
            </div>
          </div>
        </div>

        {/* Levels List */}
        <div className={styles.levelsList}>
          {degreeStructure.map((level) => {
            const stats = getLevelProgress(level.courses);
            return (
              <div key={level.levelName} className={`${styles.levelCard} glass-card animate-fade-in`}>
                <div className={styles.levelHeader}>
                  <div className={styles.levelTitleArea}>
                    <GraduationCap className={styles.levelHeaderIcon} />
                    <div>
                      <h3>{level.levelName}</h3>
                      <span>{stats.completed} of {stats.total} Courses Completed</span>
                    </div>
                  </div>
                  <div className={styles.progressBarWrapper}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressBarInner} style={{ width: `${stats.percentage}%` }}></div>
                    </div>
                    <span className={styles.percentageText}>{stats.percentage}%</span>
                  </div>
                </div>

                <div className={styles.coursesGrid}>
                  {level.courses.map((course) => {
                    const isCompleted = completedList.includes(course.code);
                    return (
                      <div 
                        key={course.code} 
                        className={`${styles.courseCheckItem} ${isCompleted ? styles.courseCompleted : styles.coursePending}`}
                      >
                        <div className={styles.checkIcon}>
                          {isCompleted ? (
                            <CheckCircle2 className={styles.checkFilled} size={18} />
                          ) : (
                            <Circle className={styles.circleEmpty} size={18} />
                          )}
                        </div>
                        <div className={styles.courseDetails}>
                          <span className={styles.courseCode}>{course.code}</span>
                          <span className={styles.courseName}>{course.name}</span>
                          <span className={styles.credits}>{course.credits} Credits</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
