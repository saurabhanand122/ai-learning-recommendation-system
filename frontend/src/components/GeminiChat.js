'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, HelpCircle } from 'lucide-react';
import { useSessionAuth } from '@/context/AuthContext';
import styles from '@/styles/GeminiChat.module.css';

export default function GeminiChat() {
  const { token } = useSessionAuth();
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Hello! I am Advisobot, your Gemini-powered advisor. Ask me anything about course prerequisites, levels, scheduling, or degree requirements!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    "Prerequisites for AI?",
    "Show Foundation courses",
    "What is Web Dev workload?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');
    
    // Add user message to UI
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(1) // skip the initial greeting
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: `Error: ${data.error || 'Failed to generate response.'}` }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting to my brain right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className={`${styles.chatContainer} glass-card`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.botTitle}>
          <Sparkles className={styles.botIcon} />
          <div>
            <h3>Advisobot</h3>
            <span className={styles.status}>Online (Gemini AI)</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.chatArea}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`${styles.messageRow} ${msg.sender === 'user' ? styles.userRow : styles.botRow}`}
          >
            <div className={styles.avatar}>
              {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={styles.messageBubble}>
              <p className={styles.messageText}>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.messageRow} ${styles.botRow}`}>
            <div className={styles.avatar}>
              <Bot size={14} />
            </div>
            <div className={`${styles.messageBubble} ${styles.thinkingBubble}`}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions suggestion pills */}
      <div className={styles.suggestions}>
        <span className={styles.suggestionTitle}><HelpCircle size={12} /> Suggest:</span>
        <div className={styles.pills}>
          {quickQuestions.map((q, idx) => (
            <button 
              key={idx} 
              onClick={() => sendMessage(q)}
              disabled={isLoading}
              className={styles.pillBtn}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input controls */}
      <div className={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about math prerequisites, web dev..."
          disabled={isLoading}
          className={styles.input}
        />
        <button 
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          className={`${styles.sendBtn} gradient-bg`}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
