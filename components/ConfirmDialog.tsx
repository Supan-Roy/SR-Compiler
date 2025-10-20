import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-500 text-white",
}) => {
  // Prevent clicks inside the modal from closing it
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel} // Close on overlay click
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-200 dark:border-slate-700 max-w-sm w-full mx-4"
        onClick={handleDialogClick}
      >
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 mt-2 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};