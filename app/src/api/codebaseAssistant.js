/**
 * API service for codebase assistant
 */

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:8000"
  : "https://shellhacks25-backend.vercel.app";

// Global reference to current audio for stopping
let currentAudio = null;

/**
 * Ask a question about the codebase
 * @param {string} question - The user's question
 * @param {string} repoUrl - The repository URL
 * @param {Array} nodes - Repository nodes
 * @param {Array} edges - Repository edges
 * @returns {Promise<Object>} The AI response
 */
export async function askCodebase(question, repoUrl, nodes, edges) {
  try {
    console.log('🤖 Sending codebase question to API...');
    console.log('📡 API URL:', `${API_BASE_URL}/ask-codebase`);
    console.log('❓ Question:', question);
    
    const response = await fetch(`${API_BASE_URL}/ask-codebase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        repoUrl,
        nodes,
        edges,
      }),
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error data:', errorData);
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ AI response received:', result);
    return result;
  } catch (error) {
    console.error("Error asking codebase question:", error);
    throw error;
  }
}

/**
 * Convert text to speech using ElevenLabs API
 * @param {string} text - Text to convert to speech
 * @returns {Promise<void>}
 */
export async function speakText(text) {
  try {
    console.log('🔊 Requesting ElevenLabs natural voice synthesis...');
    
    // Call backend to synthesize voice with ElevenLabs
    const response = await fetch(`${API_BASE_URL}/synthesize-voice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ ElevenLabs voice synthesis completed');
    
    // Convert base64 audio to blob and play
    const audioBytes = atob(result.audio_base64);
    const audioArray = new Uint8Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
      audioArray[i] = audioBytes.charCodeAt(i);
    }
    
    const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      // Store reference for stopping
      currentAudio = audio;
      
      audio.onended = () => {
        console.log('🔊 ElevenLabs audio playback completed');
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        reject(new Error('Audio playback failed'));
      };
      
      audio.onloadstart = () => {
        console.log('🔊 ElevenLabs audio playback started');
      };
      
      // Handle manual stopping
      audio.onstop = () => {
        console.log('🔇 ElevenLabs audio manually stopped');
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        resolve();
      };
      
      audio.play().catch(reject);
    });
    
  } catch (error) {
    console.error("Error with ElevenLabs voice synthesis:", error);
    
    // Fallback to enhanced browser TTS if ElevenLabs fails
    console.log('🔄 Falling back to enhanced browser TTS...');
    return enhancedWebSpeech(text);
  }
}

/**
 * Enhanced browser Web Speech API with better voice selection
 * @param {string} text - Text to convert to speech
 * @returns {Promise<void>}
 */
function enhancedWebSpeech(text) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Enhanced voice selection for better quality
    const voices = window.speechSynthesis.getVoices();
    
    // Priority order: Google voices > Microsoft voices > Apple voices > Others
    const preferredVoice = voices.find(voice => 
      (voice.name.includes('Google') && voice.lang.startsWith('en')) ||
      (voice.name.includes('Microsoft') && voice.lang.startsWith('en')) ||
      (voice.name.includes('Samantha') && voice.lang.startsWith('en')) ||
      (voice.name.includes('Alex') && voice.lang.startsWith('en')) ||
      (voice.name.includes('Karen') && voice.lang.startsWith('en')) ||
      (voice.name.includes('Daniel') && voice.lang.startsWith('en'))
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`🎤 Using voice: ${preferredVoice.name}`);
    }
    
    // Optimized settings for better speech quality
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = 1.0; // Full volume
    
    utterance.onend = () => {
      console.log('🔊 Enhanced speech synthesis completed');
      currentAudio = null; // Clear reference when done
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('❌ Enhanced speech synthesis error:', event.error);
      currentAudio = null; // Clear reference on error
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    utterance.onstart = () => {
      console.log('🔊 Enhanced speech synthesis started');
    };

    // Store reference for stopping (use utterance as reference for browser TTS)
    currentAudio = { type: 'tts', utterance };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop any ongoing speech synthesis (ElevenLabs or browser TTS)
 */
export function stopSpeech() {
  if (currentAudio) {
    if (currentAudio.type === 'tts') {
      // Stop browser TTS
      window.speechSynthesis.cancel();
      console.log('🔇 Browser speech synthesis stopped');
    } else {
      // Stop ElevenLabs audio
      currentAudio.pause();
      currentAudio.currentTime = 0;
      console.log('🔇 ElevenLabs audio stopped');
    }
    currentAudio = null;
  } else {
    // Fallback: stop any browser TTS that might be running
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log('🔇 Fallback: Browser speech synthesis stopped');
    }
  }
}
