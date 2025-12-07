import { setRunScript } from '@core/appState/appSetting';
import { UIColor } from '@core/constants';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import Button from '../Button';

export default function ShimMenuSectionCache() {
  const dispatch = useDispatch();
  const [feedback, setFeedback, feedbackRef] = useFeedbackMessage();

  const onClearCache = useCallback(async () => {
    const success = await window.DeviceAPI.clearPlayerCache();
    dispatch(
      setRunScript({
        command: 'playerCommand',
        commandName: 'ClearCache',
        eventId: '<undefined>',
        requestId: '<undefined>',
        attributes: { RestartPlayer: false },
      })
    );

    if (success) {
      setFeedback({ message: 'Cache cleared.', color: 'success' });
    } else {
      setFeedback({ message: 'Failed to clear player cache.', color: 'error' });
    }
  }, [dispatch, setFeedback]);
  return (
    <section>
      <h4>Player Cache</h4>
      <div className="indentation-wrapper">
        <p className="helper">
          Clearing cache might help resolve certain performance issues. Perform this action sparingly.
        </p>
        <Button onClick={onClearCache} color={UIColor.Purple} id="shim-button-clear-cache">
          Clear Cache Now
        </Button>
        <span className="user-feedback" id="cache-feedback" ref={feedbackRef}>
          {feedback.message}
        </span>
      </div>
    </section>
  );
}
