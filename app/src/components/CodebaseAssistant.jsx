import React, { useState, useEffect, useRef } from 'react';
import { askCodebase, speakText, stopSpeech } from '../api/codebaseAssistant';

const CodebaseAssistant = ({ repoUrl, nodes = [], edges = [] }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true); // Auto-show subtitles
  const [isTyping, setIsTyping] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false); // Whether speech is available
  const typewriterIntervalRef = useRef(null);

  // Typewriter effect function
  const startTypewriterEffect = (text, onComplete) => {
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }
    
    setDisplayedText('');
    setIsTyping(true);
    
    let currentIndex = 0;
    const typingSpeed = 30; // milliseconds per character
    
    typewriterIntervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typewriterIntervalRef.current);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, typingSpeed);
  };

  // Cleanup speech synthesis and typewriter on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 CodebaseAssistant unmounting - stopping any ongoing speech and typewriter');
      stopSpeech();
      setIsPlaying(false);
      setCanSpeak(false);
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !repoUrl) return;

    setIsLoading(true);
    setResponse('');
    setDisplayedText('');
    setCanSpeak(false);
    setShowSubtitles(true); // Auto-show subtitles
    stopSpeech(); // Stop any ongoing speech
    
    // Clear any existing typewriter effect
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }
    
    try {
      console.log('🤖 Sending question to AI...');
      console.log('📊 Nodes being sent:', nodes.length);
      console.log('📁 Node types:', nodes.map(n => ({ 
        id: n.id, 
        label: n.data?.label, 
        type: n.data?.nodeType || 'NONE' 
      })).slice(0, 10));
      
      // Call the backend API to get AI response
      const aiResponse = await askCodebase(question, repoUrl, nodes, edges);
      const answer = aiResponse.answer;
      
      setResponse(answer);
      setIsLoading(false);
      setCanSpeak(true); // Enable speech capability
      
      // Start typewriter effect only
      console.log('⌨️ Starting typewriter effect...');
      startTypewriterEffect(answer, () => {
        console.log('✅ Typewriter effect completed');
      });
      
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage = 'Sorry, there was an error processing your question. Please try again.';
      setResponse(errorMessage);
      setDisplayedText(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
      setCanSpeak(false);
    }
  };

  const toggleSpeech = async () => {
    if (!response || !canSpeak) return;
    
    if (isPlaying) {
      // Stop speech
      stopSpeech();
      setIsPlaying(false);
      console.log('🔇 Speech stopped by user');
    } else {
      // Start speech
      setIsPlaying(true);
      console.log('🔊 Starting speech...');
      
      try {
        await speakText(response);
        console.log('✅ Speech completed successfully');
        setIsPlaying(false);
      } catch (speechError) {
        console.error('❌ Speech error:', speechError);
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="codebase-assistant-section">
      <div className="assistant-header">
        <h3 className="assistant-title">
          🤖 Codebase Assistant
        </h3>
        <p className="assistant-subtitle">
          Ask questions about the codebase and get accurate answers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="question-form">
        <div className="input-container">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about files, functions, or the overall codebase..."
            className="question-input"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="ask-button"
            disabled={isLoading || !question.trim() || !repoUrl}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              '❓'
            )}
            Ask
          </button>
        </div>
      </form>

      {response && (
        <div className="response-container">
          <div className="response-header">
            <h4>
              Codebase Assistant 
              {isPlaying && <span className="speaking-indicator">🔊 Speaking...</span>}
              {isTyping && <span className="typing-indicator">⌨️ Typing...</span>}
            </h4>
            <div className="response-controls">
              <button 
                onClick={() => setShowSubtitles(!showSubtitles)}
                className="subtitles-button"
              >
                {showSubtitles ? '📝 Hide Text' : '📝 Show Text'}
              </button>
              {canSpeak && (
                <button 
                  onClick={toggleSpeech}
                  className={`speech-toggle-button ${isPlaying ? 'stop' : 'play'}`}
                >
                  {isPlaying ? '🔇 Stop Speaking' : '🔊 Start Speaking'}
                </button>
              )}
            </div>
          </div>
          
          {showSubtitles && (
            <div className="response-text">
              {displayedText}
              {isTyping && <span className="typing-cursor">|</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodebaseAssistant;
