import React, { useCallback, useEffect, useState } from 'react';
import TextInputField from '../TextInputField';
import Dropdown from '../Dropdown';
import Button from '../Button';
import { UIColor } from '@core/constants';
import { isValidIPV4, Logger } from '@core/Util';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';

const DHCP = 'Using DHCP';
const MANUAL = 'Manually';
type ConfigType = 'Using DHCP' | 'Manually';

export function TCPIPConfigSection() {
  const [configMode, setConfigMode] = useState<ConfigType>(DHCP);
  const [staticIPAddress, setStaticIPAddress] = useState('');
  const [subnetMask, setSubnetMask] = useState('255.255.255.0');
  const [gateway, setGateway] = useState('');
  const [dnsServer, setDnsServer] = useState('');
  const [activeConfig, setActiveConfig] = useState<NetworkInterfaceConfig | null>(null);
  const [message, setMessage, ref] = useFeedbackMessage();

  useEffect(() => {
    const getConfig = async () => {
      Logger.info('[NETWORK] Getting current network config...');
      const config = await window.DeviceAPI.getNetworkConfig();
      console.log('[NETWORK] config', config);

      const ipList = config?.ipAddressList?.filter((ip: IPAddress) => ip.family === 'IPv4')[0];

      if (ipList?.address) {
        Logger.debug('[NETWORK] Custom configuration found');
        setConfigMode(MANUAL);
      }

      setActiveConfig(config);
      setSubnetMask(ipList?.netmask || '255.255.255.0');
      setStaticIPAddress(ipList?.address || '');
      setGateway(ipList?.gateway || '');
      setDnsServer(config?.dnsServerList?.join(',') || '');
    };

    if (!activeConfig) {
      getConfig();
    }
  }, [activeConfig]);

  const resetConfig = useCallback(async () => {
    await window.DeviceAPI.resetNetworkConfig();
    setConfigMode(DHCP);
    setActiveConfig(null);
    setDnsServer('');
    setMessage({ message: 'Configuration reset', color: UIColor.Success });
  }, [setMessage]);

  const onClickApplyConfig = useCallback(async () => {
    if (configMode === MANUAL) {
      try {
        validateConfig(staticIPAddress, subnetMask, gateway, dnsServer);
      } catch (error) {
        setMessage({ message: error.message, color: UIColor.Error });
        return;
      }
    } else {
      setStaticIPAddress('');
      setSubnetMask('');
      setGateway('');
    }

    const nextConfig = {
      enabledProtocolList: ['IPv4'],
      ipAddressList: staticIPAddress
        ? [
            {
              address: staticIPAddress,
              netmask: subnetMask,
              broadcast: calculateBroadcastAddress(staticIPAddress, subnetMask),
              gateway: gateway,
              family: 'IPv4',
            },
          ]
        : [],
      dnsServerList: dnsServer.length ? dnsServer.split(',').map((server) => server.trim()) : [],
    };

    console.log('[NETWORK] nextConfig', nextConfig);
    try {
      await window.DeviceAPI.setNetworkConfig(nextConfig);
      setMessage({ message: 'Network configuration applied', color: UIColor.Success });
    } catch (error) {
      setMessage({ message: error, color: UIColor.Error });
    }
  }, [configMode, staticIPAddress, subnetMask, gateway, dnsServer, setMessage]);

  return (
    <section className="indent">
      <h4>TCP/IP</h4>
      <label className="helper">Configure IPv4:</label>
      <Dropdown
        options={[{ value: DHCP }, { value: MANUAL }]}
        defaultOption={DHCP}
        id={'ip-mode'}
        selection={configMode}
        onChange={(option) => setConfigMode(option as ConfigType)}
      />

      {configMode === MANUAL ? (
        <>
          <TextInputField
            value={staticIPAddress}
            onChange={(e) => setStaticIPAddress(e.target.value)}
            name={'Static IP Address'}
            id={'staticIPAddress'}
          />

          <TextInputField
            value={subnetMask}
            onChange={(e) => setSubnetMask(e.target.value)}
            name={'Subnet Mask'}
            id={'subnetMask'}
          />

          <TextInputField
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
            name={'Gateway'}
            id={'gateway'}
          />
        </>
      ) : null}

      <TextInputField
        value={dnsServer}
        onChange={(e) => setDnsServer(e.target.value)}
        name={'DNS Servers'}
        id={'dnsServer'}
      />
      <p className="helper">Separate multiple entires with a comma</p>

      <Button id="apply-network-config" color={UIColor.Purple} onClick={onClickApplyConfig}>
        Apply
      </Button>

      <Button id="reset-network-config" color={UIColor.Grey_med} onClick={resetConfig}>
        Reset to Defaults
      </Button>

      <span className="user-feedback" ref={ref}>
        {message.message}
      </span>
    </section>
  );
}

function calculateBroadcastAddress(ip: string, mask: string) {
  const ipParts = ip.split('.').map(Number);
  const maskParts = mask.split('.').map(Number);

  if (ipParts.length !== 4 || maskParts.length !== 4) {
    return '';
  }
  // This is some dark magic, but it works. Not super readable, but it's the best way to calculate the broadcast address.
  const broadcastParts = ipParts.map((part, index) => part | (~maskParts[index] & 255));
  return broadcastParts.join('.');
}

function validateConfig(ip: string, mask: string, gateway: string, dns: string): boolean {
  if (!isValidIPV4(ip)) {
    throw new Error('Invalid Static IP');
  }
  if (!isValidIPV4(mask)) {
    throw new Error('Invalid subnet mask');
  }
  if (!isValidIPV4(gateway)) {
    throw new Error('Invalid gateway address');
  }

  if (calculateBroadcastAddress(ip, mask) === '') {
    throw new Error('Unable to apply config. Check IP and subnet mask.');
  }

  const dnsList = dns.split(',').map((server) => server.trim());
  for (const server of dnsList) {
    if (!isValidIPV4(server)) {
      throw new Error(`Invalid DNS server address: ${server}`);
    }
  }
  return true;
}
