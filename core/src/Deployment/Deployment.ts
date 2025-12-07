import { storeExport as store, storeExport } from '@core/index';
import { setCurrentURL, setLinkAuthRequired, setToken } from '@core/appState/appSetting';
import { dequeueTaskByName, Logger, runTaskAtTime } from '@core/Util';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { addSeconds, fromUnixTime } from 'date-fns';
import { ContentCaching } from '@core/Util/ContentCaching';

/** Verifies if a given url is an instance of CP Web or just a random URL */
export async function checkIfWebPlayer(urlString: string): Promise<boolean> {
  const url = new URL(urlString);
  const wpURL = url.origin + url.pathname + 'api/about';

  try {
    const { status } = await fetch(wpURL, { method: 'GET' });
    return status === 200;
  } catch (error) {
    throw Error(error as string);
  }
}

/** async takes url, returns Promise<statusCode> to determine if the URL is properly authenticated */
export async function checkSignAuthenticationStatus(url: string): Promise<number> {
  try {
    const { status } = await fetch(url, { method: 'HEAD' });
    return status;
  } catch (error) {
    throw Error(error as string);
  }
}

/** determines if a url needs a (new) access token appended based on status code */
export function UrlNeedsAuthentication(statusCode: number, urlString: string) {
  const url = new URL(urlString);
  if (url.searchParams.has('channel') && !url.searchParams.has('_fwi_accessToken')) {
    return true;
  }

  switch (statusCode) {
    case 200:
      return false;

    case 401:
      // most likely a bad or expired access token
      return true;

    case 403:
      // missing access token
      return true;

    case 404:
      throw new Error('Sign cannot be found.');

    case 500:
    case 502:
    case 503:
    case 504:
    case 512:
      retryDeploymentAfterFailure(urlString);
      throw new Error('Something appears to be wrong with Web Player. It returned response code: ' + statusCode);

    default:
      throw new Error(
        'Web Player returned a ' + statusCode + ` status code, which is something we weren't sure how to handle.`
      );
  }
}

/** Add access token and company ID to a url query string */
export function addSignAuthentication(url: string): string {
  store.dispatch(setLinkAuthRequired(true));
  const token = store.getState().appSettings.token;
  const companyId = store.getState().fwiCloud.provisionedDevicePayload?.companyId;

  const authenticatedURL = new URL(url);
  if (authenticatedURL.searchParams.has('_fwi_accessToken')) {
    authenticatedURL.searchParams.delete('_fwi_accessToken');
  }

  if (authenticatedURL.searchParams.has('_fwi_cloudCompanyId')) {
    authenticatedURL.searchParams.delete('_fwi_cloudCompanyId');
  }

  authenticatedURL.searchParams.set('_fwi_accessToken', token!);
  authenticatedURL.searchParams.set('_fwi_cloudCompanyId', companyId!);
  Logger.debug('[DEPLOYMENT] Added Sign authentication. returning new url');
  return authenticatedURL.toString();
}

/** Most of the functions in this file wrapped up into on async function */

export async function getFinalSignURL(url: string, attempt = 0): Promise<string> {
  Logger.info(`[DEPLOYMENT] Checking channel url...`);
  try {
    if (attempt >= 5) {
      // continue to retry indefinitely with delays of 5s,10s,30s,1m,2m,and 5m.
      const retryTimes = [5, 10, 30, 60, 120, 300];
      const retryTime = retryTimes[attempt - 5] ?? retryTimes[5];
      runTaskAtTime(() => getFinalSignURL(url, (attempt += 1)), addSeconds(new Date(), retryTime), 'retry Deployment');

      throw new Error('Could not verify Deployment.');
    }

    const isWPURL = await checkIfWebPlayer(url);
    Logger.debug(`[DEPLOYMENT] Is WP URL: ${isWPURL}`);
    if (isWPURL) {
      Logger.debug(`[DEPLOYMENT] Checking Sign Authentication status...`);
      const statusCode = await checkSignAuthenticationStatus(url);

      if (UrlNeedsAuthentication(statusCode, url)) {
        Logger.debug('[DEPLOYMENT] Sign needs authentication');
        const authenticatedURL = addSignAuthentication(url);
        Logger.debug('[DEPLOYMENT] Rechecking authenticated Channel url');
        const finalURL = await getFinalSignURL(authenticatedURL, (attempt += 1));
        return finalURL;
      } else {
        Logger.info('[DEPLOYMENT] Sign is accessible. URL Verified');
        url = verifyDimensions(url);
        dequeueTaskByName('retry Deployment');
        
        // Cache channel assets
        ContentCaching.cacheChannelAssets(url).catch(error => {
          Logger.warn('[DEPLOYMENT] Failed to cache channel assets:', error);
        });
        
        return url;
      }
    } else {
      throw new Error('URL is not a valid Web Player instance');
    }
  } catch (error) {
    throw new Error(error.message as string);
  }
}

