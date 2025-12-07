interface ShimMenuProps {
  active?: boolean;
  refs?: React.RefObject<HTMLInputElement>[];
}

interface ShimMenuHeaderProps {
  isChildPage?: boolean;
  childPageTitle?: string;
  signName?: string;
}

interface ShimMenuRowProps {
  name: string;
  iconPath: string;
  badged?: boolean;
  detailText: string;
  textColor?: string;
  onClickNavPath?: string;
}

interface ShimMenuState {
  path: string;
}
interface CPUGraphData {
  label: number | string;
  cpu: number;
}

interface RAMGraphData {
  name: string;
  value: number;
}

interface DiskGraphData {
  name: string;
  value: number;
}

interface NetworkInterfaceConfig {
  metric: number; // The routing metric for the default gateway on the interface. Routes with lower metrics are preferred over routes with higher metrics.
  dhcpServerConfig: DHCPServerConfig;
  dnsServerList: string[]; // A string list containing a maximum of three DNS servers
  ipAddressList: IPAddress[];
  inboundShaperRate?: number; // The bandwidth limit for inbound traffic in bits per second. If undefined, there is no bandwidth limit.
  // Note: Because of overhead on the shaping algorithm, attempting to limit the bandwidth at rates greater than approximately 2Mbit/s will reduce speeds to less than the specified rate.
  mtu?: number; // The maximum transmission unit (MTU) for the network interface in bytes. If not specified an appropriate mtu value will be chosen automatically.
  vlanIdList: number[]; // A list of VLAN IDs that this network interface is the parent for.
  clientIdentifier: string; // The DHCP client identifier for the network interface
  domain: string; // The domain name for the network interface
  enabledProtocolList?: string[]; // enabled IP protocols. The default value is [IPv4, IPv6].
  // WIFI CONFIG ONLY
  essId?: string; // The WiFi ESSId network name
  passphrase?: boolean;
}

interface IPAddress {
  family: string; // The IP configuration (must be set to IPv4).
  address: string; // The IP4 address. This a string dotted decimal quad, for example "192.168.1.42".
  netmask: string; // The IP4 netmask. This a string dotted decimal quad, for example "255.255.255.0".
  gateway: string; // The IP4 interface configuration. This a string dotted decimal quad, for example "192.168.1.2".
  broadcast: string; // The IP4 broadcast address. This a string dotted decimal quad, for example "192.168.1.255".}
}

interface DHCPServerConfig {
  start: string; // the beginning of the range of offered IP addresses
  end: string; // the end of the range of offered IP addresses
  gateway?: string;
  dnsServerList?: string[]; //an array of strings containing the IPv4 addresses of name servers
  domain?: string; // the domain name for the DHCP server
}

interface InterfacePresence {
  wifi: {
    present: boolean;
  };
  ethernet: {
    present: boolean;
  };
}

// From BrightScriptObject.d.ts
interface VideoModeScreenConfig {
  outputName: string;
  videoMode: string;
  screenX: number;
  screenY: number;
  transform: 'normal' | '90' | '180' | '270';
  enabled: boolean;
}
