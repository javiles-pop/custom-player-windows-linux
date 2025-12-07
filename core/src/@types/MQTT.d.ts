interface MQTTMessage {
  error?: any;
  status?: string;
  command?: string;
  commandName?: string;
}

interface MqttClient {
  connected: boolean;
  disconnecting: boolean;
  disconnected: boolean;
  reconnecting: boolean;
  queueQoSZero: boolean;

  _events: {
    connect: () => void;
    close: () => void;
    message: () => void;
    error: () => void;
  };
  _eventsCount: number;

  public on(event: 'message', cb: OnMessageCallback): this;
  public on(event: 'packetsend' | 'packetreceive', cb: OnPacketCallback): this;
  public on(event: 'error', cb: OnErrorCallback): this;
  public on(event: string, cb: () => void): this;

  public once(event: 'message', cb: OnMessageCallback): this;
  public once(event: 'packetsend' | 'packetreceive', cb: OnPacketCallback): this;
  public once(event: 'error', cb: OnErrorCallback): this;
  public once(event: string, cb: () => void): this;

  /**
   * publish - publish <message> to <topic>
   *
   * @param {String} topic - topic to publish to
   * @param {(String|Buffer)} message - message to publish
   *
   * @param {Object}    [opts] - publish options, includes:
   *   @param {Number}  [opts.qos] - qos level to publish on
   *   @param {Boolean} [opts.retain] - whether or not to retain the message
   *
   * @param {Function} [callback] - function(err){}
   *    called when publish succeeds or fails
   * @returns {Client} this - for chaining
   * @api public
   *
   * @example client.publish('topic', 'message')
   * @example
   *     client.publish('topic', 'message', {qos: 1, retain: true})
   * @example client.publish('topic', 'message', console.log)
   */
  public publish(topic: string, message: string | Buffer, opts: IClientPublishOptions, callback?: PacketCallback): this;
  public publish(topic: string, message: string | Buffer, callback?: PacketCallback): this;

  /**
   * subscribe - subscribe to <topic>
   *
   * @param {String, Array, Object} topic - topic(s) to subscribe to, supports objects in the form {'topic': qos}
   * @param {Object} [opts] - optional subscription options, includes:
   * @param  {Number} [opts.qos] - subscribe qos level
   * @param {Function} [callback] - function(err, granted){} where:
   *    {Error} err - subscription error (none at the moment!)
   *    {Array} granted - array of {topic: 't', qos: 0}
   * @returns {MqttClient} this - for chaining
   * @api public
   * @example client.subscribe('topic')
   * @example client.subscribe('topic', {qos: 1})
   * @example client.subscribe({'topic': 0, 'topic2': 1}, console.log)
   * @example client.subscribe('topic', console.log)
   */
  public subscribe(topic: string | string[], opts: IClientSubscribeOptions, callback?: ClientSubscribeCallback): this;
  public subscribe(topic: string | string[] | ISubscriptionMap, callback?: ClientSubscribeCallback): this;

  /**
   * unsubscribe - unsubscribe from topic(s)
   *
   * @param {String, Array} topic - topics to unsubscribe from
   * @param {Function} [callback] - callback fired on unsuback
   * @returns {MqttClient} this - for chaining
   * @api public
   * @example client.unsubscribe('topic')
   * @example client.unsubscribe('topic', console.log)
   */
  public unsubscribe(topic: string | string[], callback?: PacketCallback): this;

  /**
   * end - close connection
   *
   * @returns {MqttClient} this - for chaining
   * @param {Boolean} force - do not wait for all in-flight messages to be acked
   * @param {Function} cb - called when the client has been closed
   *
   * @api public
   */
  public end(force?: boolean, cb?: CloseCallback): this;

  /**
   * removeOutgoingMessage - remove a message in outgoing store
   * the outgoing callback will be called withe Error('Message removed') if the message is removed
   *
   * @param {Number} mid - messageId to remove message
   * @returns {MqttClient} this - for chaining
   * @api public
   *
   * @example client.removeOutgoingMessage(client.getLastMessageId());
   */
  public removeOutgoingMessage(mid: number): this;

  /**
   * reconnect - connect again using the same options as connect()
   *
   * @param {Object} [opts] - optional reconnect options, includes:
   *    {Store} incomingStore - a store for the incoming packets
   *    {Store} outgoingStore - a store for the outgoing packets
   *    if opts is not given, current stores are used
   *
   * @returns {MqttClient} this - for chaining
   *
   * @api public
   */
  public reconnect(opts?: IClientReconnectOptions): this;

  /**
   * Handle messages with backpressure support, one at a time.
   * Override at will.
   *
   * @param packet packet the packet
   * @param callback callback call when finished
   * @api public
   */
  public handleMessage(packet: Packet, callback: PacketCallback): void;

  /**
   * getLastMessageId
   */
  public getLastMessageId(): number;

  updateWebSocketCredentials: (accessKey: string, secretKey: string, sessionToken: string) => void;
}

interface ScreenshotCommand extends MQTTMessage {
  command: 'screenshot';
  height: number;
  uploadUrl: string | URL;
  uploadBody: ScreenshotUploadBody;
  alternativeUrl: string | URL;
  alternativeBody: ScreenshotUploadBody;
}

type CloudCommand = RunScriptCommand | ClearCacheCommand | RefreshChannelCommand | ReaderIdCommand;

