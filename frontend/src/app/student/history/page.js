'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { Calendar, Trash2, HelpCircle, ArrowRight, GitCommit, FileText, CheckCircle2 } from 'lucide-react';
import styles from '@/styles/History.module.css';

export default function HistoryPage() {
  const { token } = useSessionAuth();
  const [history, setHistory] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/recommendations/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setHistory(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (token) {
      loadHistory();
    }
  }, [token]);

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your recommendation history?')) return;
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/recommendations/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory([]);
        setSelectedIndex(0);
      } else {
        alert('Failed to clear history.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedRec = history[selectedIndex];

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>Student Portal / Roadmap History</span>
            <h1 className={styles.title}>Roadmap <span className="gradient-text">History</span></h1>
            <p className={styles.subtitle}>Review your previously generated academic roadmaps and career paths.</p>
          </div>
          {history.length > 0 && (
            <button onClick={handleClearHistory} className={styles.clearBtn}>
              <Trash2 size={16} /> Clear History
            </button>
          )}
        </header>

        {isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Loading History...</p>
          </div>
        ) : history.length === 0 ? (
          <div className={`${styles.emptyCard} glass-card`}>
            <HelpCircle size={48} className={styles.emptyIcon} />
            <h3>No Roadmap History</h3>
            <p>You haven't generated any course recommendations yet. Head over to the Get Recommendation tab to generate one.</p>
          </div>
        ) : (
          <div className={styles.workspace}>
            {/* Left Recommendations List Panel */}
            <div className={`${styles.listPanel} glass-panel`}>
              <span className={styles.listHeader}>Saved Recommendations</span>
              <div className={styles.listContainer}>
                {history.map((rec, idx) => (
                  <div 
                    key={rec.id} 
                    onClick={() => setSelectedIndex(idx)}
                    className={`${styles.listItem} ${selectedIndex === idx ? styles.listActive : ''}`}
                  >
                    <Calendar size={16} className={styles.calendarIcon} />
                    <div className={styles.listItemText}>
                      <span className={styles.listItemTitle}>Recommendation {history.length - idx}</span>
                      <span className={styles.listItemDate}>{new Date(rec.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Flowchart visual representation & Details Panel */}
            <div className={`${styles.flowchartPanel} glass-panel`}>
              <div className={styles.flowchartHeader}>
                <div>
                  <h3>Path Recommendation Flowchart</h3>
                  <span className={styles.dateLabel}>
                    {new Date(selectedRec.created_at).toLocaleDateString()} at {new Date(selectedRec.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <button onClick={() => window.print()} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  Download PDF
                </button>
              </div>

              {/* Dynamic flow chart rendering */}
              <div className={styles.flowchartArea}>
                <div className={styles.flowchartNodes}>
                  {selectedRec.recommended_courses.map((course, idx) => (
                    <React.Fragment key={course.course_code}>
                      <div className={`${styles.flowNode} glass-card`}>
                        <div className={styles.nodeHeader}>
                          <span className={styles.nodeNum}>{idx + 1}</span>
                          <span className={styles.nodeCode}>{course.course_code}</span>
                        </div>
                        <h4 className={styles.nodeTitle}>{course.course_name}</h4>
                        <p className={styles.nodeDesc}>{course.explanation}</p>
                      </div>
                      
                      {/* Connector Arrow (unless it's the last item) */}
                      {idx < selectedRec.recommended_courses.length - 1 && (
                        <div className={styles.flowConnector}>
                          <div className={styles.connectorLine}></div>
                          <ArrowRight className={styles.connectorArrow} size={18} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Generation Criteria at the bottom of the flowchart page */}
              <div className={styles.criteriaBox}>
                <h4 className={styles.critHeader}><FileText size={16} /> Generation Criteria</h4>
                <div className={styles.criteriaGrid}>
                  <div>
                    <span className={styles.critLabel}>Interests</span>
                    <p className={styles.critVal}>{selectedRec.criteria.interests?.join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <span className={styles.critLabel}>Career Goals</span>
                    <p className={styles.critVal}>{selectedRec.criteria.goals?.join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <span className={styles.critLabel}>Schedule Pref</span>
                    <p className={styles.critVal}>{selectedRec.criteria.schedule || 'Flexible'}</p>
                  </div>
                  <div>
                    <span className={styles.critLabel}>Weekly Study Load</span>
                    <p className={styles.critVal}>{selectedRec.criteria.commitment || 12} hours / week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
