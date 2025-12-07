import React, { ReactElement } from 'react';
import Spinner from '../Spinner';

export function Initializing(): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          position: 'fixed',
          width: '100vw',
          left: '-50vw',
          transform: 'translateX(50vw)',
          top: '40vh',
        }}
      >
        Waiting for Network...
      </h2>
      <Spinner hexColor="#fff" size={24} />
    </div>
  );
}