interface RunScriptCommand extends MQTTMessage {
  command: 'playerCommand';
  commandName: 'RunScript';
  eventId: string;
  requestId: string;
  attributes: { [key: number]: string };
}
interface ClearCacheCommand extends MQTTMessage {
  command: 'playerCommand';
  commandName: 'ClearCache';
  eventId: string;
  requestId: string;
  attributes: { RestartPlayer: boolean };
}
interface RefreshChannelCommand extends MQTTMessage {
  command: 'playerCommand';
  commandName: 'CheckDeployment';
  eventId: string;
  requestId: string;
  attributes: { RestartPlayer: boolean };
}
interface RebootCommand extends MQTTMessage {
  command: 'playerCommand';
  commandName: 'Reboot';
  eventId: string;
  requestId: string;
  attributes: Record<string, string>;
}

interface ReaderIdCommand extends MQTTMessage {
  command: 'playerCommand';
  commandName: 'SendReaderId';
  eventId: string;
  requestId: string;
  attributes: {
    [key: string]: string;
    ReaderId: string;
  };
}

interface ScreenshotUploadBody {
  key: string;
  AWSAccessKeyId: string;
  policy: string;
  signature: string;
  'x-amz-security-token': string;
}

interface ChannelUpdateMessage extends MQTTMessage {
  channel: string;
  version: string | number;
  channelType: string;
  url: string;
  name?: string;
}

interface ShadowSnapshot {
  metadata: any;
  state: {
    delta?: DeviceShadow;
    desired?: DeviceShadow;
    reported?: DeviceShadow;
  };
  version: number;
  timestamp: number;
}

interface ShadowDelta {
  metadata: any;
  state: DeviceShadow;
}

interface DeviceShadow {
  [key: string]: any;
  CurrentURL?: string;
  AccessCode?: string;
  channel?: {
    channelType: string;
    id: string;
    useFwiCloud: boolean;
    useLatest: boolean;
    versionId: string;
  };
  SoftwareUpdateURL?: string;
  CheckForSoftwareUpdate?: boolean;
  CheckForSoftwareUpdateTime?: string;
  WantReboot?: boolean;
  RebootTime?: string;
  FirmwareUpdateURL?: string;
  CheckForFirmwareUpdate?: boolean;
  CheckForFirmwareUpdateTime?: string;
  EnableOnOffTimers?: boolean;
  OnOffTimers?: onAndOffTimerSetting[];
  FWIServicesEnabled?: string;
  LogLevel?: string;
  name?: string;
  WebPlayerURL?: string;
  CECEnabled?: boolean;
  TimeZone?: string;
  TimeServer?: string;
  checkLabels?: boolean;
  Orientation?: string;
  Volume?: number;
  IsFwiCloudPlaylogEnabled?: boolean;
  Resolution?: 'Auto' | '4K' | '1080p' | '720p' | '1024x768' | 'Custom';
}

interface CPWebCommand {
  command?: string;
  funct?: string;
}

interface setPlayerCommand extends CPWebCommand {
  deploymentId: string;
  logLevel: LogLevel;
  playerName: string;
  url: string;
  version: string;
}

interface PlayEvent {
  type: string;
  time: string;
  playid: string;
  scheduleid: string;
  itemid: string | number;
  parent: string;
  event: 'start' | 'end';
}

interface PlayEventCommand extends CPWebCommand {
  command: 'playEvent';
  event: PlayEvent;
}
interface PublishCommand extends CPWebCommand {
  command: 'publishCommand';
  commandName: string;
  attributes: Record<string, unknown>;
  deviceNames: string[];
}

interface executeCommandResponse extends CPWebCommand {
  attributes: Record<string, unknown>;
  commandName: string;
  error: any;
  success: boolean;
}
interface ExecuteFunctResponse {
  funct: string;
  args: {
    name: string;
    attributes: {
      value: ExecuteCommandAttributeValue;
    };
  };
}

type ExecuteCommandAttributeValue =
  | FunctAccessCode
  | FunctionAndOffTimer
  | FunctUrl
  | FunctTime
  | FunctRebootTime
  | FunctDisplayOrientation
  | Record<string, unknown>;

interface FunctAccessCode {
  accesscode: string;
}
interface FunctionAndOffTimer {
  Days: string;
  TimeOn: string;
  TimeOff: string;
}
interface FunctionAndOffTimer {
  days: string;
  timeon: string;
  timeoff: string;
}

interface FunctUrl {
  url: string;
}
interface CheckTime {
  checktime: string;
}

type FunctTime = CheckTime;

interface FunctRebootTime {
  reboottime: string;
}

interface FunctDisplayOrientation {
  rotationangle: string;
}

interface itemPlayedCommand extends CPWebCommand {
  id: string;
  name: string;
  parent: { id: string; name: string; type: string };
  subItems: any[];
  type: CPWebContentType;
}

interface logCommand extends CPWebCommand {
  date: string;
  level: LogLevel;
  message: string; // stringified json
}

interface cloudLogUploadResponse {
  command: 'log';
  uploadBody: {
    [key: string]: string;
    Policy: string;
    ['X-Amz-Algorithm']: string;
    ['X-Amz-Credential']: string;
    ['X-Amz-Date']: string;
    ['X-Amz-Security-Token']: string;
    ['X-Amz-Signature']: string;
    bucket: string;
    key: string;
  };
  uploadUrl: 'https://s3.us-west-2.amazonaws.com/fwi-cloud-device-logs-cloudtest1';
}

interface ShadowProxy {
  ProxyBypassGroup?: { BypassBSN?: boolean; ProxyBypassDomains?: string[] };
  ProxyHost?: string;
  ProxyPassword?: string;
  ProxyPort?: number | null;
  ProxyUser?: string;
  UseProxy?: boolean;
}
