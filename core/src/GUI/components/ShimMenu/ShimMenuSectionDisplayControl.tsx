import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@core/createStore';
import { setCECEnabled } from '@core/appState/appSetting';
import { RadioButton, RadioGroup } from '../Radio';

export default function ShimMenuSectionDisplayControl() {
  const dispatch = useDispatch();
  // Display Control
  const isCECEnabled = useSelector((state: RootState) => state.appSettings.CECEnabled ?? false);
  return (
    <section className="display-control">
      <h4>Display Control</h4>
      <p className="helper">Select method to toggle display on and off</p>
      <div className="indentation-wrapper">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            width: '55%',
          }}
        >
          <RadioGroup htmlFor="display_control">
            <RadioButton
              id="display_control_cec"
              name="display_control"
              label="HDMI-CEC"
              value="cec"
              checked={isCECEnabled}
              onChange={() => {
                dispatch(setCECEnabled({ value: true }));
              }}
            />
            <RadioButton
              id="display_control_hdmi"
              name="display_control"
              label="HDMI Signal"
              value="hdmi"
              checked={!isCECEnabled}
              onChange={() => {
                dispatch(setCECEnabled({ value: false }));
              }}
            />
          </RadioGroup>
        </div>
      </div>
    </section>
  );
}
