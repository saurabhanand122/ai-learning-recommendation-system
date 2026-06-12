'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSessionAuth } from '@/context/AuthContext';
import { Upload, FileText, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import styles from '@/styles/Import.module.css';

export default function AdminImportPage() {
  const { token } = useSessionAuth();
  
  // File State
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'text/csv') {
      setFile(selected);
      setErrorMsg('');
      setUploadResult(null);
    } else {
      setFile(null);
      setErrorMsg('Please select a valid CSV file.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/import/enrollments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        setUploadResult(data);
        setFile(null);
        // Clear file input
        document.getElementById('csv-file-input').value = '';
      } else {
        setErrorMsg(data.error || 'Failed to upload CSV.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error uploading CSV file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className={styles.header}>
          <div>
            <span className={styles.breadcrumb}>Admin Portal / Bulk Data Loader</span>
            <h1 className={styles.title}>Enrollments <span className="gradient-text">Importer</span></h1>
            <p className={styles.subtitle}>Upload CSV records to automate course enrollment logs and student completed history.</p>
          </div>
        </header>

        <div className={styles.importGrid}>
          {/* Instructions Card */}
          <div className={`${styles.instructionsCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <FileText size={20} className={styles.headerIcon} />
              <h3>CSV File Schema & Instructions</h3>
            </div>
            <div className={styles.cardBody}>
              <p>For automated data loading to run successfully, your CSV spreadsheet must contain the following header titles exactly:</p>
              
              <div className={styles.csvColumns}>
                <span className={styles.colBadgeRequired}>roll_no</span>
                <span className={styles.colBadgeRequired}>course_code</span>
                <span className={styles.colBadgeOptional}>term</span>
                <span className={styles.colBadgeOptional}>grade</span>
                <span className={styles.colBadgeOptional}>status</span>
              </div>
              
              <div className={styles.csvExample}>
                <h5>Example CSV content structure:</h5>
                <pre>
                  {`roll_no,course_code,term,grade,status
23t1-stud-001,BSCS1001,Term 1,A,completed
23t1-stud-001,BSMA1001,Term 1,B,completed
23t1-stud-002,BSCS1001,Term 1,S,completed`}
                </pre>
              </div>
            </div>
          </div>

          {/* Upload Form Card */}
          <div className={`${styles.uploadCard} glass-panel`}>
            <h3>Select File</h3>
            <p className={styles.desc}>Upload a spreadsheet (.csv format) from your local machine.</p>

            <form onSubmit={handleUpload} className={styles.form}>
              <div className={styles.fileDropArea}>
                <Upload size={32} className={styles.uploadIcon} />
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                <span className={styles.fileLabel}>
                  {file ? file.name : "Drag & drop your CSV file here, or click to browse"}
                </span>
                {file && (
                  <span className={styles.fileSize}>
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                )}
              </div>

              {errorMsg && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {uploadResult && (
                <div className={styles.successAlert}>
                  <CheckCircle size={16} />
                  <div>
                    <span className={styles.successHeading}>{uploadResult.message}</span>
                    {uploadResult.ignoredCount > 0 && (
                      <p className={styles.successDetails}>
                        <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Ignored {uploadResult.ignoredCount} rows due to empty values.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={!file || isUploading}
                className={`${styles.submitBtn} btn-primary`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className={styles.spin} size={16} />
                    <span>Processing CSV Upload...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Upload & Import Logs</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
