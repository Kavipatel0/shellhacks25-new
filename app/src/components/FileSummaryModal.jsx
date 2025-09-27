import React, { useState, useEffect } from 'react';

const FileSummaryModal = ({ isOpen, onClose, fileSummary, isLoading }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const parseSummary = (summary) => {
    if (!summary) return { purpose: '', relationships: [] };
    
    const purposeMatch = summary.match(/\*\*File Purpose:\*\*\s*([^*]+)/);
    const relationshipsMatch = summary.match(/\*\*Codebase Relationships:\*\*([\s\S]*?)(?:\*\*|$)/);
    
    const purpose = purposeMatch ? purposeMatch[1].trim() : '';
    const relationshipsText = relationshipsMatch ? relationshipsMatch[1] : '';
    
    const relationships = relationshipsText
      .split('\n')
      .filter(line => line.trim().startsWith('•'))
      .map(line => line.replace('•', '').trim())
      .filter(item => item.length > 0);

    return { purpose, relationships };
  };

  useEffect(() => {
    if (fileSummary && !isLoading) {
      setIsTyping(true);
      setDisplayedText('');
      setCurrentIndex(0);
    } else {
      setIsTyping(false);
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [fileSummary, isLoading]);

  useEffect(() => {
    if (isTyping && fileSummary?.summary) {
      const { purpose } = parseSummary(fileSummary.summary);
      const textToType = purpose;
      
      if (currentIndex < textToType.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + textToType[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, 15);

        return () => clearTimeout(timeout);
      } else {
        setIsTyping(false);
      }
    }
  }, [currentIndex, fileSummary, isTyping]);

  if (!isOpen) return null;

  const { purpose, relationships } = parseSummary(fileSummary?.summary);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        maxWidth: '896px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'hidden',
        border: '1px solid #f3f4f6'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #2563eb 100%)',
          padding: '32px',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                backdropFilter: 'blur(4px)'
              }}>
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  {isLoading ? 'Analyzing File...' : fileSummary?.fileName}
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px'
                }}>
                  {fileSummary?.fileType && (
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '9999px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {fileSummary.fileType}
                    </span>
                  )}
                  <span style={{
                    color: '#dbeafe',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <svg width="16" height="16" style={{ marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Analysis - Powered by Gemini AI
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                borderRadius: '12px',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '32px',
          overflowY: 'auto',
          maxHeight: '65vh'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 0',
              gap: '24px'
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  border: '4px solid #dbeafe',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="32" height="32" style={{
                    color: '#3b82f6',
                    animation: 'pulse 2s infinite'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>AI is analyzing your file...</h3>
                <p style={{
                  color: '#6b7280',
                  margin: 0
                }}>Understanding code structure and relationships</p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '16px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s ease-in-out infinite',
                    animationDelay: '0.1s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s ease-in-out infinite',
                    animationDelay: '0.2s'
                  }}></div>
                </div>
              </div>
            </div>
          ) : fileSummary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* File Purpose Section */}
              {purpose && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      padding: '8px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '8px'
                    }}>
                      <svg width="20" height="20" style={{ color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0
                    }}>File Purpose</h3>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #dbeafe'
                  }}>
                    <div style={{
                      color: '#374151',
                      lineHeight: '1.6',
                      fontSize: '16px',
                      textAlign: 'left'
                    }}>
                      {isTyping ? (
                        <>
                          {displayedText}
                          <span style={{
                            animation: 'pulse 1s infinite',
                            color: '#3b82f6'
                          }}>|</span>
                        </>
                      ) : (
                        purpose
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Codebase Relationships Section */}
              {relationships.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      padding: '8px',
                      backgroundColor: '#f3e8ff',
                      borderRadius: '8px'
                    }}>
                      <svg width="20" height="20" style={{ color: '#9333ea' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0
                    }}>Codebase Relationships</h3>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #e9d5ff'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {relationships.map((relationship, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '16px'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                            borderRadius: '50%',
                            marginTop: '12px',
                            flexShrink: 0,
                            transition: 'transform 0.2s'
                          }}></div>
                          <div style={{
                            color: '#374151',
                            lineHeight: '1.6',
                            fontSize: '16px',
                            flex: 1,
                            textAlign: 'left'
                          }}>
                            {relationship}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* File Path */}
              {fileSummary.filePath && (
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4b5563',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    margin: '0 0 12px 0'
                  }}>
                    <svg width="16" height="16" style={{ marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    File Path
                  </h4>
                  <code style={{
                    fontSize: '14px',
                    color: '#4b5563',
                    wordBreak: 'break-all',
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'monospace',
                    display: 'block'
                  }}>
                    {fileSummary.filePath}
                  </code>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '64px 0'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '50%',
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" style={{ color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p style={{
                color: '#6b7280',
                fontSize: '18px',
                margin: 0
              }}>No summary available</p>
            </div>
          )}
        </div>

        {/* Footer */}
      </div>
    </div>
  );
};

export default FileSummaryModal;