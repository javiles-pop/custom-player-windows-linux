import React, { ReactElement, ReactNode } from 'react';

interface ToastContainerProps {
  children: ReactNode;
}

export function ToastContainer({ children }: ToastContainerProps): ReactElement {
  return <div className="toastContainer">{children}</div>;
}
