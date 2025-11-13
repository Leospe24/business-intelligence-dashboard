// frontend/src/hooks/useRealTimeData.ts
import { useState, useEffect } from 'react';
import type { DashboardMetric } from '../Dashboard';

export const useRealTimeData = (initialData: DashboardMetric[]) => {
  // 1. Initialize internal state with the initial data prop
  const [liveData, setLiveData] = useState<DashboardMetric[]>(initialData);

  // 2. Synchronization Effect: Crucial fix for data loading on login/filter change.
  // When the parent component provides new data (new initialData reference), 
  // we reset our internal liveData state.
  useEffect(() => {
    // This is the clean, correct synchronization pattern.
    // It runs only when initialData (the prop) changes.
    setLiveData(initialData);
  }, [initialData]); // No longer requires 'liveData' dependency.
  
  // 3. Simulation Effect: Creates the real-time update loop.
  useEffect(() => {
    // Only start the interval if there is actual data
    if (!liveData || liveData.length === 0) return;

    // Simulate real-time updates every 8 seconds
    const interval = setInterval(() => {
      setLiveData(prevData => {
        if (!prevData || prevData.length === 0) return prevData;
        
        return prevData.map((item) => ({
          ...item,
          // Add small random fluctuations to make it feel "live"
          revenue: `$${(parseFloat(item.revenue.replace(/[^0-9.-]+/g, '')) * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)}`,
          profit: `$${(parseFloat(item.profit.replace(/[^0-9.-]+/g, '')) * (1 + (Math.random() * 0.08 - 0.04))).toFixed(2)}`,
          units_sold: Math.max(1, Math.floor(
            item.units_sold * (1 + (Math.random() * 0.05 - 0.025))
          ))
        }));
      });
    }, 8000);

    // Cleanup function: stop the interval when the component unmounts or dependencies change
    return () => clearInterval(interval);

  }, [liveData]); // liveData as dependency is CORRECT here for the interval logic

  // 4. Return the live data stream
  return liveData;
};