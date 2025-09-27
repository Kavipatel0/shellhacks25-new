import React from 'react';

const PieChart = ({ data, size = 80 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#666' }}>
        No Data
      </div>
    );
  }

  let cumulativePercentage = 0;
  
  const segments = data.map((item, index) => {
    const startAngle = cumulativePercentage * 3.6; // Convert percentage to degrees
    const endAngle = (cumulativePercentage + item.percentage) * 3.6;
    cumulativePercentage += item.percentage;
    
    const radius = size / 2 - 2;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Create SVG path for pie slice
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = item.percentage > 50 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return {
      path: pathData,
      color: item.color,
      percentage: item.percentage,
      language: item.language
    };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'center' }}>
      <div style={{ flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              stroke="#fff"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
      
      <div style={{ fontSize: '12px', lineHeight: '1.4', flex: 1, minWidth: '120px' }}>
        {data.slice(0, 3).map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: item.color,
                flexShrink: 0
              }} 
            />
            <span style={{ color: '#000', fontWeight: '500', whiteSpace: 'nowrap' }}>
              {item.language} {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
        {data.length > 3 && (
          <div style={{ color: '#666', fontSize: '10px', marginTop: '4px' }}>
            +{data.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;
