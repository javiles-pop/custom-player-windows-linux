declare module '*.svg' {
  const content: string;
  export default content;
}

interface Log {
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'TRACE';
  message: string;
  timestamp: string; // ISO 8601 format
  posixTime: number; // unix time
  offset: number;
  logType: 'DeviceLog' | 'PlayerLog';
}

declare module 'aws-iot-device-sdk-browser';
declare module 'crypto-js/aes';
declare module 'crypto-js/enc-utf8';
