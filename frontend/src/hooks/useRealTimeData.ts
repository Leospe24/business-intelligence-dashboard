// frontend/src/hooks/useRealTimeData.ts
import { useState, useEffect } from 'react';
import type { DashboardMetric } from '../Dashboard';

export const useRealTimeData = (initialData: DashboardMetric[]) => {
  const [liveData, setLiveData] = useState<DashboardMetric[]>(initialData);

  useEffect(() => {
    if (!initialData || initialData.length === 0) return;

    // Simulate real-time updates every 8 seconds
    const interval = setInterval(() => {
      setLiveData(prevData => {
        if (!prevData || prevData.length === 0) return prevData;
        
        return prevData.map((item) => ({
          ...item,
          // Add small random fluctuations to make it feel "live"
          revenue: `$${(parseFloat(item.revenue.replace(/[^0-9.-]+/g, "")) * 
            (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)}`,
          profit: `$${(parseFloat(item.profit.replace(/[^0-9.-]+/g, "")) * 
            (1 + (Math.random() * 0.08 - 0.04))).toFixed(2)}`,
          units_sold: Math.max(1, Math.floor(
            item.units_sold * (1 + (Math.random() * 0.05 - 0.025))
          ))
        }));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [initialData]);

  return liveData;
};