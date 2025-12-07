/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useRef, useState } from 'react';

/** display a message in a Ref<span> alongside component for user feedback. */

type SetFeedbackMessage = (message: UserFeedbackMessage) => void;
type SpanRef = React.RefObject<HTMLSpanElement>;

export function useFeedbackMessage(options?: useFeedbackOptions): [UserFeedbackMessage, SetFeedbackMessage, SpanRef] {
  const [message, setMessage] = useState(options?.defaultMessage ?? { message: '', color: 'normal' });
  const ref = useRef<HTMLSpanElement>(null);

  const setter = useCallback<(message: UserFeedbackMessage) => void>((message) => {
    setMessage(message);
    if (ref?.current) {
      // briefly show the message and modify the color of the text.
      ref.current.classList.remove('success-text');
      ref.current.classList.remove('error-text');
      ref.current.classList.remove('normal-text');
      ref.current.classList.remove('grey_med-text');
      ref.current.classList.remove('info-text');
      ref.current.classList.toggle(`${message.color}-text`);
      ref.current.style.opacity = '1';

      if (!options?.persistent ?? false) {
        setTimeout(() => {
          // hide after 3 sec.
          if (ref && ref?.current) {
            ref.current.style.opacity = '0';
            ref.current.classList.toggle(`${message.color}-text`);
          }
        }, 3000);
      }
    }
  }, []);

  return [message, setter, ref];
}
