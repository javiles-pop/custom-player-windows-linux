import classNames from 'classnames';
import React, { type ReactElement } from 'react';

interface TabsProps {
  tabNames: string[];
  onTabChange: (index: number) => void;
  activeTab: number;
}

export function Tabs({ tabNames, onTabChange, activeTab }: TabsProps): ReactElement {
  return (
    <div className="row gap-s">
      {tabNames.map((tabName, index) => (
        <button
          data-navigable
          key={tabName}
          className={classNames('tab', { active: activeTab === index })}
          onClick={() => onTabChange(index)}
        >
          {tabName}
        </button>
      ))}
    </div>
  );
}
