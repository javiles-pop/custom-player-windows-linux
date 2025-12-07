import { MutableRefObject, useCallback, useEffect, useRef } from 'react';

import {
  MessageResponse,
  ReceiveMessageCallback,
  RESPONSE_COMMANDS,
  SendMessage,
  ExecuteFunctResponse,
} from './messages';

export type CPWebMessaging = [MutableRefObject<HTMLIFrameElement | null>, SendMessage];

/**
 * This hook allows for 2-way communication between the current app and CPWEB by
 * listening to iframe messages and posting messages.
 *
 * ### Listening to messages
 *
 * Listening to messages just requires providing a message handler:
 *
 * ```tsx
 * const baseUrl = 'https://tst-cm.fwitest.net/cpweb1/';
 * const handleMessages = useCallback<ReceiveMessageCallback>((message, sendMessage) => {
 *   switch (message.command) {
 *     case PING_COMMAND:
 *       // handle ping
 *       break;
 *     case EXECUTE_COMMAND_RESPONSE:
 *       // handle execute command
 *       break;
 *     case SET_PLAYER_COMMAND:
 *       // handle set player
 *       break;
 *     case ITEM_PLAYED_COMMAND:
 *       // handle item played
 *       break;
 *     case LOAD_SIGN_COMMAND:
 *       // handle load sign
 *       break;
 *     case LOG_COMMAND:
 *       // handle log
 *       break;
 *     default:
 *   }
 * }, []);
 *
 * useCPWebMessaging(baseUrl, handleMessages);
 *
 * return <CPWebFrame baseUrl={baseUrl} {...props} />;
 * ```
 *
 * ### Sending messages
 *
 * Messages can be sent to CPWEB by using the returned `ref` and `sendMessage`
 * values from this hook. The `ref` must be passed to the `CPWebFrame` component
 * for this to work.
 *
 * To send a message, use the `sendMessage` function along with one of the
 * message action creators exported from this package:
 *
 * ```tsx
 * const baseUrl = 'https://tst-cm.fwitest.net/cpweb1/';
 * const [ref, sendMessage] = useCPWebMessaging(baseUrl);
 *
 * return (
 *   <>
 *     <button type="button" onClick={() => sendMessage(ping())}>Ping</button>
 *     <CPWebFrame baseUrl={baseUrl} ref={ref} {...props} />
 *   </>
 * );
 * ```
 *
 * @param baseUrl The base url for the `CPWebFrame` component that is used to
 * determine where to send messages and which message types to receive
 * @param onMessage An optional callback that allows for listening to messages
 * from CPWEB
 */
export function useCPWebMessaging(baseUrl: string, onMessage?: ReceiveMessageCallback): CPWebMessaging {
  const iframe = useRef<HTMLIFrameElement>(null);

  const send = useCallback<SendMessage>((message) => {
    const frame = iframe.current?.contentWindow;
    if (!frame) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(
          "The <iframe> ref has not been attached to the CPWebFrame component which means messaging won't work."
        );
      }
      return;
    }
    frame.postMessage(message, '*');
  }, []);

  useEffect(() => {
    if (!onMessage) {
      return;
    }

    const handler = (event: MessageEvent): void => {
      if (Object.prototype.hasOwnProperty.call(event.data, 'command')) {
        const data = event.data as MessageResponse;
        if (!RESPONSE_COMMANDS.includes(data.command)) {
          if (process.env.NODE_ENV !== 'production') {
            /* eslint-disable no-console */
            console.warn(`Unhandled message type from \`CPWebFrame\`: "${data.command}"`);
            console.warn('data: ', data);
            console.warn(new Error().stack);
            /* eslint-enable no-console */
          }
        }
        onMessage(data, send);
      } else if (typeof event.data === 'string') {
        const response = JSON.parse(event.data);
        if (Object.prototype.hasOwnProperty.call(response, 'funct')) {
          const data = response as ExecuteFunctResponse;
          onMessage(data, send);
        }
      }
    };
    window.addEventListener('message', handler, false);

    return () => {
      window.removeEventListener('message', handler, false);
    };
  }, [baseUrl, onMessage, send]);

  return [iframe, send];
}
