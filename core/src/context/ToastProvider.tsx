import { Toast } from '@core/GUI/components/Toast/Toast';
import { ToastContainer } from '@core/GUI/components/Toast/ToastContainer';
import React, { createContext, ReactNode, useContext, useState } from 'react';

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
}>({
  toasts: [],
  addToast: () => {
    return;
  },
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    // Add the new toast to the list
    setToasts([...toasts, { ...toast, id }]);

    // Remove the toast after 5 seconds
    setTimeout(() => {
      setToasts((toasts) => toasts.filter((t) => t.id !== id));
    }, 6000);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast {...toast} key={toast.id} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const { addToast } = useContext(ToastContext);
  return addToast;
};