export function removeTokenFromUrl(url: string): string {
  if (url && url.includes('_fwi_accessToken')) {
    const authenticatedURL = new URL(url);
    if (authenticatedURL.searchParams.has('_fwi_accessToken')) {
      authenticatedURL.searchParams.delete('_fwi_accessToken');
    }
    return authenticatedURL.toString();
  }
  return url;
}

/** get a new access token if something has gone wrong with the current one. */
export function refreshAccessToken(user: CognitoUser, session: CognitoUserSession) {
  if (store.getState().deviceState.deviceOnline) {
    // token stuff
    user.refreshSession(session.getRefreshToken(), (err, newSession: CognitoUserSession) => {
      if (err) {
        Logger.error(`[ACCESS TOKEN] ${err}`);
      } else {
        const newToken = newSession.getAccessToken();
        storeExport.dispatch(setToken(newToken.getJwtToken()));
        runTaskAtTime(
          () => {
            refreshAccessToken(user, newSession);
          },
          // subtract 5 minutes from expiration to ensure we have a new token before the old one expires
          fromUnixTime(newToken.getExpiration() - 300),
          'Refresh tokens'
        );
      }
    });
  } else {
    Logger.warn(
      '[ACCESS TOKEN] Token expired while offline. App will attempt to get a new ticket when device can connect to the internet again.'
    );
  }
}

export async function cacheBustCurrentDeployment() {
  const { currentURL } = store.getState().appSettings;
  const { deviceOnline } = store.getState().deviceState;

  if (currentURL && deviceOnline) {
    try {
      Logger.debug('[DEPLOYMENT] Adding cache buster to current deployment.');
      const newURL = new URL(currentURL);
      newURL.searchParams.set('_', new Date().getTime().toString());
      const cacheBustedURL = await getFinalSignURL(newURL.toString());
      store.dispatch(setCurrentURL({ value: cacheBustedURL }));
    } catch (error) {
      Logger.error(error);
    }
  } else {
    Logger.warn(
      '[DEPLOYMENT] Either there is no sign playing, or the device is offline. Ignoring request to bust cache.'
    );
  }
}

/** If the user is using a new WP base url other than the one defined in cloud, this will run to make sure the sign exists on it. */
export async function redeployCurrentSignWithNewBase(webPlayerBaseURL: string) {
  const { currentURL } = store.getState().appSettings;
  if (currentURL && webPlayerBaseURL) {
    const current = new URL(currentURL);
    const nextURL = new URL(webPlayerBaseURL);

    if (current.origin !== nextURL.origin) {
      Logger.debug('[DEPLOYMENT] Web Player URL changed. Updating current sign to use new base.');
      nextURL.search = current.search;
      const finalURL = await getFinalSignURL(nextURL.toString());
      store.dispatch(setCurrentURL({ value: finalURL }));
    }
  }
}

async function retryDeploymentAfterFailure(url: string) {
  try {
    const signUrl = await getFinalSignURL(url);
    store.dispatch(setCurrentURL({ value: signUrl }));
    dequeueTaskByName('Retry Deployment');
  } catch (error) {
    Logger.warn('[DEPLOYMENT] Failed to deploy sign after server failure. Will retry every 30s until successful.');

    runTaskAtTime(
      () => {
        retryDeploymentAfterFailure(url);
      },
      new Date(Date.now() + 30000),
      'Retry Deployment'
    );
  }
}

function verifyDimensions(url: string) {
  const urlObj = new URL(url);
  const width = urlObj.searchParams.get('width');
  const height = urlObj.searchParams.get('height');

  if (!width || !height) {
    Logger.debug('[DEPLOYMENT] Sign does not have width and height parameters');
    urlObj.searchParams.set('width', window.innerWidth.toString());
    urlObj.searchParams.set('height', window.innerHeight.toString());
    return urlObj.toString();
  }

  if (width !== window.innerWidth.toString() || height !== window.innerHeight.toString()) {
    Logger.debug('[DEPLOYMENT] Sign dimensions do not match window dimensions');
    urlObj.searchParams.set('width', window.innerWidth.toString());
    urlObj.searchParams.set('height', window.innerHeight.toString());
    return urlObj.toString();
  }

  return url;
}
