import React from 'react';
import { MemoryRouter as Router, Route, Switch } from 'react-router-dom';
import classNames from 'classnames';
import ShimStatusBar from './ShimStatusBar';
import ShimMenuHome from './ShimMenuHome';
import ShimMenuAbout from './ShimMenuPageAbout';
import ShimMenuAccessCode from './ShimMenuPageAccessCode';
import ShimMenuAdvanced from './ShimMenuPageAdvanced';
import ShimMenuDeployment from './ShimMenuPageDeployment';
import ShimMenuDisplayOrientation from './ShimMenuPageDisplay';
import ShimMenuLogging from './ShimMenuPageLogging';
import ShimMenuTimers from './ShimMenuPageTimers';
import {
  DEPLOYMENT,
  LOGGING,
  TIMERS,
  ACCESS_CODE,
  DISPLAY_ORIENTATION,
  ADVANCED,
  ABOUT,
  UPDATES,
} from '../../../constants';
import ShimMenuUpdates from './ShimMenuPageUpdates';
import Wifi from './Wifi';

// responsible for displaying the Menu part of the app (or not) and the router view.
export default function ShimMenu(props: ShimMenuProps) {
  return (
    <Router>
      <div className={classNames('shim-menu-fullscreen', { active: props.active })}>
        <div id="shim-menu" style={{ textAlign: 'left' }}>
          <div className="inner-container">
            <ShimStatusBar />
            <Switch>
              <Route path="/" exact component={ShimMenuHome} />
              <Route path={`/${DEPLOYMENT}`} component={ShimMenuDeployment} />
              <Route path={`/${LOGGING}`} component={ShimMenuLogging} />
              <Route path={`/${TIMERS}`} component={ShimMenuTimers} />
              <Route path={`/${ACCESS_CODE}`} component={ShimMenuAccessCode} />
              <Route path={`/${DISPLAY_ORIENTATION}`} component={ShimMenuDisplayOrientation} />
              <Route path={`/${UPDATES}`} component={ShimMenuUpdates} />
              <Route path={`/${ADVANCED}`} component={ShimMenuAdvanced} />
              <Route path={`/${ABOUT}`} component={ShimMenuAbout} />
              <Route path={`/network`} component={Wifi} />
            </Switch>
          </div>
        </div>
      </div>
    </Router>
  );
}
