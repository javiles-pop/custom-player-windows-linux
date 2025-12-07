import React from 'react';
import ShimMenuHeader from './ShimMenuHeader';
import { useIPAddress } from '@core/GUI/hooks/useIPAddress';
import { ShimMenuNetworkConfig } from './ShimMenuNetworkConfig';
import { onMount } from '@core/GUI/hooks/onMount';
import { UIColor } from '@core/constants';
import Button from '../Button';

export default function Wifi() {
  const { macAddress, ipAddress } = useIPAddress();

  onMount(() => {
    const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
    backButton?.focus();
  });

  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Network Settings" />
      <div className="shim-menu-network menu-container">
        <ShimMenuNetworkConfig />

        <section>
          <h4>Details</h4>
          <div className="indent">
            <p>
              <span className="helper right w115">IP Address</span>
              <span>{ipAddress}</span>
            </p>
            <p>
              <span className="helper right w115">MAC Address</span>
              <span>{macAddress}</span>
            </p>
          </div>

          <Button
            id="network-page-back-to-top"
            color={UIColor.Purple}
            onClick={() => {
              document.querySelector('.menu-container')?.scrollTo(0, 0);
            }}
          >
            Back to Top
          </Button>
        </section>
      </div>
    </>
  );
}
