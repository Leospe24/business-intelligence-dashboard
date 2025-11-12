// frontend/src/components/SkeletonLoader.tsx
import React from 'react';

export const SkeletonKPI = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
  </div>
);

export const SkeletonChart = ({ height = 400 }: { height?: number }) => (
  <div 
    className="bg-white p-4 rounded-xl shadow-lg animate-pulse" 
    style={{ height: `${height}px` }}
  >
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-full bg-gray-100 rounded-lg flex items-end space-x-2 p-4">
      {[...Array(8)].map((_, i) => (
        <div 
          key={i}
          className="flex-1 bg-gray-300 rounded-t"
          style={{ height: `${30 + Math.random() * 70}%` }}
        ></div>
      ))}
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="space-y-3">
      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 mb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
      {/* Table Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="h-4 bg-gray-100 rounded"
              style={{ 
                width: colIndex === 0 ? '80%' : 
                       colIndex === 5 ? '60%' : '100%' 
              }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonFilter = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg mb-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// For Analytics page
export const SkeletonMetricCard = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
  </div>
);