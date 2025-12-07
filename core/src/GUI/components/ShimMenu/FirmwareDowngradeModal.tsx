import { UIColor } from '@core/constants';
import { useToast } from '@core/context/ToastProvider';
import React, { type ReactElement } from 'react';
import Button from '../Button';
import Modal from '../Modal';

interface FirmwareDowngradeModalProps {
  active: boolean;
  onClose: () => void;
}

export function FirmwareDowngradeModal({ active, onClose }: FirmwareDowngradeModalProps): ReactElement {
  const addToast = useToast();
  return (
    <Modal active={active} id="downgrade-fw-confirmation-modal">
      <div className="stack ai-c ta-c">
        <h4>Confirm</h4>
        <p>
          If you are certain the URL on the previous screen points to a valid firmware file for this device, you may
          choose to downgrade your firmware to an earlier version.
        </p>

        <div className="row jc-c ai-fs">
          <Button
            color={UIColor.Grey_med}
            id="fw-downgrade-cancel"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            color={UIColor.Error}
            id="fw-downgrade-confirm"
            onClick={async () => {
              onClose();
              try {
                await window.DeviceAPI.updateFirmware();
              } catch (error) {
                addToast({
                  title: 'Error Downloading Firmware file',
                  description: 'Please check the URL and try again.',
                  type: 'error',
                });
              }
            }}
          >
            Downgrade Now
          </Button>
        </div>
      </div>
    </Modal>
  );
}
