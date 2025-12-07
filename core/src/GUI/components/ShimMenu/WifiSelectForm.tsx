import { UIColor } from '@core/constants';
import { RootState } from '@core/createStore';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '../Button';
import Dropdown from '../Dropdown';
import Spinner from '../Spinner';
import TextInputField from '../TextInputField';

interface WifiSelectFormProps {
  usingWifi: boolean;
  allowDisconnect?: boolean;
}

export default function WifiSelectForm({ usingWifi, allowDisconnect = true }: WifiSelectFormProps) {
  const preferredWifiNetwork = useSelector((state: RootState) => state.deviceState.preferredWifiNetwork);
  const [essId, setSSID] = useState(preferredWifiNetwork ?? '');
  const [hiddenSSID, setHiddenSSID] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [networks, setNetworks] = useState<{ ssid: string; signal: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedNetworks, setHasLoadedNetworks] = useState(false);
  const activeInterface = useSelector((state: RootState) => state.deviceState.activeNetworkInterface);
  const deviceConnected = useSelector((state: RootState) => state.deviceState.deviceConnected);
  const [isUsingHiddenNetwork, setIsUsingHiddenNetwork] = useState(false);
  const [placeholder, setPlaceholder] = useState('');

  // scan for networks
  useEffect(() => {
    if (usingWifi && !networks.length && !hasLoadedNetworks && !isLoading) {
      setIsLoading(true);
      window.DeviceAPI.scanNetworks().then((networks) => {
        console.log(networks);

        setNetworks([{ ssid: 'Other...', signal: 0 }, ...networks].filter((n) => n.ssid.length > 0));
        setIsLoading(false);
        setHasLoadedNetworks(true);
      });
    }
  }, [networks, hasLoadedNetworks, isLoading, usingWifi]);

  // get wifi status / SSID
  useEffect(() => {
    if (activeInterface === 'wifi' && deviceConnected) {
      window.DeviceAPI.getWifiStatus().then((status) => {
        setSSID(status.ssid);
        setPlaceholder('········');
      });
    }

    // return () => controller.abort();
  }, [activeInterface, deviceConnected]);

  const onConnectPress = useCallback(async () => {
    if (isUsingHiddenNetwork) {
      await window.DeviceAPI.connectToWifiNetwork(hiddenSSID, passphrase);
    } else {
      await window.DeviceAPI.connectToWifiNetwork(essId, passphrase);
    }
  }, [essId, hiddenSSID, isUsingHiddenNetwork, passphrase]);

  const onDisconnectPress = useCallback(async () => {
    await window.DeviceAPI.disableWifi();
  }, []);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Dropdown
          id="network-dropdown"
          defaultOption="Select Network"
          disabled={isLoading}
          options={networks.map((network) => ({ value: network.ssid, signal: network.signal }))}
          onChange={(selectedOption) => {
            setIsUsingHiddenNetwork(selectedOption === 'Other...');
            setSSID(selectedOption);
          }}
          selection={essId}
        />
        {isLoading && <Spinner size={40} hexColor="var(--purple)" className="standalone-spinner wifi-spinner" />}
      </div>

      {isUsingHiddenNetwork ? (
        <TextInputField
          name="Network Name"
          id="wifi-name"
          value={hiddenSSID}
          onChange={(e) => {
            setHiddenSSID(e.target.value);
          }}
        />
      ) : null}

      {usingWifi ? (
        <TextInputField
          name="Password"
          id="wifi-password"
          value={passphrase}
          type="password"
          placeholder={placeholder}
          onChange={(e) => {
            setPassphrase(e.target.value);
          }}
        />
      ) : null}

      <Button
        id="wifi-save"
        onClick={onConnectPress}
        disabled={(!isUsingHiddenNetwork && !essId?.length) || passphrase?.length < 8}
        color={UIColor.Purple}
      >
        Connect
      </Button>

      {allowDisconnect ? (
        <Button id="wifi-save" onClick={onDisconnectPress} color={UIColor.Grey_med}>
          Disconnect
        </Button>
      ) : null}
    </>
  );
}
