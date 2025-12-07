import React, { ReactNode, type ReactElement } from 'react';

interface TabPanelProps {
  value: number;
  children: ReactNode;
  index: number;
}

export function TabPanel({ value, children, index }: TabPanelProps): ReactElement | null {
  return value === index ? <div className="tab-panel">{children}</div> : null;
}
