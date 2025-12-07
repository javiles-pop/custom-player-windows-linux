import React, { useCallback } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import logo from '../../assets/icons/poppulo-logo-only.svg';
import backArrow from '../../assets/icons/back-arrow.svg';
import Logger from 'js-logger';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { userCanExitMenu } from '@core/Util';
import { RootState } from '@core/createStore';
import { setMenuStatus, setUserCanAccessMenu } from '@core/appState/shimMenuActive';

type ShimMenuHeaderRouteProps = ShimMenuHeaderProps & RouteComponentProps<any>;

function ShimMenuHeader({ isChildPage, childPageTitle, history, signName }: ShimMenuHeaderRouteProps) {
  const dispatch = useDispatch();
  const accessCode = useSelector((state: RootState) => state.appSettings.accessCode);

  const onExitClick = useCallback(() => {
    Logger.debug('user hit the exit button on the shim menu');
    dispatch(setMenuStatus(false));
    dispatch(setUserCanAccessMenu(!accessCode));
  }, [accessCode, dispatch]);

  // child page headers are shorter and contain the back button in the upper left.
  const childPageHeader = () => (
    <>
      <div className="back-button">
        <button
          data-navigable={true}
          tabIndex={-1}
          onClick={() => {
            history.goBack();
            Logger.debug(`User hit back button from the ${childPageTitle} menu`);
          }}
        >
          <img src={backArrow} alt="back" title="back" />
        </button>
      </div>
      <div>{childPageTitle}</div>
    </>
  );

  // main menu header contains the FWI logo and the device's name from Harmony
  const mainMenuHeader = (signName?: string) => (
    <>
      <div className="fwi-logo">
        <img src={logo} alt="Poppulo" width="50" />
      </div>
      <div className="sign-name">{signName ?? ''}</div>
    </>
  );

  return (
    <div className={classNames(['banner', 'greyscale-2', { child: isChildPage }])}>
      {isChildPage ? childPageHeader() : mainMenuHeader(signName)}
      <div className="exit-menu-button">
        <button data-navigable={true} disabled={!userCanExitMenu()} onClick={onExitClick}>
          &#10005;
        </button>
      </div>
    </div>
  );
}

export default withRouter(ShimMenuHeader);
