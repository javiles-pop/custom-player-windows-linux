import React, { useState, ChangeEvent, useCallback } from 'react';
import { UIColor } from '@core/constants';
import { isValidURLFormat, Logger } from '@core/Util';
import { getFinalSignURL, removeTokenFromUrl } from '@core/Deployment';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@core/createStore';
import { setCurrentURL } from '@core/appState/appSetting';
import TextInputField from '../TextInputField';
import Button from '../Button';
import ShimMenuHeader from './ShimMenuHeader';
import { onMount } from '@core/GUI/hooks/onMount';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import { setMenuStatus } from '@core/appState/shimMenuActive';

export default function ShimMenuDeployment() {
  const [deployFeedback, setDeployFeedback, deploymentMessageRef] = useFeedbackMessage();
  const initialValue = useSelector((state: RootState) => state.appSettings.currentURL) ?? '';
  const [url, setValue] = useState(initialValue);
  const dispatch = useDispatch();

  onMount(() => {
    const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
    backButton?.focus();
  });

  const handleDeployURLSubmit = useCallback(async () => {
    Logger.info('user clicked verify button in channel url subpage.');

    if (!url) {
      const updateUrl: updateStateWithString = { value: url };
      dispatch(setCurrentURL(updateUrl));
    }

    if (url === initialValue) {
      dispatch(setMenuStatus(false));
      return;
    }

    Logger.debug(`Validating url at: ${url}`);

    if (isValidURLFormat(url)) {
      Logger.debug('url is in a valid format');
      try {
        const finalURL = await getFinalSignURL(url);
        if (finalURL) {
          Logger.info('Channel URL Verified!');
          const updateUrl: updateStateWithString = { value: finalURL };
          dispatch(setCurrentURL(updateUrl));
          setDeployFeedback({ message: 'URL Verified', color: 'success' });
        }
      } catch (error) {
        Logger.error(error);
        setDeployFeedback({ message: error.toString(), color: 'error' });
      }
    } else {
      setDeployFeedback({ message: 'Malformed URL', color: 'error' });
    }
  }, [url, initialValue, dispatch, setDeployFeedback]);

  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Channel" />
      <section className="shim-menu-deployment menu-container">
        <TextInputField
          name="Channel URL"
          id="deployment-url"
          value={removeTokenFromUrl(url)} // If we do not remove token, then the url would contain token which would be visible to the user
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value);
          }}
        />

        <div className="button-with-feedback">
          <Button
            id="deployment-url-button__verify"
            color={UIColor.Purple}
            onClick={handleDeployURLSubmit}
            disabled={!isValidURLFormat(url)}
          >
            Test and Save
          </Button>
          <span className="user-feedback" ref={deploymentMessageRef}>
            {deployFeedback.message}
          </span>
        </div>
      </section>
    </>
  );
}
