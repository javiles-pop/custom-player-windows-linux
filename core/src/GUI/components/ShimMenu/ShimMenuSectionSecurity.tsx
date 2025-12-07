import { onMount } from '@core/GUI/hooks/onMount';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import React, { useCallback, useEffect, useState } from 'react';
import Toggle from '../Toggle';
import Modal from '../Modal';
import Button from '../Button';
import { UIColor } from '@core/constants';

export default function ShimMenuSectionSecurity() {
  const [securityDisabled, setSecurityDisabled] = useState(false);
  const [message, setMessage, toggleRef] = useFeedbackMessage();
  const [showSecurityConfirmModal, setShowSecurityConfirmModal] = useState(false);

  onMount(async () => {
    const disabled = await window.DeviceAPI.getWebSecurity();
    setSecurityDisabled(disabled === '1');
  });

  const onConfirmDisableSecurity = useCallback(async () => {
    await window.DeviceAPI.disableWebSecurity();
    setSecurityDisabled(!securityDisabled);
    setShowSecurityConfirmModal(false);
    setMessage({
      color: 'info',
      message: `Device will reboot now to apply changes.`,
    });

    setTimeout(() => {
      window.DeviceAPI?.reboot();
    }, 3000);
  }, [securityDisabled, setMessage]);

  const onClickToggleSecurity = useCallback(async () => {
    const enable = () => {
      window.DeviceAPI.enableWebSecurity();
      setSecurityDisabled(!securityDisabled);
      setMessage({
        color: 'info',
        message: `Device will reboot now to apply changes.`,
      });

      setTimeout(() => {
        window.DeviceAPI?.reboot();
      }, 3000);
    };

    securityDisabled ? enable() : setShowSecurityConfirmModal(true);
  }, [securityDisabled, setMessage]);

  useEffect(() => {
    if (showSecurityConfirmModal) {
      const cancelSecurityButton = document.getElementById('cancelSecurityButton');
      cancelSecurityButton?.focus();
    }
  }, [showSecurityConfirmModal]);

  return (
    <section className="network-proxy">
      <h4>Web Security</h4>

      <div className="indentation-wrapper">
        <Toggle
          checked={securityDisabled}
          name={'Web Security'}
          onChange={onClickToggleSecurity}
          id="web-security-toggle"
          falseName="Enabled"
          trueName="Disabled"
        />

        <span className="helper" ref={toggleRef} style={{ marginLeft: '1rem' }}>
          {message.message}
        </span>

        <Modal id={'securityModal'} active={showSecurityConfirmModal}>
          <div className="wrapper" style={{ textAlign: 'center', padding: '1rem' }}>
            <h2>Disclaimer</h2>
            <p>
              You may choose to disable this feature which may improve certain types of playback, but may also weaken
              this device&apos;s and its network&apos;s security protections. If you choose to disable this feature, you
              assume responsibility for any consequences to the extent attributable to its disablement.
            </p>

            <Button
              color={UIColor.Grey_med}
              id={'cancelSecurityButton'}
              onClick={() => {
                setShowSecurityConfirmModal(false);
              }}
            >
              Cancel
            </Button>
            <Button color={UIColor.Error} id={'confirmSecurityButton'} onClick={onConfirmDisableSecurity}>
              Confirm
            </Button>
          </div>
        </Modal>
      </div>
    </section>
  );
}
