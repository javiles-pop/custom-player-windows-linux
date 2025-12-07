import { DiskKeys } from '@core/constants';
import { RootState } from '@core/createStore';
import { updateShadow } from '@core/MQTT/Shadow';
import { ObjectEntries } from '@core/Util/Object';
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { setProxy } from '../appSetting';

const proxyListenerMiddleware = createListenerMiddleware<RootState>();

proxyListenerMiddleware.startListening({
  matcher: isAnyOf(
    setProxy
    // setProxyBypassHosts,
    // setProxyBypassBSN,
    // setProxyEnabled,
    // setProxyHost,
    // setProxyPort,
    // setProxyUser,
    // setProxyPass
  ),
  effect: (action) => {
    const { payload } = action;

    switch (action.type) {
      case 'appSettings/setProxy': {
        console.log('updating proxy settings via listener');
        updateProxy(payload as { value: ShadowProxy; ignoreUpdateToShadow?: boolean });
      }
    }
  },
});

function updateProxy({ value }: { value: ShadowProxy; ignoreUpdateToShadow?: boolean }) {
  const settingsMap = {
    UseProxy: DiskKeys.UseProxy,
    ProxyUser: DiskKeys.ProxyUser,
    ProxyPort: DiskKeys.ProxyPort,
    ProxyPassword: DiskKeys.ProxyPassword,
    ProxyHost: DiskKeys.ProxyHost,
  };

  ObjectEntries(settingsMap).forEach(([proxyProp, diskKey]) => {
    if (value[proxyProp] !== undefined) {
      window.DeviceAPI.setSetting(diskKey, value[proxyProp]);
    }
  });

  // nested properties
  if (value.ProxyBypassGroup) {
    if (value.ProxyBypassGroup.BypassBSN !== undefined) {
      window.DeviceAPI.setSetting(DiskKeys.ProxyBypassBSN, value.ProxyBypassGroup.BypassBSN);
    }

    if (value.ProxyBypassGroup.ProxyBypassDomains !== undefined) {
      window.DeviceAPI.setSetting(DiskKeys.ProxyBypassDomains, value.ProxyBypassGroup.ProxyBypassDomains);
    }
  }
}

export { proxyListenerMiddleware };
