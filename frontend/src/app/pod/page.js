'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Award, Users, BookOpen, Star, Sparkles, AlertCircle } from 'lucide-react';
import styles from '@/styles/POD.module.css';

export default function PodDashboard() {
  const { token } = useSessionAuth();
  
  // States
  const [chartData, setChartData] = useState([]);
  const [overallMetrics, setOverallMetrics] = useState({ totalFeedback: 0, avgRating: 0, topSubject: 'N/A' });
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function loadPodData() {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // 1. Fetch courses list
      const coursesRes = await fetch(`${backendUrl}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const courses = await coursesRes.json();
      
      if (coursesRes.ok && courses.length > 0) {
        // Fetch stats for all courses in parallel
        const statsPromises = courses.map(async (c) => {
          const statsRes = await fetch(`${backendUrl}/api/feedback/stats/course/${c.course_code}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const stats = await statsRes.json();
          return {
            course_code: c.course_code,
            course_name: c.course_name,
            students_count: stats.n_students || 0,
            average_rating: stats.average_rating || 0.0,
            capacity: c.capacity
          };
        });

        const results = await Promise.all(statsPromises);
        setChartData(results);

        // Calculate general POD aggregates
        const totalFbRes = await fetch(`${backendUrl}/api/feedback`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const totalFb = await totalFbRes.json();

        if (totalFbRes.ok) {
          const fbCount = totalFb.length;
          const avg = fbCount > 0 ? (totalFb.reduce((acc, curr) => acc + curr.rating, 0) / fbCount) : 4.2;
          
          // Find course code with highest average rating
          let highest = 'N/A';
          let maxVal = -1;
          results.forEach(r => {
            if (r.average_rating > maxVal && r.students_count > 0) {
              maxVal = r.average_rating;
              highest = r.course_code;
            }
          });

          setOverallMetrics({
            totalFeedback: fbCount,
            avgRating: parseFloat(avg.toFixed(1)),
            topSubject: highest
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadPodData();
    }
  }, [token]);

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>POD Coordinator / Dashboard</span>
            <h1 className={styles.title}>Capacity <span className="gradient-text">Planning</span></h1>
            <p className={styles.subtitle}>Track student demand, review overall average course ratings, and plan resources.</p>
          </div>
        </header>

        {isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Loading Analytics...</p>
          </div>
        ) : (
          <div className={styles.podGrid}>
            {/* Top row cards */}
            <div className={styles.metricsRow}>
              <div className={`${styles.podMetricCard} glass-card`}>
                <Users className={styles.metricIconBlue} />
                <div>
                  <span className={styles.metricLabel}>Total Feedback Reviews</span>
                  <h2>{overallMetrics.totalFeedback} Submitted</h2>
                </div>
              </div>

              <div className={`${styles.podMetricCard} glass-card`}>
                <Star className={styles.metricIconPurple} />
                <div>
                  <span className={styles.metricLabel}>Average System Rating</span>
                  <h2>{overallMetrics.avgRating} / 5 Stars</h2>
                </div>
              </div>

              <div className={`${styles.podMetricCard} glass-card`}>
                <Award className={styles.metricIconPink} />
                <div>
                  <span className={styles.metricLabel}>Highest Rated Subject</span>
                  <h2>{overallMetrics.topSubject}</h2>
                </div>
              </div>
            </div>

            {/* Recharts Analytics Charts grid */}
            <div className={styles.chartsContainer}>
              {/* Chart 1: Course demand bar chart */}
              <div className={`${styles.chartCard} glass-card`}>
                <div className={styles.chartHeader}>
                  <h3>Student Counts Demand (Capacity vs Enrollments)</h3>
                  <p>Shows how many students completed or selected each course code.</p>
                </div>
                
                <div className={styles.chartArea}>
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="course_code" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="students_count" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} name="Students Count" />
                        <Bar dataKey="capacity" fill="rgba(255,255,255,0.05)" stroke="var(--border-glass)" radius={[4, 4, 0, 0]} name="Max Capacity" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Course rating bar chart */}
              <div className={`${styles.chartCard} glass-card`}>
                <div className={styles.chartHeader}>
                  <h3>Subject Average Ratings (Quality Index)</h3>
                  <p>Course quality score calculated from student feedback forms.</p>
                </div>
                
                <div className={styles.chartArea}>
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="course_code" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 5]} />
                        <Tooltip 
                          contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                        />
                        <ReferenceLine y={4.0} stroke="rgba(16, 185, 129, 0.4)" strokeDasharray="3 3" label={{ value: 'Target 4.0', fill: '#10b981', fontSize: 10 }} />
                        <Bar dataKey="average_rating" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} name="Rating (1-5)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Course capacity utilization table summary */}
            <div className={`${styles.demandTableCard} glass-card`}>
              <h3>Subject Utilization & Coordinator Status</h3>
              <p className={styles.desc}>Inspecting enrollment demands to schedule lab spaces, TAs, or viva examiners.</p>
              
              <div className={styles.tableResponsive}>
                <table className={styles.demandTable}>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Name</th>
                      <th>Class Capacity</th>
                      <th>Enrollment Estimate</th>
                      <th>Utilization Rate</th>
                      <th>Action Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((data) => {
                      const utilRate = ((data.students_count / data.capacity) * 100).toFixed(0);
                      const isHigh = parseInt(utilRate) >= 80;
                      return (
                        <tr key={data.course_code}>
                          <td className="font-bold">{data.course_code}</td>
                          <td>{data.course_name}</td>
                          <td>{data.capacity} seats</td>
                          <td>{data.students_count}</td>
                          <td>
                            <span className={isHigh ? styles.rateHigh : styles.rateNormal}>{utilRate}%</span>
                          </td>
                          <td>
                            {isHigh ? (
                              <span className={styles.actionWarning}><AlertCircle size={12} /> Expand capacity / Extra TA</span>
                            ) : (
                              <span className={styles.actionNormal}>Normal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
