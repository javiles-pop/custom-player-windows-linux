import React from 'react';

interface RadioGroupProps extends React.HTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
}

export function RadioGroup(props: RadioGroupProps) {
  return (
    <label className="fwi-radio-group" htmlFor={props.htmlFor}>
      {props.children}
    </label>
  );
}
