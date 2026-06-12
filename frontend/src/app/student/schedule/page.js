'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { Calendar as CalendarIcon, Clock, MapPin, Sparkles, Filter } from 'lucide-react';
import styles from '@/styles/Schedule.module.css';

export default function SchedulePage() {
  const { user } = useSessionAuth();
  const [filterTerm, setFilterTerm] = useState('ALL');

  // Hardcoded standard weekly slots for courses to map schedule
  const scheduleSlots = [
    { course_code: 'BSCS1001', name: 'Introduction to Programming', day: 'Monday, Wednesday', time: '09:00 AM - 11:00 AM', room: 'Lab Hall A', professor: 'Dr. Jane Miller', type: 'Lecture' },
    { course_code: 'BSMA1001', name: 'Mathematics I', day: 'Monday, Wednesday', time: '11:30 AM - 01:30 PM', room: 'Seminar Room 2', professor: 'Prof. Mark Davis', type: 'Lecture' },
    { course_code: 'BSCS1002', name: 'Data Structures and Algorithms', day: 'Tuesday, Thursday', time: '10:00 AM - 12:00 PM', room: 'Auditorium C', professor: 'Dr. Alan Turing', type: 'Lecture' },
    { course_code: 'BSCS2001', name: 'Database Management Systems', day: 'Tuesday, Thursday', time: '02:00 PM - 04:00 PM', room: 'Lab Hall B', professor: 'Prof. Grace Hopper', type: 'Lab Session' },
    { course_code: 'BSCS2002', name: 'Application Development (Web)', day: 'Friday', time: '10:00 AM - 01:00 PM', room: 'Innovation Center', professor: 'Dr. Tim Berners', type: 'Lab Session' },
    { course_code: 'BSAI3002', name: 'AI & Machine Learning', day: 'Tuesday, Thursday', time: '04:30 PM - 06:30 PM', room: 'AI Innovation Lab', professor: 'Dr. Geoffrey Hinton', type: 'Seminar' }
  ];

  const filteredSlots = filterTerm === 'ALL' 
    ? scheduleSlots 
    : scheduleSlots.filter(s => s.day.includes(filterTerm));

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>Student Portal / Calendar Schedule</span>
            <h1 className={styles.title}>Weekly <span className="gradient-text">Schedule</span></h1>
            <p className={styles.subtitle}>View class slots, lab times, classrooms, and professor details for your term.</p>
          </div>
        </header>

        {/* Filter Toolbar */}
        <div className={`${styles.toolbar} glass-card`}>
          <div className={styles.toolbarLabel}>
            <Filter size={16} />
            <span>Filter Weekday:</span>
          </div>
          <div className={styles.pills}>
            {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
              <button
                key={day}
                onClick={() => setFilterTerm(day)}
                className={`${styles.pillBtn} ${filterTerm === day ? styles.pillActive : ''}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Timetable Grid & Cards */}
        <div className={styles.scheduleGrid}>
          {filteredSlots.map((slot) => (
            <div key={slot.course_code} className={`${styles.slotCard} glass-card animate-fade-in`}>
              <div className={styles.cardHeader}>
                <span className={styles.typeTag}>{slot.type}</span>
                <span className={styles.code}>{slot.course_code}</span>
              </div>
              
              <h3 className={styles.subjectName}>{slot.name}</h3>
              
              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <CalendarIcon size={14} className={styles.iconBlue} />
                  <span>{slot.day}</span>
                </div>
                <div className={styles.detailItem}>
                  <Clock size={14} className={styles.iconPurple} />
                  <span>{slot.time}</span>
                </div>
                <div className={styles.detailItem}>
                  <MapPin size={14} className={styles.iconPink} />
                  <span>{slot.room}</span>
                </div>
              </div>

              <div className={styles.footer}>
                <div className={styles.profInfo}>
                  <span className={styles.profAvatar}>{slot.professor.charAt(4)}</span>
                  <div>
                    <h5>{slot.professor}</h5>
                    <span>Instructor</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredSlots.length === 0 && (
            <p className={styles.noClasses}>No classes scheduled for the selected weekday.</p>
          )}
        </div>
      </main>
    </div>
  );
}
