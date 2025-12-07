interface AWSSettings {
  region?: string;
  cognitoClientId?: string;
  cognitoUserPoolId?: string;
  cognitoFedPoolId?: string;
  endpointAddress?: string;
  Logins?: Record<string, string | null>;
}

interface WebSocketCredentials {
  Credentials: {
    AccessKeyId?: string;
    SecretKey?: string;
    SessionToken?: string;
    Expiration?: Date;
  };
}

interface IoTDeviceConfig {
  region: string;
  host: string;
  clientId: string;
  protocol: string;
  maximumReconnectTimeMs: number;
  debug: false;
  accessKeyId: string;
  secretKey: string;
  sessionToken: string;
  keepalive: number;
}

interface ActivationRequestPayload {
  env: string;
  inviteCode?: string;
  topicId?: string;
  deviceId: string;
  principal: string;
  companyId: string;
}

//LaunchScreen.tsx
interface LaunchState {
  summary: ActivationStep;
  steps: ActivationStep[];
  inviteShowing: boolean;
  inviteCode: string;
  buttonDisabled: boolean;
  mqttConnection?: AWS.device;
  awsConfig?: AWS.config;
  awsSettings?: any;
  cognitoIdentity?: CognitoIdentity;
}

interface ActivationStep {
  msg: string;
  step: number;
  status: StepStatus;
}

interface ProvisionedDevicePayload {
  deviceId: string;
  companyId: string;
  key: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  error?: string;
}

interface Provisioning {
  autoProvisioning: number;
  autoActivating: number;
  inviteCodeProvisioning: number;
  inviteCodeActivating: number;
}

interface Cloud {
  provisioning: Provisioning;
  inviteCode?: string;
  provisionedDevicePayload?: ProvisionedDevicePayload;
  webPlayerVersion?: string;
  channelName?: string;
  connected: boolean;
}
