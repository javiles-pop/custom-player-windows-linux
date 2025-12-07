import { DeviceManufacturer, UIColor } from '@core/constants';
import { RadioGroup, RadioButton } from '../Radio';
import { ReactElement, useCallback, useState } from 'react';
import { RootState } from '@core/createStore';
import { setDisplayOrientation } from '@core/appState/deviceSettings';
import { useDispatch, useSelector } from 'react-redux';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import Button from '../Button';
import React from 'react';
import umbrellaIcon from '@core/GUI/assets/icons/umbrella-black.svg';
import { DeviceOrientation } from '@core/constants';
import { semverIsGreaterOrEqual } from '@core/Util';

export function SectionDisplayOrientation(): ReactElement {
  const dispatch = useDispatch();
  const savedRotation = useSelector((state: RootState) => state.deviceSettings.orientation);
  const [selectedRotation, setSelectedRotation] = useState(savedRotation);
  const [feedbackMessage, setFeedbackMessage, elementRef] = useFeedbackMessage();
  const platform = window.DeviceAPI.getManufacturer();
  const supportsAllOrientations = !(
    platform === DeviceManufacturer.SSP && semverIsGreaterOrEqual('6.0', window.DeviceAPI.osVersion)
  );

  const onSave = useCallback(() => {
    dispatch(setDisplayOrientation({ value: selectedRotation }));
    setFeedbackMessage({ message: 'Orientation saved.', color: 'success' });
  }, [dispatch, selectedRotation, setFeedbackMessage]);
  return (
    <section className="shim-menu-display-orientation">
      <h4>ORIENTATION</h4>
      <div>
        <RadioGroup htmlFor="display_orientation" className="orientation-input">
          <RadioButton
            value={DeviceOrientation.DEG_0}
            name="display_orientation"
            label="0&deg;"
            checked={selectedRotation === DeviceOrientation.DEG_0}
            onChange={() => {
              setSelectedRotation(DeviceOrientation.DEG_0);
            }}
          />

          <RadioButton
            value={DeviceOrientation.DEG_90}
            name="display_orientation"
            label="90&deg;"
            checked={selectedRotation === DeviceOrientation.DEG_90}
            onChange={() => {
              setSelectedRotation(DeviceOrientation.DEG_90);
            }}
          />

          {supportsAllOrientations ? (
            <>
              <RadioButton
                value={DeviceOrientation.DEG_180}
                name="display_orientation"
                label="180&deg;"
                checked={selectedRotation === DeviceOrientation.DEG_180}
                onChange={() => {
                  setSelectedRotation(DeviceOrientation.DEG_180);
                }}
              />

              <RadioButton
                value={DeviceOrientation.DEG_270}
                name="display_orientation"
                label="270&deg;"
                checked={selectedRotation === DeviceOrientation.DEG_270}
                onChange={() => {
                  setSelectedRotation(DeviceOrientation.DEG_270);
                }}
              />
            </>
          ) : null}
        </RadioGroup>
      </div>
      <div className="display-previews">
        <div className="display-preview-container">
          <div className="display-preview">
            <img src={umbrellaIcon} alt="umbrella" />
          </div>
        </div>

        <div className="display-preview-container">
          <div className="display-preview" id="ninety">
            <img src={umbrellaIcon} alt="umbrella" />
          </div>
        </div>

        {supportsAllOrientations ? (
          <>
            <div className="display-preview-container">
              <div className="display-preview" id="one-eighty">
                <img src={umbrellaIcon} alt="umbrella" />
              </div>
            </div>

            <div className="display-preview-container">
              <div className="display-preview" id="two-seventy">
                <img src={umbrellaIcon} alt="umbrella" />
              </div>
            </div>
          </>
        ) : null}
      </div>

      {platform !== DeviceManufacturer.BrightSign ? (
        <Button
          id="display-orientation-button__rotate90"
          color={UIColor.Grey_med}
          onClick={window.DeviceAPI.rotateScreen}
        >
          Rotate 90&deg;
        </Button>
      ) : null}

      <Button id="display-orientation-button__save" color={UIColor.Purple} onClick={onSave}>
        Save {platform === DeviceManufacturer.BrightSign ? '& Reboot' : ''}
      </Button>

      <span ref={elementRef} className="user-feedback">
        {feedbackMessage.message}
      </span>
    </section>
  );
}
