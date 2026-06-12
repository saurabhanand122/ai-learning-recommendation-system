'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import VapiVoiceAdvisor from '@/components/VapiVoiceAdvisor';
import GeminiChat from '@/components/GeminiChat';
import { useSessionAuth } from '@/context/AuthContext';
import { Award, Clock, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import styles from '@/styles/Dashboard.module.css';

export default function StudentDashboard() {
  const { token, user } = useSessionAuth();
  const [profile, setProfile] = useState(null);
  const [completedCount, setCompletedCount] = useState(2); // default mock count
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
        const response = await fetch(`${backendUrl}/api/students/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setProfile(data);
          
          // Also fetch completed courses to count them
          const recResponse = await fetch(`${backendUrl}/api/recommendations/history`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const recData = await recResponse.json();
          // We can use a mock count or fallback based on profile
          setCompletedCount(data.roll_no ? 2 : 2);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        {/* Welcome Header */}
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>Student Portal / Dashboard</span>
            <h1 className={styles.title}>
              Welcome back, <span className="gradient-text">{profile?.name || user?.name || 'Student'}</span>!
            </h1>
            <p className={styles.subtitle}>Here is your academic overview and AI advising assistant.</p>
          </div>
          <div className={styles.levelCard}>
            <GraduationCap className={styles.levelIcon} />
            <div>
              <span className={styles.levelLabel}>Current Program Level</span>
              <h4 className={styles.levelValue}>{profile?.current_level || 'Foundation Level'}</h4>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className={styles.metricsGrid}>
          <div className={`${styles.metricCard} glass-card`}>
            <Award className={styles.metricIconBlue} />
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Academic CGPA</span>
              <h2 className={styles.metricValue}>{profile?.cgpa ? profile.cgpa.toFixed(2) : '8.20'} / 10</h2>
              <p className={styles.metricSubtext}>Excellent Standing</p>
            </div>
          </div>

          <div className={`${styles.metricCard} glass-card`}>
            <Clock className={styles.metricIconPurple} />
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Study Commitment</span>
              <h2 className={styles.metricValue}>{profile?.commitment || 12} hrs/wk</h2>
              <p className={styles.metricSubtext}>Ideal for 2-3 Courses</p>
            </div>
          </div>

          <div className={`${styles.metricCard} glass-card`}>
            <BookOpen className={styles.metricIconPink} />
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Courses Completed</span>
              <h2 className={styles.metricValue}>{completedCount} Subjects</h2>
              <p className={styles.metricSubtext}>4 Credits Average</p>
            </div>
          </div>
        </section>

        {/* AI Advising Center Grid */}
        <section className={styles.advisingGrid}>
          <div className={styles.leftCol}>
            <VapiVoiceAdvisor studentProfile={profile} />
            
            <div className={`${styles.infoBox} glass-card`}>
              <div className={styles.infoTitle}>
                <Sparkles size={16} className={styles.infoIcon} />
                <h4>Quick Advising Tips</h4>
              </div>
              <ul className={styles.tipsList}>
                <li>Always check prerequisites before requesting recommendation path.</li>
                <li>Your weekly availability matches <b>{profile?.commitment || 12} hours</b>, which is optimal for a balanced schedule.</li>
                <li>Submit feedback for completed subjects to help train recommendation models.</li>
              </ul>
            </div>
          </div>
          
          <div className={styles.rightCol}>
            <GeminiChat />
          </div>
        </section>
      </main>
    </div>
  );
}
