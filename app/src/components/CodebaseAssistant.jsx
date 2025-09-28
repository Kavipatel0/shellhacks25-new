import React, { useState, useEffect } from 'react';
import { askCodebase, speakText, stopSpeech } from '../api/codebaseAssistant';

const CodebaseAssistant = ({ repoUrl, nodes = [], edges = [] }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true); // Auto-show subtitles

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 CodebaseAssistant unmounting - stopping any ongoing speech');
      stopSpeech();
      setIsPlaying(false);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !repoUrl) return;

    setIsLoading(true);
    setResponse('');
    setShowSubtitles(true); // Auto-show subtitles
    stopSpeech(); // Stop any ongoing speech
    
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
      
      // Automatically start speaking the response
      console.log('🔊 Starting automatic speech...');
      setIsPlaying(true);
      
      try {
        await speakText(answer);
        console.log('✅ Speech completed successfully');
        setIsPlaying(false);
      } catch (speechError) {
        console.error('❌ Speech error:', speechError);
        setIsPlaying(false);
        // Continue even if speech fails
      }
      
    } catch (error) {
      console.error('Error getting response:', error);
      setResponse('Sorry, there was an error processing your question. Please try again.');
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handlePlayAudio = () => {
    if (!response) return;
    
    setIsPlaying(true);
    // TODO: Integrate with ElevenLabs TTS
    console.log('🔊 Playing audio for:', response);
    
    // Simulate audio playback
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
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
            {isLoading ? '🤔' : '❓'}
            Ask
          </button>
        </div>
      </form>

      {response && (
        <div className="response-container">
          <div className="response-header">
            <h4>
              Codebase Assistant {isPlaying && <span className="speaking-indicator">🔊 Speaking...</span>}
            </h4>
            <div className="response-controls">
              <button 
                onClick={() => setShowSubtitles(!showSubtitles)}
                className="subtitles-button"
              >
                {showSubtitles ? '📝 Hide Text' : '📝 Show Text'}
              </button>
              {isPlaying && (
                <button 
                  onClick={() => { 
                    stopSpeech(); 
                    setIsPlaying(false);
                    console.log('🔇 Stop button clicked - speech stopped');
                  }}
                  className="stop-button"
                >
                  🔇 Stop
                </button>
              )}
            </div>
          </div>
          
          {showSubtitles && (
            <div className="response-text">
              {response}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodebaseAssistant;
