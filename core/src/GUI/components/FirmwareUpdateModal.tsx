import React from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { RootState } from '@core/createStore';
import { useSelector } from 'react-redux';
import { bytesToHuman } from '@core/Util';

export default function FirmwareUpdateModal() {
  const { progress, size } = useSelector((state: RootState) => {
    return {
      progress: state.deviceState.firmwareDownloadProgress,
      size: state.deviceState.firmwareUpdateSize ?? 0,
    };
  });

  return (
    <Modal active={true} id="firmware_update_modal">
      <section>
        <h4>A Firmware update is in progress</h4>
        <div className="text-container">
          <p className="helper">
            Please do not unplug or disconnect your device during this process.
            <br />
            Your device will reboot shortly.
          </p>
          {size ? <p className="helper"> Download size: {bytesToHuman(size)}</p> : null}
        </div>

        <div className="spinner-container">
          <Spinner hexColor="var(--purple)" size={160} className="firmware-spinner" />
        </div>

        <div className="progress-bar">
          <div className="inner-progress" style={{ width: progress }}></div>
        </div>

        <p>{progress}</p>
      </section>
    </Modal>
  );
}
