import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setVisible(true);

    const timer = setTimeout(() => {
      // Animate out
      setVisible(false);
      // Call onClose after animation finishes
      setTimeout(onClose, 300); 
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-md shadow-lg bg-slate-800 text-white transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <Icon type="check" className="w-5 h-5 text-green-400" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};