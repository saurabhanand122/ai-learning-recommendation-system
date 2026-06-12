'use client';

import React from 'react';
import Link from 'next/link';
import { useSessionAuth } from '@/context/AuthContext';
import { GraduationCap, ArrowRight, Sparkles, BookOpen, UserCheck, ShieldCheck } from 'lucide-react';
import styles from '@/styles/Home.module.css';

export default function LandingPage() {
  const { isSignedIn, role, isMock, setMockRole } = useSessionAuth();

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'pod') return '/pod';
    return '/student';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.logoArea}>
          <GraduationCap className={styles.logoIcon} />
          <span className={styles.logoText}>Path<span className="gradient-text">Craft</span></span>
        </div>
        
        <nav className={styles.nav}>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="#about" className={styles.navLink}>About</Link>
          
          {isMock && (
            <div className={styles.rolePickerContainer}>
              <span className={styles.roleLabel}>Mock Role:</span>
              <select 
                value={role} 
                onChange={(e) => setMockRole(e.target.value)}
                className={styles.roleSelect}
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
                <option value="pod">POD Officer</option>
              </select>
            </div>
          )}

          {isSignedIn ? (
            <Link href={getDashboardPath()} className="btn-primary">
              Go to Portal <ArrowRight size={16} />
            </Link>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/sign-in" className="btn-secondary">Login</Link>
              <Link href="/sign-up" className="btn-primary">Get Started</Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className={styles.heroSection}>
        <div className={styles.heroText}>
          <div className={styles.badge}>
            <Sparkles size={14} className={styles.badgeIcon} />
            <span>AI-Driven Academic Roadmap Planning</span>
          </div>
          
          <h1 className={styles.title}>
            Taking routes in a <span className="gradient-text">smarter way</span>
          </h1>
          
          <p className={styles.description}>
            Design your ideal academic curriculum. Get course recommendations personalized to your interests, career goals, schedule, and study commitments, backed by ChatGPT and Gemini.
          </p>

          <div className={styles.ctaContainer}>
            <Link href={getDashboardPath()} className="btn-primary">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn-secondary">Learn More</a>
          </div>

          <div className={styles.quickStats}>
            <div className={styles.statItem}>
              <h3>10k+</h3>
              <p>Paths Generated</p>
            </div>
            <div className={styles.statItem}>
              <h3>98%</h3>
              <p>Student Satisfaction</p>
            </div>
            <div className={styles.statItem}>
              <h3>24/7</h3>
              <p>AI Advising</p>
            </div>
          </div>
        </div>

        {/* Right side flow chart visualization */}
        <div className={styles.heroVisual}>
          <div className={`${styles.visualCard} glass-panel`}>
            <div className={styles.visualHeader}>
              <div className={styles.dots}>
                <span className={styles.dotRed}></span>
                <span className={styles.dotYellow}></span>
                <span className={styles.dotGreen}></span>
              </div>
              <span className={styles.visualTitle}>Interactive Learning Tree</span>
            </div>
            <div className={styles.visualBody}>
              <div className={styles.nodeTree}>
                <div className={`${styles.treeNode} ${styles.completed}`}>
                  <BookOpen size={16} />
                  <span>Mathematics I</span>
                </div>
                <div className={styles.connectorLine}></div>
                
                <div className={styles.splitRow}>
                  <div className={`${styles.treeNode} ${styles.active}`}>
                    <Sparkles size={16} />
                    <span>Python Programming</span>
                  </div>
                  <div className={`${styles.treeNode} ${styles.recommended}`}>
                    <GraduationCap size={16} />
                    <span>Data Structures</span>
                  </div>
                </div>

                <div className={styles.connectorSplit}></div>

                <div className={`${styles.treeNode} ${styles.locked}`}>
                  <Sparkles size={16} />
                  <span>AI & Machine Learning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Roles Feature Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2>Personalized Portals for Everyone</h2>
          <p>Different workflows tailored for students, administrators, and program coordinators.</p>
        </div>

        <div className={styles.grid}>
          <div className="glass-card">
            <GraduationCap size={36} className={styles.featureIconBlue} />
            <h3>Student Hub</h3>
            <p>Get AI-optimized subject suggestions based on completed courses, time constraints, and preferences. Access your chatbot advisor and voice agent.</p>
          </div>

          <div className="glass-card">
            <ShieldCheck size={36} className={styles.featureIconPurple} />
            <h3>Admin Console</h3>
            <p>Upload enrollment logs, manage academic catalogs, configure student details, and define recommendation limits system-wide.</p>
          </div>

          <div className="glass-card">
            <UserCheck size={36} className={styles.featureIconPink} />
            <h3>POD Coordinator</h3>
            <p>Monitor demand for upcoming courses, review student feedback rating databases, and plan resources with live analytics dashboards.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} PathCraft. All rights reserved.</p>
      </footer>
    </div>
  );
}
