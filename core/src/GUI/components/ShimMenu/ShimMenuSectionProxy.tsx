import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import Modal from '../Modal';
import {
  setProxyEnabled,
  setProxyHost,
  setProxyUser,
  setProxyPass,
  setProxyPort,
  setProxyBypassBSN,
  setProxyBypassHosts,
  setProxy,
} from '@core/appState/appSetting';
import { UIColor } from '@core/constants';
import { RootState } from '@core/createStore';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from '../Button';
import Checkbox from '../Checkbox';
import TextInputField from '../TextInputField';
import { Logger } from '@core/Util';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';

export default function ShimMenuSectionProxy() {
  const dispatch = useDispatch();
  // Proxy
  const { proxyEnabled, proxyHost, proxyUser, proxyPass, proxyPort, proxyBypassBSN, proxyBypassHosts } = useSelector(
    (state: RootState) => {
      return {
        proxyEnabled: state.appSettings.proxyEnabled!,
        proxyHost: state.appSettings.proxyHost,
        proxyUser: state.appSettings.proxyUser,
        proxyPass: state.appSettings.proxyPass,
        proxyPort: state.appSettings.proxyPort,
        proxyBypassBSN: state.appSettings.proxyBypassBSN!,
        proxyBypassHosts: state.appSettings.proxyBypassHosts,
        shallowEqual,
      };
    }
  );
  const [proxyCustomModalHostActive, setProxyCustomModalHostActive] = useState(false);
  const [newCustomBypassDomain, setNewCustomBypassDomain] = useState('');
  const [proxyModalFeedback, setProxyModalFeedback, modalRef] = useFeedbackMessage();
  const [proxyFeedback, setProxyFeedback, feedbackRef] = useFeedbackMessage();

  const onConfirmHandler = async () => {
    const error = validateProxyFields(proxyEnabled, proxyHost, proxyPort);

    if (!error) {
      const proxySettings: ShadowProxy = {
        UseProxy: proxyEnabled,
        ProxyBypassGroup: {
          ProxyBypassDomains: proxyBypassHosts ?? [],
          BypassBSN: proxyBypassBSN,
        },
        ProxyHost: proxyHost ?? '',
        ProxyUser: proxyUser ?? '',
        ProxyPassword: proxyPass ?? '',
        ProxyPort: proxyPort ? Number(proxyPort) : null,
      };
      Logger.info('user clicked button to apply proxy settings and reboot.');
      dispatch(setProxy({ value: proxySettings, ignoreUpdateToCloud: true }));
    } else {
      setProxyFeedback({ message: error, color: 'error' });
    }
  };

  const onAddProxy = useCallback(() => {
    if (!proxyBypassHosts?.includes(newCustomBypassDomain)) {
      const newHosts = [...(proxyBypassHosts ?? []), newCustomBypassDomain];
      dispatch(setProxyBypassHosts(newHosts));
      setNewCustomBypassDomain('');
      setProxyCustomModalHostActive(false);
    } else {
      setProxyModalFeedback({
        message: 'Hostname already exists',
        color: 'error',
      });
    }
  }, [proxyBypassHosts, newCustomBypassDomain, dispatch, setProxyModalFeedback]);

  const onToggleProxy = useCallback(() => {
    dispatch(setProxyEnabled(!proxyEnabled));
  }, [proxyEnabled, dispatch]);

  const handleCustomProxyHostCancel = useCallback(() => {
    setNewCustomBypassDomain('');
    setProxyCustomModalHostActive(false);
  }, [setProxyCustomModalHostActive, setNewCustomBypassDomain]);

  return (
    <>
      <section className="network-proxy">
        <h4>Proxy</h4>

        <div className="indentation-wrapper">
          <Checkbox checked={proxyEnabled} onChange={onToggleProxy} id="use_proxy" name="Use Network Proxy" />

          <div className={classNames(['indentation-wrapper', { hidden: !proxyEnabled }])}>
            <TextInputField
              name="Proxy Host"
              id="proxy_host"
              value={proxyHost}
              onChange={(e) => {
                dispatch(setProxyHost(e.target.value));
              }}
            />
            <TextInputField
              name="Proxy User"
              id="proxy_user"
              value={proxyUser}
              onChange={(e) => {
                dispatch(setProxyUser(e.target.value));
              }}
            />
            <TextInputField
              name="Proxy Password"
              id="proxy_pass"
              type="password"
              value={proxyPass}
              onChange={(e) => {
                dispatch(setProxyPass(e.target.value));
              }}
            />
            <TextInputField
              name="Proxy Port"
              id="proxy_port"
              type="tel"
              value={!isNaN(Number(proxyPort)) ? `${proxyPort}` : ''}
              max={5}
              onChange={(e) => {
                if (
                  !isNaN(Number(e.target.value)) &&
                  e.target.value !== proxyPort?.toString() &&
                  e.target.value.length <= 5
                ) {
                  if (e.target.value.length <= 5) {
                    if (!e.target.value) {
                      dispatch(setProxyPort(''));
                    } else {
                      dispatch(setProxyPort(e.target.value));
                    }
                  }
                }
              }}
            />
            <Checkbox
              checked={proxyBypassBSN}
              onChange={() => {
                dispatch(setProxyBypassBSN(!proxyBypassBSN));
              }}
              id="bsn_proxy_enabled"
              name="Bypass BrightSign Network URLs"
            />

            <p className="spacer"></p>

            <h4>Proxy Bypass</h4>
            <table className="bypass-table">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>
                    <Button
                      id="proxy__create-new-bypass-button"
                      color={UIColor.Grey_med}
                      disabled={false}
                      onClick={() => {
                        setProxyCustomModalHostActive(true);
                      }}
                    >
                      Add
                    </Button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {proxyBypassHosts?.map((host, i) => {
                  return window.DeviceAPI.inProxyList(host) ? null : (
                    <tr key={host}>
                      <td>{host}</td>
                      <td>
                        <Button
                          id=""
                          className="remove-bypass-button"
                          color={UIColor.Grey_dark}
                          onClick={() => {
                            const newHosts = [...proxyBypassHosts];
                            newHosts.splice(i, 1);
                            dispatch(setProxyBypassHosts(newHosts));
                          }}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="button-with-feedback">
            <Button id="proxy_button_confirm" color={UIColor.Purple} onClick={onConfirmHandler}>
              Confirm & Reboot
            </Button>

            <span className="user-feedback" ref={feedbackRef}>
              {proxyFeedback.message}
            </span>
          </div>
        </div>
      </section>

      <Modal id="proxy__new-custom-host-modal" active={proxyCustomModalHostActive}>
        <div className="wrapper" style={{ textAlign: 'center', padding: '1rem 2rem' }}>
          <h4>Add Proxy Bypass Host</h4>
          <TextInputField
            id="proxy__new-custom-host-text-field"
            name=""
            value={newCustomBypassDomain}
            onChange={(e) => {
              setNewCustomBypassDomain(e.target.value);
            }}
          />

          <div className="buttons" style={{ textAlign: 'center' }}>
            <Button
              id="add-new-proxy-bypass__cancel-button"
              color={UIColor.Grey_med}
              onClick={handleCustomProxyHostCancel}
            >
              Cancel
            </Button>
            <Button
              id="add-new-proxy-bypass__create-button"
              color={UIColor.Purple}
              disabled={!newCustomBypassDomain}
              onClick={onAddProxy}
            >
              Add
            </Button>
          </div>

          <span className="user-feedback" ref={modalRef}>
            {proxyModalFeedback.message}
          </span>
        </div>
      </Modal>
    </>
  );
}

const validateProxyFields = (enabled: boolean, host?: string, port?: string) => {
  if (!enabled) return;
  const p = port ? Number(port) : -1;

  if (!host) {
    return 'Proxy host is a required field';
  }

  if (p && (p > 65_535 || p < 0)) {
    return 'Port must be number between 0 and 65535';
  }
  return;
};
