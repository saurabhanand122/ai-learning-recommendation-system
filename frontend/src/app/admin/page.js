'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { ShieldAlert, Settings, Plus, Star, Users, BookOpen, BarChart3, Edit, Save } from 'lucide-react';
import styles from '@/styles/Admin.module.css';

export default function AdminDashboard() {
  const { token } = useSessionAuth();
  
  // Data States
  const [coursesAvailability, setCoursesAvailability] = useState([]);
  const [limit, setLimit] = useState(5);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(5);
  const [generalStats, setGeneralStats] = useState({ students: 0, courses: 0, enrollments: 0 });
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // 1. Fetch courses availability
      const availRes = await fetch(`${backendUrl}/api/courses/availability`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const availData = await availRes.json();
      if (availRes.ok) {
        setCoursesAvailability(availData);
      }

      // 2. Fetch limit settings
      const limitRes = await fetch(`${backendUrl}/api/recommendations/settings/limit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const limitData = await limitRes.json();
      if (limitRes.ok) {
        setLimit(limitData.limit);
        setLimitInput(limitData.limit);
      }

      // 3. Gather general counts
      const studentsRes = await fetch(`${backendUrl}/api/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      
      const coursesRes = await fetch(`${backendUrl}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coursesData = await coursesRes.json();

      if (studentsRes.ok && coursesRes.ok) {
        setGeneralStats({
          students: studentsData.length,
          courses: coursesData.length,
          // Calculate enrollments from capacities of courses
          enrollments: coursesAvailability.reduce((acc, curr) => acc + (curr.capacity - curr.available_seats), 0) || 4
        });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const handleSaveLimit = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/recommendations/settings/limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ limit: parseInt(limitInput) })
      });
      if (response.ok) {
        setLimit(parseInt(limitInput));
        setIsEditingLimit(false);
      } else {
        alert('Failed to update settings');
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
            <span className={styles.breadcrumb}>Admin Portal / Dashboard</span>
            <h1 className={styles.title}>System <span className="gradient-text">Configuration</span></h1>
            <p className={styles.subtitle}>Manage general settings, monitor course seats availability, and inspect counts.</p>
          </div>
        </header>

        {isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Loading Admin Dashboard...</p>
          </div>
        ) : (
          <div className={styles.adminGrid}>
            {/* Top row overview stats cards */}
            <div className={styles.metricsRow}>
              <div className={`${styles.adminMetricCard} glass-card`}>
                <Users className={styles.metricIconBlue} />
                <div>
                  <span className={styles.metricLabel}>Total Students</span>
                  <h2>{generalStats.students} Records</h2>
                </div>
              </div>

              <div className={`${styles.adminMetricCard} glass-card`}>
                <BookOpen className={styles.metricIconPurple} />
                <div>
                  <span className={styles.metricLabel}>Total Courses</span>
                  <h2>{generalStats.courses} Active</h2>
                </div>
              </div>

              <div className={`${styles.adminMetricCard} glass-card`}>
                <BarChart3 className={styles.metricIconPink} />
                <div>
                  <span className={styles.metricLabel}>Total Enrollments</span>
                  <h2>{generalStats.enrollments} Classes</h2>
                </div>
              </div>
            </div>

            {/* Config Box and Seating table */}
            <div className={styles.configArea}>
              {/* Settings Configuration Card */}
              <div className={`${styles.settingsCard} glass-card`}>
                <div className={styles.settingsHeader}>
                  <Settings className={styles.settingsIcon} />
                  <h3>Recommendation Rules</h3>
                </div>
                
                <div className={styles.settingsBody}>
                  <div className={styles.configItem}>
                    <div>
                      <h5>Maximum Recommendations limit</h5>
                      <p>Caps the total number of subjects suggested per student by OpenAI.</p>
                    </div>
                    
                    {isEditingLimit ? (
                      <div className={styles.limitForm}>
                        <input
                          type="number"
                          value={limitInput}
                          onChange={(e) => setLimitInput(e.target.value)}
                          min={1}
                          max={10}
                          className={styles.limitInput}
                        />
                        <button onClick={handleSaveLimit} className={styles.saveBtn}><Save size={14} /></button>
                      </div>
                    ) : (
                      <div className={styles.limitDisplay}>
                        <span className={styles.limitVal}>{limit} Subjects</span>
                        <button onClick={() => setIsEditingLimit(true)} className={styles.editBtn}><Edit size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Seating Availability Table */}
              <div className={`${styles.tableCard} glass-card`}>
                <h3>Course Seating & Availability</h3>
                <p className={styles.tableDesc}>Track available capacity. Low seating capacity raises automated warning alerts.</p>
                
                <div className={styles.tableResponsive}>
                  <table className={styles.availabilityTable}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Capacity</th>
                        <th>Enrolled</th>
                        <th>Seats Left</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursesAvailability.map((course) => {
                        const filledPercentage = ((course.capacity - course.available_seats) / course.capacity) * 100;
                        const isCritical = course.available_seats <= 10;
                        return (
                          <tr key={course.course_code} className={isCritical ? styles.rowCritical : ''}>
                            <td className="font-bold">{course.course_code}</td>
                            <td>{course.course_name}</td>
                            <td>{course.capacity}</td>
                            <td>{course.capacity - course.available_seats}</td>
                            <td>
                              <span className={isCritical ? styles.seatsLeftCritical : styles.seatsLeftOk}>
                                {course.available_seats}
                              </span>
                            </td>
                            <td>
                              {isCritical ? (
                                <span className={styles.statusCritical}>
                                  <ShieldAlert size={12} /> Low Capacity
                                </span>
                              ) : (
                                <span className={styles.statusNormal}>Healthy</span>
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
          </div>
        )}
      </main>
    </div>
  );
}
