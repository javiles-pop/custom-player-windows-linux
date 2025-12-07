import { ObjectEntries } from '@core/Util/Object';
import { MessageResponse, ITEM_PLAYED_COMMAND, ExecuteFunctResponse, ITEM_STALLED_COMMAND } from './messages';

export interface PlayerOptions {
  /**
   * This can be used to generate a sign deployment at a specific display size
   * but defaults to 1080px in CPWeb if omitted.
   */
  height?: number;

  /**
   * This can be used to generate a sign deployment at a specific display size
   * but defaults to 1920px in CPWeb if omitted.
   */
  width?: number;

  /**
   * Boolean if the player should know if it's currently previewing the sign
   * which will cause it to not cache any of the sign data.
   */
  preview?: boolean;

  /**
   * An optional start time to use that is different than the client's time
   * which can be used for previewing content at different times.
   *
   * This needs to be an ISO-8601 formatted date time string.
   */
  localTime?: string;

  /**
   * An optional offset start time to use for previewing content in the future.
   * This value is used to preview content while accounting for the time it takes
   * to generate the preview.
   *
   * This value takes precedence over `localTime` and should be provided in milliseconds.
   *
   * @since 5.14 CPWeb
   */
  localTimeOffset?: number;

  /**
   * A specific version of a channel to display if you want to preview a
   * previously published channel.
   *
   * Note: This isn't supported at this time by CPWeb.
   */
  version?: string;
}

export interface BasePlayerConfig extends PlayerOptions {
  /**
   * This is the base content player web server path. This is set within
   * Customer Management within Cloud as the CPWEB URL field.
   *
   * Note: This url should normally end with a trailing `/` since ASP.NET has
   * problems without it. For example:
   *
   * Good:
   * https://tst-cm.fwitest.net/cpweb/
   *
   * Bad:
   * https://tst-cm.fwitest.net/cpweb1
   *
   * The second one will return a 405 Bad Request response from the server
   */
  baseUrl: string;

  /**
   * Should the player be initialized with a POST or a GET request? We normally
   * want to do a POST since it will hide all the options from the user but can
   * also be sent as query parameters as a GET.
   */
  method?: 'GET' | 'POST';
}

export interface CloudChannelConfig {
  /**
   * The cloud channel id to use. Changing this value will force the player to
   * restart.
   */
  channelId: string;

  /**
   * The cloud company to use. Changing this value will force the player to
   * restart.
   */
  companyId: string;

  /**
   * The access token to use from cloud. Changing this value will force a player
   * to restart, so it is recommended to use the `useContentPlayerMessaging`
   * hook instead.
   *
   * Note: Content Player Web _should_ automatically be able to handle this as
   * well, so changing this value is not extremely recommended.
   */
  accessToken: string;

  /**
   * An optional device id to use that will be used to filter content based on
   * labels.
   */
  deviceId?: string;
}

/**
 * The notes mention that a Content Manager player might not have a mapping file
 * and instead you should provide:
 *
 * - connection - <encrypted_database_connection_string>
 * - company - <company_name_or_id_in_database>
 *
 * I'm not sure if this needs to be implemented or not though.
 */
export interface ContentManagerChannelConfig {
  /**
   * The name or an alias for the database to use.
   */
  client: string;

  /**
   * The id or an alias for the sign to use.
   */
  sign: string;

  /**
   * An optional Cloud access token to use when initializing the player.
   *
   * Note: Not yet implemented when using the `GET` method.
   */
  accessToken?: string;
}

export type ContentPlayerChannelConfig = CloudChannelConfig | ContentManagerChannelConfig;

export interface ContentPlayerWebParameters
  extends Partial<CloudChannelConfig>,
    Partial<ContentManagerChannelConfig>,
    Omit<BasePlayerConfig, 'method'> {}

const isValidString = (value: string | undefined, optional = false): boolean => {
  if (optional) {
    return typeof value === 'undefined' || typeof value === 'string';
  }

  return typeof value === 'string' && value.length >= 1;
};

/**
 * Checks if the provided configuration object is a valid cloud configuration.
 * This really just ensures that the required values are provided and have a
 * length of at least `1`.
 */
