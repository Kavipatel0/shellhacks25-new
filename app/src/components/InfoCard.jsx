import React from 'react';

// Information Card component with inline styles for better compatibility
function InfoCard({ title, subtitle, icon, color, stats, customContent }) {
  const cardStyle = {
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    width: '100%',
    height: '280px', // Fixed height for all cards
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    padding: '16px',
    color: 'white',
    background: color.includes('gradient') ? 
      'linear-gradient(to right, #3b82f6, #8b5cf6)' : color,
    flexShrink: 0 // Prevent header from shrinking
  };

  const statsStyle = {
    padding: '16px',
    backgroundColor: '#ffffff',
    flex: 1, // Take remaining space
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '8px 0 4px 0' }}>{title}</h3>
        <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>{subtitle}</p>
      </div>
      {customContent ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {customContent}
        </div>
      ) : (
        <div style={statsStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            {stats.map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', color: '#000' }}>{stat.value}</p>
                <p style={{ margin: 0, color: '#666' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoCard;
