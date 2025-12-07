import React, { useState, useEffect } from 'react';
import dateFmt from 'date-fns/format';
import { DeviceManufacturer, TimeFormats } from '../../../constants';
import { useSelector } from 'react-redux';
import { RootState } from '@core/createStore';
import classNames from 'classnames';
import EthernetIcon from '@core/GUI/assets/icons/ethernet.svg';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import WifiIcon from '../WifiIcon';

function ShimStatusBar({ history }: RouteComponentProps) {
  const [time, setTime] = useState(() => new Date());
  const online = useSelector((state: RootState) => state.deviceState.deviceOnline);
  const activeInterface = useSelector((state: RootState) => state.deviceState.activeNetworkInterface);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const networkStatus = online ? 'Connected' : 'Disconnected';
  const networkClassNames = classNames([networkStatus.toLowerCase(), 'network-status']);
  const platform = window.DeviceAPI.getManufacturer();

  return (
    <>
      <div className="header-gradient"></div>
      <header className="shim-status-bar black">
        <div className="date-time">{dateFmt(time, TimeFormats.DateTime)}</div>
        <div className="app-version">
          App Version {process.env.REACT_APP_VERSION}.{process.env.REACT_APP_BUILD}
        </div>
        <button
          className={networkClassNames}
          data-navigable={platform === DeviceManufacturer.BrightSign}
          onClick={() => {
            platform === DeviceManufacturer.BrightSign ? history.push(`/network`) : null;
          }}
        >
          <span>{networkStatus}</span>
          {activeInterface === 'wifi' ? <WifiIcon /> : null}
          {activeInterface === 'ethernet' ? <img src={EthernetIcon} width="16px" /> : null}
        </button>
      </header>
    </>
  );
}

export default withRouter(ShimStatusBar);
