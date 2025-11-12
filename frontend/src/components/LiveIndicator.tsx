// frontend/src/components/LiveIndicator.tsx
import { useState, useEffect } from 'react';

export const LiveIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(v => !v);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
      <div className={`w-2 h-2 rounded-full bg-green-500 ${isVisible ? 'opacity-100' : 'opacity-30'}`}></div>
      <span className="font-medium">Live Data</span>
    </div>
  );
};