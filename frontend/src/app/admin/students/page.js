'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { Plus, Edit, Trash2, ShieldAlert, Save, X, Search, GraduationCap } from 'lucide-react';
import styles from '@/styles/StudentCRUD.module.css';

export default function AdminStudentsPage() {
  const { token } = useSessionAuth();
  
  // Data States
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [errorMsg, setErrorMsg] = useState('');
  
  // Fields
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [commitment, setCommitment] = useState('');
  const [level, setLevel] = useState('Foundation');
  const [interestsStr, setInterestsStr] = useState('');
  const [goalsStr, setGoalsStr] = useState('');

  async function loadStudents() {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
      const res = await fetch(`${backendUrl}/api/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadStudents();
    }
  }, [token]);

  const openAddForm = () => {
    setFormMode('add');
    setRollNo('');
    setName('');
    setEmail('');
    setCgpa('8.0');
    setCommitment('12');
    setLevel('Foundation');
    setInterestsStr('');
    setGoalsStr('');
    setErrorMsg('');
    setShowForm(true);
  };

  const openEditForm = (student) => {
    setFormMode('edit');
    setRollNo(student.roll_no);
    setName(student.name);
    setEmail(student.email);
    setCgpa(student.cgpa?.toString() || '');
    setCommitment(student.commitment?.toString() || '');
    setLevel(student.current_level || 'Foundation');
    setInterestsStr(student.interests?.join(', ') || '');
    setGoalsStr(student.goals?.join(', ') || '');
    setErrorMsg('');
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      roll_no: rollNo,
      name,
      email,
      cgpa: parseFloat(cgpa) || 7.0,
      commitment: parseInt(commitment) || 12,
      current_level: level,
      interests: interestsStr.split(',').map(s => s.trim()).filter(Boolean),
      goals: goalsStr.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
      const url = formMode === 'add' 
        ? `${backendUrl}/api/students` 
        : `${backendUrl}/api/students/${rollNo}`;
        
      const response = await fetch(url, {
        method: formMode === 'add' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowForm(false);
        loadStudents();
      } else {
        setErrorMsg(data.error || 'Failed to save student profile');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error saving details.');
    }
  };

  const handleDelete = async (roll) => {
    if (!confirm(`Are you sure you want to delete student ${roll}?`)) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
      const response = await fetch(`${backendUrl}/api/students/${roll}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        loadStudents();
      } else {
        alert('Failed to delete student.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>Admin Portal / Manage Students</span>
            <h1 className={styles.title}>Student <span className="gradient-text">Profiles</span></h1>
            <p className={styles.subtitle}>Create, inspect, update, and remove student academic records manually.</p>
          </div>
          {!showForm && (
            <button onClick={openAddForm} className="btn-primary">
              <Plus size={16} /> Add Student
            </button>
          )}
        </header>

        {showForm ? (
          /* Profile Add/Edit Form Overlay */
          <div className={`${styles.formContainer} glass-panel animate-fade-in`}>
            <div className={styles.formHeader}>
              <h3>{formMode === 'add' ? 'Add New Student Profile' : 'Edit Student Details'}</h3>
              <button onClick={() => setShowForm(false)} className={styles.closeBtn}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleFormSubmit} className={styles.formBody}>
              {errorMsg && (
                <div className={styles.errorAlert}>
                  <ShieldAlert size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Roll Number</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    disabled={formMode === 'edit'}
                    placeholder="e.g. 23t1-stud-001"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. email@example.com"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Current Level</label>
                  <select 
                    value={level} 
                    onChange={(e) => setLevel(e.target.value)}
                    className="form-select"
                  >
                    <option value="Foundation">Foundation</option>
                    <option value="Diploma">Diploma</option>
                    <option value="BSc">BSc</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Current CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Commitment (hrs/wk)</label>
                  <input
                    type="number"
                    value={commitment}
                    onChange={(e) => setCommitment(e.target.value)}
                    min="4"
                    max="40"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Interests (comma separated)</label>
                <input
                  type="text"
                  value={interestsStr}
                  onChange={(e) => setInterestsStr(e.target.value)}
                  placeholder="e.g. AI, Web Development, Algorithms"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Career Goals (comma separated)</label>
                <input
                  type="text"
                  value={goalsStr}
                  onChange={(e) => setGoalsStr(e.target.value)}
                  placeholder="e.g. Software Engineer, Machine Learning Specialist"
                  className="form-input"
                />
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Save Profile</button>
              </div>
            </form>
          </div>
        ) : (
          /* Student Profiles Table view */
          <div className={styles.tableCard}>
            {/* Search Input */}
            <div className={styles.tableHeader}>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by name, roll no, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            {isLoading ? (
              <div className={styles.emptyState}>
                <div className={styles.spinner}></div>
                <p>Loading Students List...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <p className={styles.noData}>No student records found matching search filters.</p>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.studentsTable}>
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Level</th>
                      <th>CGPA</th>
                      <th>Hrs/wk</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((stud) => (
                      <tr key={stud.roll_no}>
                        <td className="font-bold">{stud.roll_no}</td>
                        <td>{stud.name}</td>
                        <td>{stud.email}</td>
                        <td>
                          <span className={styles.levelBadge}>{stud.current_level}</span>
                        </td>
                        <td>{stud.cgpa ? stud.cgpa.toFixed(2) : 'N/A'}</td>
                        <td>{stud.commitment || 12}</td>
                        <td>
                          <div className={styles.actionsGroup}>
                            <button onClick={() => openEditForm(stud)} className={styles.editBtn}>
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(stud.roll_no)} className={styles.deleteBtn}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
