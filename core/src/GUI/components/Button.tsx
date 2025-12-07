import React, { useState, useCallback, forwardRef, ButtonHTMLAttributes, MouseEvent } from 'react';
import classNames from 'classnames';

interface FWIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color: string;
  id: string;
}

// forward ref to button

const Button = forwardRef<HTMLButtonElement, FWIButtonProps>(function Button(
  { color, disabled, onClick, id, children, className, ...props }: FWIButtonProps,
  forwardedRef
) {
  const [loading, setLoading] = useState(false);

  const onClickSetLoading = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      setLoading(true);
      await onClick?.(e);
      setLoading(false);
    },
    [onClick]
  );

  return (
    <button
      className={classNames(['btn', color, { loading }, className])}
      id={id}
      disabled={disabled}
      onClick={(args) => onClickSetLoading(args)}
      data-navigable={!disabled}
      type="button"
      ref={forwardedRef}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

export default Button;

interface SpinnerProps {
  hexColor?: string;
  size?: number;
  className?: string;
}

function Spinner({ hexColor = '#fff', size = 30, className = 'btn-loader' }: SpinnerProps) {
  return (
    <svg
      version="1.1"
      className={className}
      x="0px"
      y="0px"
      width={`${size}px`}
      height={`${size}px`}
      viewBox=" 0 0 50 50"
    >
      <path
        fill={hexColor}
        d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"
      >
        <animateTransform
          attributeType="xml"
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.75s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
