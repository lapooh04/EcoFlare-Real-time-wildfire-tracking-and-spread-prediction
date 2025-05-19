import React from 'react';
import dashboardImage from './images/real-time-disaster-monitoring-2025-04-02T04-43-47.094Z.jpg';

const SupersetDashboard = () => {
  return (
    <div style={{ 
      padding: '20px',
      textAlign: 'center'
    }}>
      <img 
        src={dashboardImage} 
        alt="Disaster Monitoring Dashboard" 
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          border: '1px solid #eee',
          borderRadius: '8px'
        }}
      />
    </div>
  );
};

export default SupersetDashboard;