export function isCloudConfig(config: ContentPlayerChannelConfig): config is CloudChannelConfig {
  const { channelId, deviceId, companyId, accessToken } = config as CloudChannelConfig;

  return (
    isValidString(channelId) && isValidString(companyId) && isValidString(accessToken) && isValidString(deviceId, true)
  );
}

/**
 * Checks if the provided configuration object is a valid content manager
 * configuration. This really just ensures that the required values are provided
 * and have a length of at least `1`.
 */
export function isContentManagerConfig(config: ContentPlayerChannelConfig): config is ContentManagerChannelConfig {
  const { sign, client, accessToken } = config as ContentManagerChannelConfig;

  return isValidString(sign) && isValidString(client) && isValidString(accessToken, true);
}

/**
 * Returns the parameter name to send in a POST request or as a query parameter
 * since the configuration objects usually use a different naming scheme.
 */
export function getParamName(name: string): string {
  switch (name) {
    case 'channelId':
      return 'channel';
    case 'companyId':
      return '_fwi_cloudCompanyId';
    case 'accessToken':
      return '_fwi_accessToken';
    case 'deviceId':
      return '_fwi_deviceId';
    default:
      return name;
  }
}

/**
 * Creates a url string that can be used for the iframe using query parameters
 * to initialize the player.
 *
 * Note: This function assumes that the Cloud or CM Channel configuration has
 * already been validated.
 *
 * @param configuration The full configuration for a Cloud channel or a Content
 * Manager channel that also includes the baseUrl.
 */
export function resolveUrl({ baseUrl, ...config }: ContentPlayerWebParameters): string {
  const url = new URL(baseUrl);
  ObjectEntries(config).forEach(([name, value]) => {
    if (!value) {
      return;
    }

    url.searchParams.append(getParamName(name), encodeURIComponent(`${value}`));
  });

  return url.toString();
}

export interface AspectRatio {
  /**
   * The width for the aspect ratio.
   */
  x: number;

  /**
   * The height for the aspect ratio.
   */
  y: number;
}

/**
 * The responsive iframe behavior works based on the current width of the
 * container element of the `<CPWebFrame />` but this isn't ideal since it
 * does not ensure that the height stays within the viewport or container size
 * as well.
 */
export function getParentMaxWidth(aspectRatio: AspectRatio, parent: Document | Window | HTMLElement = window): number {
  let height: number;
  if (parent === window) {
    height = parent.innerHeight;
  } else if (parent === document) {
    height = document.documentElement.offsetHeight;
  } else {
    const el = parent as HTMLElement;
    height = el.offsetHeight;
  }

  const { x, y } = aspectRatio;

  return height / (y / x);
}

/**
 * A util to help determine if the sign is ready which should be used in the
 * `ReceiveMessageCallback` with `useCPWebMessaging`.
 *
 * @param message The message response to check against
 * @param isPlaylistRegion Boolean if the sign has an app that is placed in a
 * playlist within a region on the sign. This will check for a parent region
 * called `"Main"` to consider an app ready instead.
 * @return true if the message represents the sign being ready
 */
export function isSignReady(message: MessageResponse, isPlaylistRegion = false): boolean {
  if (message.command !== ITEM_PLAYED_COMMAND || !message.parent || message.type !== 'SignApp') {
    return false;
  }

  return isPlaylistRegion ? message.parent.name === 'Main' : message.parent.type === 'Sign';
}

/**
 * Checks if the `postMessage` response is a `MessageResponse`
 *
 * @param message The message to check against
 * @return true if the message has a `command` property and typecasts the
 * `message` to `MessageResponse`
 */
export const isMessageResponse = (message: MessageResponse | ExecuteFunctResponse): message is MessageResponse =>
  typeof (message as MessageResponse).command === 'string';

/**
 * A util to help determine if the top item has stalled and CPWEB should be restarted
 *
 * @param message The message to check against
 * @return true if the top item has stalled and CPWEB should be restarted.
 */
export const isItemStalled = (message: MessageResponse): boolean =>
  message.command === ITEM_STALLED_COMMAND && (message.parent?.type === null || message.parent?.type === 'SIGN');
