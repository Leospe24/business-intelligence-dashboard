// frontend/src/components/LazyChart.tsx
import { useState, useRef, useEffect } from 'react';

interface LazyChartProps {
  children: React.ReactNode;
  height?: number;
  placeholder?: React.ReactNode;
}

const LazyChart = ({ 
  children, 
  height = 400, 
  placeholder = <div className="bg-gray-100 rounded-lg animate-pulse" style={{ height: `${height}px` }} />
}: LazyChartProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {isVisible ? children : placeholder}
    </div>
  );
};

export default LazyChart;