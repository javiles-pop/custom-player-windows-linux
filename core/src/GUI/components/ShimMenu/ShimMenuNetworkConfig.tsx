import React, { ReactElement, useCallback, useState } from 'react';
import WifiSelectForm from './WifiSelectForm';
import Toggle from '../Toggle';
import { RootState } from '@core/createStore';
import { useSelector } from 'react-redux';
import ProxySection from './ShimMenuSectionProxy';
import { checkWifiCardPresence } from '@core/Util/isOnline';
import { useToast } from '@core/context/ToastProvider';
import { TCPIPConfigSection } from './SectionIPConfig';
import { onMount } from '@core/GUI/hooks/onMount';

export function ShimMenuNetworkConfig(): ReactElement {
  const activeInterface = useSelector((state: RootState) => state.deviceState.activeNetworkInterface);
  const [usingWifi, setUsingWifi] = useState(activeInterface === 'wifi');
  const addToast = useToast();

  onMount(() => {
    window.DeviceAPI.getActiveNetworkInterface().then((interfaceName) => {
      if (interfaceName === 'wlan0') {
        setUsingWifi(true);
      }
    });
  });

  const onInterfaceToggle = useCallback(async () => {
    if (!usingWifi) {
      const wifiPresent = await checkWifiCardPresence();
      if (!wifiPresent) {
        addToast({
          title: 'No Wi-Fi card detected',
          type: 'error',
          description: 'Your device may not include wireless capabilities',
        });
        setUsingWifi(false);
        return;
      }
    }
    setUsingWifi(!usingWifi);
  }, [addToast, usingWifi]);

  return (
    // <div className="network-config-modal">
    <>
      <section id="WifiForm" className="wifi-section">
        <h4>Network Interface</h4>
        <Toggle
          falseName="Ethernet"
          trueName="Wi-Fi"
          checked={usingWifi}
          name=""
          id="ethernet-toggle"
          onChange={onInterfaceToggle}
        />

        {usingWifi ? <WifiSelectForm usingWifi={usingWifi} /> : null}
      </section>

      {window.DeviceAPI.supportsTCPConfig ? <TCPIPConfigSection /> : null}

      <ProxySection />
    </>
  );
}
