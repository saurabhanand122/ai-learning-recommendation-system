'use client';

import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { Mic, MicOff, Volume2, Sparkles, MessageCircle } from 'lucide-react';
import styles from '@/styles/VapiVoiceAdvisor.module.css';

export default function VapiVoiceAdvisor({ studentProfile }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('Click start and talk to your academic voice advisor...');
  
  const vapiRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize Speech Synthesis for mock mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speakMockResponse = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      // Done speaking
    };
    synthRef.current.speak(utterance);
  };

  const startVoiceSession = async () => {
    setIsConnecting(true);
    const vapiToken = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (vapiToken && !vapiToken.includes('placeholder') && assistantId) {
      // Real Vapi Integration
      try {
        if (!vapiRef.current) {
          vapiRef.current = new Vapi(vapiToken);
          
          vapiRef.current.on('call-start', () => {
            setIsActive(true);
            setIsConnecting(false);
            setIsMockMode(false);
            setAssistantMessage('Connected! Start speaking now...');
          });

          vapiRef.current.on('call-end', () => {
            setIsActive(false);
            setIsConnecting(false);
            setIsMockMode(false);
            setAssistantMessage('Call ended.');
          });

          vapiRef.current.on('message', (message) => {
            if (message.type === 'transcript' && message.transcriptType === 'partial') {
              setTranscript(message.transcript);
            }
            if (message.type === 'transcript' && message.transcriptType === 'final') {
              setTranscript(message.transcript);
            }
          });

          vapiRef.current.on('error', (err) => {
            console.error('Vapi Error:', err);
            setIsActive(false);
            setIsConnecting(false);
            setAssistantMessage('Connection error. Falling back to local simulator.');
            setIsMockMode(true);
            startMockSession();
          });
        }

        console.log('[VAPI] Starting session with variables:', {
          variableValues: {
            student_name: studentProfile?.name || 'Student',
            interests: (studentProfile?.interests || []).join(', '),
            completed_courses: 'BSCS1001'
          }
        });

        await vapiRef.current.start(assistantId, {
          variableValues: {
            student_name: studentProfile?.name || 'Student',
            interests: (studentProfile?.interests || []).join(', '),
            completed_courses: 'BSCS1001'
          }
        });
      } catch (err) {
        console.error('Failed to start Vapi call:', err);
        setIsMockMode(true);
        startMockSession();
      }
    } else {
      // Mock Speech Mode
      setIsMockMode(true);
      startMockSession();
    }
  };

  const startMockSession = () => {
    setIsActive(true);
    setIsConnecting(false);
    setAssistantMessage('Connecting to voice assistant (Demo Mode)...');
    
    setTimeout(() => {
      const greeting = `Hello ${studentProfile?.name || 'there'}! I am PathCraft, your virtual course coordinator. I see you are interested in ${
        (studentProfile?.interests || ['Technology'])[0]
      }. What can I recommend for you today?`;
      
      setAssistantMessage(greeting);
      speakMockResponse(greeting);
    }, 1500);
  };

  const stopVoiceSession = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsActive(false);
    setIsConnecting(false);
    setIsMockMode(false);
    setAssistantMessage('Session closed.');
    setTranscript('');
  };

  // Mock conversation loop
  const handleMockSpeechInput = (text) => {
    setTranscript(text);
    let reply = "I recommend taking Data Structures BSCS1002 next as it fits your coding profile.";
    const lower = text.toLowerCase();
    
    if (lower.includes('level') || lower.includes('degree')) {
      reply = `You are currently in the ${studentProfile?.current_level || 'Foundation'} level. Let's aim to complete core courses first.`;
    } else if (lower.includes('heavy') || lower.includes('workload') || lower.includes('busy')) {
      reply = `Since you committed to ${studentProfile?.commitment || 12} hours a week, you should start with one core mathematical course and one coding elective.`;
    } else if (lower.includes('thank') || lower.includes('bye')) {
      reply = "You're welcome! Let me know if you need anything else. Good luck with your studies!";
    }

    setTimeout(() => {
      setAssistantMessage(reply);
      speakMockResponse(reply);
    }, 1200);
  };

  return (
    <div className={`${styles.card} glass-card`}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Volume2 className={styles.icon} />
          <h3>Voice Advisor</h3>
        </div>
        <span className={`${styles.badge} ${isActive ? styles.badgeActive : ''}`}>
          {isActive ? 'Live' : 'Idle'}
        </span>
      </div>

      <div className={styles.displayArea}>
        <p className={styles.assistantMsg}>{assistantMessage}</p>
        {transcript && (
          <div className={styles.transcriptArea}>
            <span className={styles.transcriptLabel}>You said:</span>
            <p className={styles.transcriptText}>"{transcript}"</p>
          </div>
        )}
      </div>

      {/* Dynamic Soundwave active state */}
      {isActive && (
        <div className={styles.soundwave}>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}

      <div className={styles.controls}>
        {isActive ? (
          <button onClick={stopVoiceSession} className={styles.stopBtn}>
            <MicOff size={16} /> Stop Session
          </button>
        ) : (
          <button 
            onClick={startVoiceSession} 
            disabled={isConnecting}
            className={`${styles.startBtn} gradient-bg`}
          >
            <Mic size={16} /> {isConnecting ? 'Connecting...' : 'Talk to Advisor'}
          </button>
        )}
      </div>

      {isMockMode && isActive && (
        <div className={styles.simulatorHelper}>
          <span className={styles.helperHeader}><Sparkles size={12} /> Speech Simulator Console</span>
          <div className={styles.mockButtons}>
            <button onClick={() => handleMockSpeechInput("What course should I take next?")}>Ask recommendation</button>
            <button onClick={() => handleMockSpeechInput("My schedule is busy, is the workload heavy?")}>Query workload</button>
            <button onClick={() => handleMockSpeechInput("Thank you, goodbye")}>Say thanks</button>
          </div>
        </div>
      )}
    </div>
  );
}
