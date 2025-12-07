import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../Button';
import Modal from '../Modal';
import { RootState } from '@core/createStore';
import NumericalInputField from '../NumericalInputField';
import { UIColor } from '@core/constants';
import { resetShimMenu, setUserCanAccessMenu } from '@core/appState/shimMenuActive';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';

export default function AccessCodeModal() {
  const dispatch = useDispatch();
  const { shimMenuActive, accessCode, userCanAccessMenu } = useSelector((state: RootState) => {
    return {
      shimMenuActive: state.shimMenu.shimMenuActive,
      accessCode: state.appSettings.accessCode,
      userCanAccessMenu: state.shimMenu.userCanAccessMenu,
    };
  });

  const [accessCodeFeedback, setAccessCodeFeedback, accessCodeRef] = useFeedbackMessage();
  const [userCode, setUserCode] = useState('');

  const disabledInputs = !(shimMenuActive && !userCanAccessMenu);

  const onSubmit = useCallback(() => {
    if (userCode === accessCode) {
      dispatch(setUserCanAccessMenu(true));
    } else {
      setAccessCodeFeedback({
        message: 'Invalid Access code.',
        color: 'error',
      });
    }
    setUserCode('');
  }, [userCode, accessCode, dispatch, setAccessCodeFeedback]);

  const onCancel = useCallback(() => {
    dispatch(setUserCanAccessMenu(false));
    setUserCode('');
    dispatch(resetShimMenu());
  }, [dispatch]);

  return (
    <Modal id="access-code-modal" active={shimMenuActive && !userCanAccessMenu}>
      <h2>Access Code Required</h2>
      <NumericalInputField
        id="access-code-modal-input"
        length={7}
        onUserInput={(newCode) => {
          setUserCode(newCode);
        }}
        value={userCode}
        type="password"
        disabled={disabledInputs}
      />
      <br />
      <Button
        id="access-code-modal-button-cancel"
        color={UIColor.Grey_med}
        onClick={onCancel}
        disabled={disabledInputs}
      >
        Cancel
      </Button>
      <Button id="access-code-modal-button-submit" color={UIColor.Purple} onClick={onSubmit} disabled={disabledInputs}>
        Submit
      </Button>
      <h4 hidden={!accessCodeFeedback.message}>
        <span className="user-feedback" ref={accessCodeRef}>
          {accessCodeFeedback.message}
        </span>
      </h4>
    </Modal>
  );
}
