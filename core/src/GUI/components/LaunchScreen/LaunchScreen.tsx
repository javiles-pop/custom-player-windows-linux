import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../Button';
import Logo from '../../assets/icons/poppulo-logo.svg';
import wifi from '../../assets/icons/wifi-black.svg';
import { RootState } from '@core/createStore';
import classNames from 'classnames';
import { autoProvisionDevice, provisionDevice } from '@core/Flows';
import { DeviceManufacturer, ProvisioningStatus, UIColor } from '@core/constants';
import { setInviteCodeProvisioning, setInviteCode } from '@core/appState/fwiCloud';
import { Logger, isEmpty } from '@core/Util';
import { probeForInternetConnectivity } from '@core/Flows/NetworkChangeFlow';
import TextInputField from '../TextInputField';
import { useIPAddress } from '@core/GUI/hooks/useIPAddress';
import Modal from '../Modal';
import { ShimMenuNetworkConfig } from '../ShimMenu/ShimMenuNetworkConfig';

export default function LaunchScreen() {
  // Global State
  const dispatch = useDispatch();
  const { provisioningStatus, deviceOnline } = useSelector((state: RootState) => {
    return {
      provisioningStatus: state.fwiCloud.provisioning,
      deviceOnline: state.deviceState.deviceOnline,
    };
  });

  // const deviceOnline = false;
  const networkClasses = classNames(['network-status', deviceOnline ? 'connected' : 'disconnected']);
  const { ipAddress } = useIPAddress();

  // local state
  const [summary, setSummary] = useState('Establishing network connection');
  const [inviteShowing, setinviteShowing] = useState(false);
  const [inviteCode, setinviteCode] = useState('');
  const [buttonDisabled, setbuttonDisabled] = useState(true);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [containerClass, setContainerClass] = useState('');
  const submitRef = useRef<HTMLButtonElement>(null);

  const [networkModalActive, setNetworkModalActive] = useState(false);

  // update container styles based on state.
  useEffect(() => {
    if ((inviteShowing && deviceOnline) || (!deviceOnline && window.DeviceAPI.supportsWifiConfig)) {
      setContainerClass('flex-start');
    } else {
      setContainerClass('');
    }
  }, [deviceOnline, inviteShowing]);

  const onHandleInviteCodeClick = useCallback(() => {
    //If user submits after failed invite code, clear the error
    if (showErrorMessage) {
      setSummary('Checking player registration');
      setShowErrorMessage(false);
    }
    dispatch(setInviteCode(inviteCode));
    provisionDevice(inviteCode);
    dispatch(setInviteCodeProvisioning(ProvisioningStatus.inProgress));
  }, [showErrorMessage, dispatch, inviteCode]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setinviteCode(e.target.value);
    if (e.target.value.length >= 6) {
      setbuttonDisabled(false);
      e.target.blur();

      // setTimout pushes the focus to the next tick so that the blur event can finish first.
      setTimeout(() => {
        submitRef.current?.focus();
      }, 0);
    } else {
      setbuttonDisabled(true);
    }
  }, []);

  useEffect(() => {
    /**
     * Based on each of the possible states for activation status, we update the UI based on each.
     * Some of the state is changed from an MQTT message. See ActivationRouter.ts for these events.
     */
    // Connected to internet?
    if (
      isIdle(provisioningStatus.autoProvisioning) &&
      isIdle(provisioningStatus.inviteCodeProvisioning) &&
      !deviceOnline
    ) {
      probeForInternetConnectivity();
    }

    // Connecting to Network
    if (!deviceOnline) {
      setSummary('Connect to WiFi or plug in ethernet cable');
    }

    // connecting to Harmony
    if (provisioningStatus.autoProvisioning === ProvisioningStatus.idle && deviceOnline) {
      autoProvisionDevice();
      setSummary('Checking player registration');
    }

    // Couldn't auto activate. show invite code.
    if (
      provisioningStatus.autoProvisioning === ProvisioningStatus.error &&
      provisioningStatus.inviteCodeProvisioning === ProvisioningStatus.idle
    ) {
      setinviteShowing(true);
    }

    // invite code provisioning
    if (provisioningStatus.inviteCodeProvisioning === ProvisioningStatus.inProgress) {
      Logger.debug('[PROVISION] Provisioning in progress via invite code');
    }

    // waiting to hear back about invite code. reserving deviceID
    if (provisioningStatus.inviteCodeProvisioning === ProvisioningStatus.awaitingResponse) {
      Logger.debug('[PROVISION] waiting for provisioned device response from IoT service.');
      setSummary('Getting player properties');
    }

    // invite code provision successful. Activate player.
    if (provisioningStatus.inviteCodeProvisioning === ProvisioningStatus.success) {
      Logger.info('[PROVISION] Device provisioned with invite code successfully');
      setSummary('Activating Player');
    }

    // Bad invite code from user.
    if (provisioningStatus.inviteCodeProvisioning == ProvisioningStatus.error && !isEmpty(inviteCode)) {
      setShowErrorMessage(true);
      setSummary('Matching invite code was not found');
    }
  }, [provisioningStatus, deviceOnline, inviteCode]);

  const status = provisioningStatus;
  const launchMessage = classNames(['launch-message-container', { 'error-text': showErrorMessage }]);
  const step1ClassNames = classNames(['step-spinner', deviceOnline ? 'complete' : 'error']);
  const step1LabelClassName = classNames(['step-label', { 'error-text': step1ClassNames.includes('error') }]);
  const step2ClassNames = classNames([
    'step-spinner',
    {
      active: deviceOnline && (isInProgress(status.autoProvisioning) || isInProgress(status.inviteCodeProvisioning)),
      complete:
        isAwaitingResponse(status.autoProvisioning) ||
        isComplete(status.autoProvisioning) ||
        isComplete(status.inviteCodeProvisioning) ||
        isAwaitingResponse(status.inviteCodeProvisioning),
      error: failed(status.autoProvisioning) && failed(status.inviteCodeProvisioning),
    },
  ]);
  const step2LabelClassName = classNames(['step-label', { 'error-text': step2ClassNames.includes('error') }]);
  const step3ClassNames = classNames([
    'step-spinner',
    {
      active: isAwaitingResponse(status.autoProvisioning) || isAwaitingResponse(status.inviteCodeProvisioning),
      complete: isComplete(status.autoProvisioning) || isComplete(status.inviteCodeProvisioning),
      //error: failed(status.autoProvisioning) && failed(status.inviteCodeProvisioning),
    },
  ]);
  const step3LabelClassName = classNames(['step-label', { 'error-text': step3ClassNames.includes('error') }]);
  const step4ClassNames = classNames([
    'step-spinner',
    {
      active: isInProgress(status.autoActivating) || isInProgress(status.inviteCodeActivating),
      complete: isComplete(status.autoActivating) || isComplete(status.inviteCodeActivating),
      error: failed(status.autoActivating) || failed(status.inviteCodeActivating),
    },
  ]);
  const step4LabelClassName = classNames(['step-label', { 'error-text': step4ClassNames.includes('error') }]);

  return (
    <div id="launch-screen" className={containerClass}>
      <div className={networkClasses}>
        <img src={wifi} alt="wifi" />
      </div>
      <header className="launch-header">
        <img className="logo" src={Logo} alt="FWI Logo" />
      </header>

      <ol className="process-steps">
        <li className="step">
          <div className={step1ClassNames}>
            <div className="step-number">1</div>
          </div>
          <p className={step1LabelClassName}>Establishing network connection</p>
        </li>

        <li className="step">
          <div className={step2ClassNames}>
            <div className="step-number">2</div>
          </div>
          <p className={step2LabelClassName}>Checking player registration</p>
        </li>

        <li className="step">
          <div className={step3ClassNames}>
            <div className="step-number">3</div>
          </div>
          <p className={step3LabelClassName}>Getting player properties</p>
        </li>

        <li className="step">
          <div className={step4ClassNames}>
            <div className="step-number">4</div>
          </div>
          <p className={step4LabelClassName}>Activating player</p>
        </li>
      </ol>

      <div className={launchMessage}>
        <div id="launch-message">{summary}</div>
      </div>

      {step1ClassNames.includes('error') && !deviceOnline && window.DeviceAPI.supportsWifiConfig ? (
        <Button
          id="wifi-config-button"
          color={UIColor.Purple}
          onClick={() => {
            setNetworkModalActive(true);
          }}
        >
          Configure Network
        </Button>
      ) : null}

      {inviteShowing && deviceOnline ? (
        <div className="invite-code-container">
          <TextInputField
            name={''}
            id={'inviteCodeInput'}
            className="invite-code-input"
            value={inviteCode}
            onChange={onChange}
            max={6}
            placeholder="------"
          />
          <br />

          <div className="flex">
            {window.DeviceAPI.supportsWifiConfig ? (
              <Button
                id="wifi-config-button"
                color={UIColor.Grey_med}
                onClick={() => {
                  setNetworkModalActive(true);
                }}
              >
                Configure Network
              </Button>
            ) : null}

            <Button
              id="invite-code-button-submit"
              color={UIColor.Purple}
              disabled={buttonDisabled}
              onClick={onHandleInviteCodeClick}
              data-navigable={true}
              ref={submitRef}
            >
              Submit
            </Button>
          </div>
        </div>
      ) : null}

      <footer className="launch-footer">
        <span>{ipAddress !== 'n/a' ? ipAddress : ''}</span>
        <span>
          Player Version {process.env.REACT_APP_VERSION}.{process.env.REACT_APP_BUILD}
        </span>
      </footer>

      <Modal id={'pre-activation-network-config-modal'} active={networkModalActive}>
        <ShimMenuNetworkConfig />
        <div className="flex center">
          <Button
            id={'pre-activation-network-config-close'}
            color={UIColor.Grey_med}
            onClick={() => {
              setNetworkModalActive(false);
            }}
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const isInProgress = (status: number) => {
  return status === ProvisioningStatus.inProgress;
};
const failed = (status: number) => {
  return status === ProvisioningStatus.error;
};
const isIdle = (status: number) => {
  return status === ProvisioningStatus.idle;
};

const isAwaitingResponse = (status: number) => {
  return status === ProvisioningStatus.awaitingResponse;
};
const isComplete = (status: number) => {
  return status === ProvisioningStatus.success;
};
