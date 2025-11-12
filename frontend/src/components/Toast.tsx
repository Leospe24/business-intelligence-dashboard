// frontend/src/components/Toast.tsx
import React from 'react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ type, text, visible }) => {
  if (!visible) return null;

  const baseClasses = "fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white font-semibold transition-all duration-300 z-50 max-w-sm backdrop-blur-sm";
  const typeClasses = {
    success: "bg-green-500 dark:bg-green-600 border border-green-600 dark:border-green-700",
    error: "bg-red-600 dark:bg-red-700 border border-red-700 dark:border-red-800", 
    info: "bg-blue-500 dark:bg-blue-600 border border-blue-600 dark:border-blue-700",
    warning: "bg-yellow-500 dark:bg-yellow-600 border border-yellow-600 dark:border-yellow-700 text-gray-900 dark:text-gray-100"
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <div className="flex items-center space-x-2">
        <span>{icons[type]}</span>
        <span>{text}</span>
      </div>
    </div>
  );
};