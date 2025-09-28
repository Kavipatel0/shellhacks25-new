import React, { useState, useRef, useEffect } from 'react';

export default function CommitHistoryDropdown({ commits, onCommitSelect, isLoading = false, currentCommit = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const dropdownRef = useRef(null);

  // Debug logging
  console.log('CommitHistoryDropdown props:', { 
    commits: commits?.length || 0, 
    isLoading,
    currentCommit,
    commitsData: commits 
  });

  // Update selectedCommit when currentCommit prop changes
  useEffect(() => {
    if (currentCommit) {
      setSelectedCommit(currentCommit);
    }
  }, [currentCommit]);


  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCommitClick = (commit) => {
    setSelectedCommit(commit);
    setIsOpen(false);
    if (onCommitSelect) {
      onCommitSelect(commit);
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const formatCommitMessage = (message) => {
    // Truncate long messages
    return message.length > 60 ? message.substring(0, 60) + '...' : message;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="commit-history-dropdown" ref={dropdownRef}>
      <button
        className="commit-history-button"
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        <span className="button-text">
          {selectedCommit ? `${selectedCommit.shortSha}` : 'Commit History'}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="commit-history-list">
          <div className="commit-list-header">
            <h4>Commit History (Last 100)</h4>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          <div className="commit-list-scrollable">
            {isLoading ? (
              <div className="loading-commits">
                <div className="spinner"></div>
                <span>Loading commits...</span>
              </div>
            ) : commits && commits.length > 0 ? (
              commits.map((commit) => (
                <div
                  key={commit.sha}
                  className={`commit-item ${selectedCommit?.sha === commit.sha ? 'selected' : ''}`}
                  onClick={() => handleCommitClick(commit)}
                >
                  <div className="commit-sha">{commit.shortSha}</div>
                  <div className="commit-message" title={commit.message}>
                    {formatCommitMessage(commit.message)}
                  </div>
                  <div className="commit-meta">
                    <span className="commit-author">{commit.author}</span>
                    <span className="commit-date">{formatDate(commit.fullDate)}</span>
                  </div>
                  {commit.html_url && (
                    <div className="commit-actions">
                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="commit-github-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on GitHub
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-commits">
                <span>No commits found</span>
                <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                  This might be due to:
                  <ul style={{ marginTop: '4px', paddingLeft: '16px' }}>
                    <li>GitHub API rate limiting (add a token to .env)</li>
                    <li>Repository access restrictions</li>
                    <li>Network connectivity issues</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
