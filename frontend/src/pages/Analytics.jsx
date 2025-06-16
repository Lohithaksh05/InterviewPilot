import React from 'react';
import PerformanceAnalytics from '../components/PerformanceAnalytics';

const Analytics = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="container mx-auto px-4">
        <PerformanceAnalytics />
      </div>
    </div>
  );
};

export default Analytics;
