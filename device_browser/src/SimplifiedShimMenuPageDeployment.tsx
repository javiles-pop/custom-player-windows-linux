import React, { useState, useEffect } from 'react';
import ShimMenuHeader from '@core/GUI/components/ShimMenu/ShimMenuHeader';
import { onMount } from '@core/GUI/hooks/onMount';

// Simplified deployment page that just displays the current channel URL
export default function SimplifiedShimMenuPageDeployment() {
  const [channelURL, setChannelURL] = useState('');

  useEffect(() => {
    // Listen for shadow updates
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHADOW_UPDATE' && event.data.CurrentURL) {
        setChannelURL(event.data.CurrentURL);
      }
    };

    window.addEventListener('message', handleMessage);
    window.postMessage({ type: 'REQUEST_CHANNEL_URL' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  onMount(() => {
    const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
    backButton?.focus();
  });

  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Channel" />
      <section className="shim-menu-deployment menu-container">
        <div style={{ padding: '20px' }}>
          <h3>Current Channel URL:</h3>
          <p style={{ wordBreak: 'break-all', marginTop: '10px' }}>
            {channelURL || 'No URL configured'}
          </p>
        </div>
      </section>
    </>
  );
}
