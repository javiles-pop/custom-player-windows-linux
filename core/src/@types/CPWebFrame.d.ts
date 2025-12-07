interface CPWebFrameProps {
  LegacyChannelPayload?: LegacyChannelPayload;
  CloudChannelPayload?: CloudChannelPayload;

  baseURL?: string;
  channelID?: string;
  companyID?: string;
  deviceID?: string;

  accessToken?: string;

  client?: string;
  sign?: string;

  cacheBuster?: string;
  src?: string;
  onURLChange?: () => void;
  onMessageReceived?: () => void;
  beforeMessageSend?: () => void;

  id?: string;
  className?: string;
}

interface LegacyChannelPayload {
  baseURL: string;
  client: string;
  sign: string;
  cacheBuster?: string;
}

interface CloudChannelPayload {
  baseURL: string;
  channelID: string;
  companyID: string;
  accessToken: string;
  deviceID?: string;
  cacheBuster?: string;
  width?: number;
  height?: number;
}

declare enum SignTypes {
  legacy,
  cloud,
  unknown,
}
