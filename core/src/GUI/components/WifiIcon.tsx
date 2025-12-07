import React, { ReactElement } from 'react';

export default function WifiIcon({
  theme = 'light',
  height = 16,
  width = 16,
  strength = 3,
}: {
  height?: number;
  width?: number;
  strength?: number;
  theme?: 'dark' | 'light';
}): ReactElement {
  const barFill = theme === 'light' ? '#eff3f6' : '#1a1a1a';
  const barEmpty = theme === 'light' ? '#eff3f62b' : '#1a1a1a2b';
  return (
    <svg
      viewBox="0 0 37 32"
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        strokeLinejoin: 'round',
        strokeMiterlimit: 2,
      }}
      width={width}
      height={height}
    >
      <path
        d="M19.991 5.843c-6.659 0-12.767 2.23-17.537 5.842-.51.376-.627 1.187-.244 1.692.383.505 1.195.611 1.695.222 4.363-3.304 9.964-5.354 16.086-5.354 6.121 0 11.723 2.05 16.086 5.354.5.389 1.312.283 1.695-.222s.266-1.316-.244-1.692c-4.77-3.612-10.878-5.842-17.537-5.842Z"
        style={{
          fill: strength >= 3 ? barFill : barEmpty,
          fillRule: 'nonzero',
        }}
        transform="matrix(1 0 0 1 -1.983 -5.843)"
      />
      <path
        d="M19.991 13.448c-4.788 0-9.269 1.45-12.759 4.266-.55.37-.681 1.233-.265 1.75.416.516 1.287.572 1.766.114 3.022-2.439 6.954-3.728 11.258-3.728 4.304 0 8.235 1.289 11.257 3.728.48.458 1.351.402 1.766-.114.416-.517.285-1.38-.264-1.75-3.49-2.816-7.971-4.266-12.759-4.266Z"
        style={{
          fill: strength >= 2 ? barFill : barEmpty,
          fillRule: 'nonzero',
        }}
        transform="matrix(1 0 0 1 -1.983 -5.843)"
      />
      <path
        d="M19.991 20.653c-2.959 0-5.779.928-7.956 2.653-.494.393-.587 1.201-.194 1.694.393.496 1.201.588 1.695.196 1.716-1.361 4.004-2.142 6.455-2.142 2.451 0 4.738.781 6.454 2.142.495.392 1.302.3 1.695-.196.393-.493.301-1.301-.194-1.694-2.177-1.725-4.996-2.653-7.955-2.653Z"
        style={{
          fill: strength >= 1 ? barFill : barEmpty,
          fillRule: 'nonzero',
        }}
        transform="matrix(1 0 0 1 -1.983 -4.843)"
      />
      <path
        d="M19.991 28.258c-2.418 0-4.403 1.985-4.403 4.403 0 2.418 1.985 4.403 4.403 4.403 2.417 0 4.403-1.985 4.403-4.403 0-2.418-1.986-4.403-4.403-4.403Zm0 2.402c1.119 0 2.001.884 2.001 2.001a1.982 1.982 0 0 1-2.001 2.001c-1.12 0-2.002-.88-2.002-2.001 0-1.117.882-2.001 2.002-2.001Z"
        style={{
          fill: barFill,
          fillRule: 'nonzero',
        }}
        transform="matrix(1 0 0 1 -1.983 -5.843)"
      />
    </svg>
  );
}
