import { UIColor } from '@core/constants';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import React, { useCallback, useEffect, useState, type ReactElement } from 'react';
import Button from '../Button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@core/createStore';
import { setEncryptedStorage } from '@core/appState/appSetting';

const MESSAGES = {
  encryptionWarning:
    'You can encrypt your storage now, but this action cannot be undone without reformatting the device.',
  encrypted:
    'Storage is currently encrypted. To decrypt this storage device, you must stop the application and reformat the device. All device settings will be saved, but all cached content will be lost.',
  notReady:
    'Storage encryption requires either a valid Software Update URL to be set in "Updates", or a provisioning profile to be assigned through BSN.cloud or BrightAuthor:connected.',
};

export function SectionStorageEncryption(): ReactElement {
  const dispatch = useDispatch();
  const isEncrypted = useSelector((state: RootState) => state.appSettings.encryptedStorage);
  const [disabled, setDisabled] = useState(true);
  const [message, setMessage, ref] = useFeedbackMessage();

  const fetchEncryptionStatus = useCallback(async () => {
    const { encrypted, prerequisitesMet } = await window.DeviceAPI.getStorageEncryptionStatus();
    dispatch(setEncryptedStorage({ value: encrypted }));
    setDisabled(!prerequisitesMet);
    return encrypted;
  }, [dispatch]);

  useEffect(() => {
    fetchEncryptionStatus();
  }, [fetchEncryptionStatus]);

  const onClick = useCallback(async () => {
    if (isEncrypted) {
      return;
    }

    const { msg: encryptionMessage, success } = await window.DeviceAPI.encryptStorage(true);
    setMessage({
      message: encryptionMessage,
      color: success ? 'success' : 'error',
    });

    fetchEncryptionStatus();
  }, [fetchEncryptionStatus, isEncrypted, setMessage]);

  return (
    <section>
      <h4>Encryption</h4>

      {isEncrypted ? (
        <p className="helper">{MESSAGES.encrypted}</p>
      ) : (
        <>
          <p className="helper">{disabled ? MESSAGES.notReady : MESSAGES.encryptionWarning}</p>

          <div className="row ai-c gap-s">
            <Button color={UIColor.Error} id={'encryption'} onClick={onClick} disabled={disabled}>
              Encrypt Storage &amp; Reboot
            </Button>
            <span ref={ref}>{message.message}</span>
          </div>
        </>
      )}
    </section>
  );
}
