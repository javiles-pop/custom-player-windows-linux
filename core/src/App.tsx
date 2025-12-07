import React from 'react';
import './GUI/scss/main.scss';
import { LaunchScreen, ShimApp } from './GUI';
import { useSelector } from 'react-redux';
import { RootState } from './createStore';
import { useBackgroundTask } from './GUI/hooks/useBackgroundTask';

/**
 * Check for activation from disk. Show either the main app, or the activation screen.
 */
export default function App() {
  useBackgroundTask(window.DeviceAPI.postInit);
  const activated = useSelector((state: RootState) => state.appSettings.activated);
  return <div className="App">{activated ? <ShimApp /> : <LaunchScreen />}</div>;
}
