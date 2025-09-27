import React, { useState, useEffect } from 'react';
import InfoCard from './InfoCard';
import PieChart from './PieChart';
import { getTechStack, getLanguageStats, getRepositoryStats } from '../api/githubStats';

// GitHub-style icons
const StarIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const ForkIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 2c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h6v-2H6V4h6V2H6zm10 2c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2zm0 2h2v14h-2V6z"/>
  </svg>
);

// Tech stack icon
const TechIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
  </svg>
);

// Languages icon
const LanguageIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
  </svg>
);

// GitHub stats icon
const GitHubIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default function InfoCardsSection({ nodes = [], edges = [], repoUrl = "" }) {
  const [techStack, setTechStack] = useState({ frontend: [], backend: [], tools: [] });
  const [languages, setLanguages] = useState([]);
  const [repoStats, setRepoStats] = useState({ stars: 0, forks: 0, pullRequests: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch data when repoUrl changes
  useEffect(() => {
    if (repoUrl && nodes.length > 0) {
      setLoading(true);
      
      const fetchData = async () => {
        try {
          const [techStackData, languageData, statsData] = await Promise.all([
            getTechStack(repoUrl, nodes),
            getLanguageStats(repoUrl),
            getRepositoryStats(repoUrl)
          ]);
          
          setTechStack(techStackData);
          setLanguages(languageData);
          setRepoStats(statsData);
        } catch (error) {
          console.error('Error fetching repository data:', error);
          // Set default values on error
          setTechStack({ frontend: ['JavaScript'], backend: ['Node.js'], tools: ['Package.json'] });
          setLanguages([{ language: 'JavaScript', percentage: 100, color: '#f7df1e' }]);
          setRepoStats({ stars: 0, forks: 0, pullRequests: 0 });
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [repoUrl, nodes]);

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '2rem',
    flexWrap: 'nowrap', // Changed to nowrap to keep all in one row
    marginBottom: '32px',
    padding: '2rem',
    overflowX: 'auto', // Allow horizontal scrolling on small screens
    background: '#2d2d2d',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const cardWrapperStyle = {
    flex: '1', // Allow cards to grow and fill available space
    maxWidth: '350px', // Maximum width to prevent cards from getting too wide
    minWidth: '280px' // Minimum width to ensure readability
  };

  // Format tech stack for display
  const formatTechStack = (stack) => {
    const all = [...stack.frontend, ...stack.backend, ...stack.tools];
    return all.slice(0, 3).map(tech => ({ value: tech, label: "" }));
  };

  return (
    <div style={containerStyle}>
      {/* Tech Stack Card */}
      <div style={cardWrapperStyle}>
        <InfoCard
          title="Tech Stack"
          subtitle="Technologies Used"
          icon={<TechIcon />}
          color="linear-gradient(to right, #3b82f6, #8b5cf6)"
          stats={formatTechStack(techStack)}
          customContent={
            <div style={{ padding: '16px', backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                <strong>Frontend:</strong> {techStack.frontend.join(', ') || 'None detected'}
              </div>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                <strong>Backend:</strong> {techStack.backend.join(', ') || 'None detected'}
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                <strong>Tools:</strong> {techStack.tools.join(', ') || 'None detected'}
              </div>
            </div>
          }
        />
      </div>
      
      {/* Languages Card */}
      <div style={cardWrapperStyle}>
        <InfoCard
          title="Languages"
          subtitle="Code Distribution"
          icon={<LanguageIcon />}
          color="linear-gradient(to right, #10b981, #14b8a6)"
          stats={languages.slice(0, 3).map(lang => ({ 
            value: `${lang.percentage.toFixed(1)}%`, 
            label: lang.language 
          }))}
          customContent={
            <div style={{ padding: '16px', backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <PieChart data={languages} size={100} />
            </div>
          }
        />
      </div>
      
      {/* GitHub Stats Card */}
      <div style={cardWrapperStyle}>
        <InfoCard
          title="GitHub Stats"
          subtitle="Repository Metrics"
          icon={<GitHubIcon />}
          color="linear-gradient(to right, #f59e0b, #ef4444)"
          stats={[
            { value: repoStats.stars, label: "Stars" },
            { value: repoStats.forks, label: "Forks" },
            { value: repoStats.pullRequests, label: "Pull Requests" }
          ]}
          customContent={
            <div style={{ padding: '16px', backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {loading ? (
                <div style={{ fontSize: '14px', color: '#374151', textAlign: 'center' }}>
                  Loading stats...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⭐</span>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      <strong>{repoStats.starsFormatted || repoStats.stars}</strong> stars
                    </span>
                  </div>
                  
                  {/* Watching */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>👁️</span>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      <strong>{repoStats.watchersFormatted || repoStats.watchers}</strong> watching
                    </span>
                  </div>
                  
                  {/* Forks */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🍴</span>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      <strong>{repoStats.forksFormatted || repoStats.forks}</strong> forks
                    </span>
                  </div>
                  

                </div>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
