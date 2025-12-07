import React, { ReactElement } from 'react';

export function ResolutionHint(): ReactElement {
  return (
    <div
      id="resolution-hint"
      className="hidden"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        background: `rgba(0,0,0,0.6)`,
        color: 'white',
        fontFamily: 'monospace',
        padding: '4px 8px',
        zIndex: 1000,
      }}
    >
      {`${window.innerWidth} x ${window.innerHeight}`}
    </div>
  );
}
