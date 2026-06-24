import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 bg-muted rounded-xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    </div>
  );
};

export default LoadingSkeleton;
