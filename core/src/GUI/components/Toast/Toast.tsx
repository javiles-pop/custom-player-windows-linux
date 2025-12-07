import classNames from 'classnames';
import React from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function Toast({ title, description, type }: Toast) {
  return (
    <div className={classNames(['toast', type])}>
      <div className="inner-container">
        <span className="title">{title}</span>
        {description && <span className="description">{description}</span>}
      </div>
    </div>
  );
}
