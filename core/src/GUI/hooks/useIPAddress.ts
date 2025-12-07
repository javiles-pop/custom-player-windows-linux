import { RootState } from '@core/createStore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export function useIPAddress() {
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const { deviceConnected, deviceOnline } = useSelector((state: RootState) => state.deviceState);
  // get ip and MAC addresses
  useEffect(() => {
    window.DeviceAPI.getIPAddress().then((ip) => {
      setIpAddress(ip);
    });

    window.DeviceAPI.getMACAddress().then((mac) => {
      setMacAddress(mac);
    });
  }, [deviceConnected, deviceOnline]);

  return { ipAddress, macAddress };
}
