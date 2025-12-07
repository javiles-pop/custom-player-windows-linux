import React, { useState, useEffect, useCallback } from 'react';
import ShimMenuHeader from './ShimMenuHeader';
import Button from '../Button';
import { setAccessCode } from '@core/appState/appSetting';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@core/createStore';
import { UIColor } from '@core/constants';
import OnScreenKBNumericalInput from './NewNumericalInput';
import { onMount } from '@core/GUI/hooks/onMount';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import NumericalInput from '../NumericalInputField';

export default function ShimMenuAccessCode() {
  const dispatch = useDispatch();
  const [newCode, setNewCode] = useState('');
  const [enableSave, setEnableSave] = useState(false);
  const [accessCodeFeedback, setAccessCodeFeedback, accessCodeRef] = useFeedbackMessage();
  const accessCode = useSelector((state: RootState) => state.appSettings.accessCode) ?? '';

  useEffect(() => {
    setNewCode(accessCode);
    setEnableSave(false);
  }, [accessCode]);

  const onClear = useCallback(() => {
    setNewCode('');
    dispatch(setAccessCode({ value: '' }));
    setAccessCodeFeedback({ message: 'Access code removed.', color: 'normal' });
  }, [dispatch, setAccessCodeFeedback]);

  const onSave = useCallback(() => {
    dispatch(setAccessCode({ value: newCode }));
    setAccessCodeFeedback({ message: 'Access code set.', color: 'success' });
  }, [dispatch, newCode, setAccessCodeFeedback]);

  useEffect(() => {
    if (newCode.length && !enableSave) {
      setEnableSave(true);
    }
  }, [enableSave, newCode.length]);

  onMount(() => {
    if (accessCode) {
      setNewCode(accessCode);
    }
    const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
    backButton?.focus();
  });

  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Access Code" />
      <section className="shim-menu-access-code menu-container">
        <div style={{ position: 'relative' }}>
          {window.DeviceAPI.supportsVirtualKeyboard ? (
            <OnScreenKBNumericalInput
              value={newCode}
              maxLength={7}
              onChange={(newValue) => {
                setNewCode(newValue);
              }}
              id="access-code-settings-code"
            />
          ) : (
            <NumericalInput
              length={7}
              onUserInput={(newVal) => {
                setNewCode(newVal);
              }}
              value={newCode}
              id="access-code-settings-code"
            />
          )}
        </div>

        <div className="buttons">
          <Button id="acccess-code-button-clear" color={UIColor.Grey_dark} onClick={onClear}>
            Clear
          </Button>

          <Button id="acccess-code-button-save" color={UIColor.Purple} disabled={!enableSave} onClick={onSave}>
            Save
          </Button>
        </div>

        <span className="user-feedback" ref={accessCodeRef}>
          {accessCodeFeedback.message}
        </span>
      </section>
    </>
  );
}
