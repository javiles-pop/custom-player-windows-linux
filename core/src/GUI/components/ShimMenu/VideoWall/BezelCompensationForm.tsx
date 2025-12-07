import React, { type ReactElement } from 'react';
import TextInputField from '../../TextInputField';
import { BezelCompensation } from './util';

interface BezelCompensationProps {
  bezelCompensation: BezelCompensation;
  setBezelCompensation: (side: 'top' | 'left' | 'bottom' | 'right', value: number) => void;
}

export function BezelCompensationForm({
  bezelCompensation,
  setBezelCompensation,
}: BezelCompensationProps): ReactElement {
  return (
    <div>
      <h4>Bezel Compensation</h4>
      <div className="row gap-s">
        <TextInputField
          name="Top"
          id="bezel-compensation-top"
          value={String(bezelCompensation.top)}
          onChange={(e) => {
            setBezelCompensation('top', Number(e.target.value));
          }}
        />
        <TextInputField
          name="Left"
          id="bezel-compensation-left"
          value={String(bezelCompensation.left)}
          onChange={(e) => {
            setBezelCompensation('left', Number(e.target.value));
          }}
        />
      </div>
      <div className="row gap-s">
        <TextInputField
          name="Bottom"
          id="bezel-compensation-bottom"
          value={String(bezelCompensation.bottom)}
          onChange={(e) => {
            setBezelCompensation('bottom', Number(e.target.value));
          }}
        />
        <TextInputField
          name="Right"
          id="bezel-compensation-right"
          value={String(bezelCompensation.right)}
          onChange={(e) => {
            setBezelCompensation('right', Number(e.target.value));
          }}
        />
      </div>
    </div>
  );
}
