import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import Dropdown from '../Dropdown';
import Button from '../Button';
import { UIColor } from '@core/constants';
import Spinner from '../Spinner';
import { Logger } from '@core/Util';
import { BSdoesUpscaleVideo } from '@core/Util/Video';
import { useSelector, useDispatch } from 'react-redux';
import { setResolution } from '@core/appState/appSetting';
import { mapDeviceResolutionToShadow } from '@core/Util/ResolutionUtils';

export function SectionDisplayResolution(): ReactElement {
  const [resolution, setLocalResolution] = useState('');
  const [resolutions, setResolutions] = useState<{ value: string }[]>([]);
  const [isUpscaled, setIsUpscaled] = useState(false);
  const resSaveRebootButtonRef = useRef<HTMLButtonElement>(null);
  const [model, setModel] = useState('');
  const dispatch = useDispatch();
  const { resolution: shadowResolution, videoWallEnabled } = useSelector((state: any) => state.appSettings);
  const nativeResolution = useRef<string>('');

  // listen for changes to the current resolution from the OS and populate the list.
  useEffect(() => {
    const fetchResolution = async () => {
      const { modes, best, active } = await window.DeviceAPI.getResolutions();
      const formattedActive = formatResolution(active);
      setLocalResolution(formattedActive);
      nativeResolution.current = best;

      // If we have a shadow resolution value, update the UI to match it
      if (shadowResolution) {
        Logger.debug(`[DISPLAY] Shadow resolution is set to: ${shadowResolution}`);
        // Find the corresponding device resolution if possible
        const matchingMode = modes.find((mode) => {
          const [width, height] = mode.replace('@', 'x').split('x').map(Number);
          const shadowValue = mapDeviceResolutionToShadow(width, height, best);
          return shadowValue === shadowResolution;
        });

        if (matchingMode && !videoWallEnabled) {
          Logger.debug(`[DISPLAY] Found matching device mode for shadow resolution: ${matchingMode}`);
          setLocalResolution(formatResolution(matchingMode));
          dispatch(setResolution({ value: shadowResolution }));
        }
      }

      const [width] = resolution.replace('@', 'x').split('x').map(Number);

      if (window.innerWidth <= width / 2) {
        setIsUpscaled(true);
      }

      // move active and best to the top of the list
      modes.sort((a, b) => {
        if (a === active || a === best) {
          return -1;
        }
        if (b === active || b === best) {
          return 1;
        }
        return 0;
      });

      setResolutions(
        modes.map((value) => {
          const formattedValue = formatResolution(value);
          return {
            value: value === best ? `${formattedValue} (Recommended)` : formattedValue,
          };
        })
      );
    };
    if (!resolution || !resolutions.length) {
      fetchResolution();
    }
  }, [dispatch, resolution, resolutions, shadowResolution, videoWallEnabled]);

  useEffect(() => {
    const fetchModel = async () => {
      const model = await window.DeviceAPI.getModel();
      setModel(model);
    };

    if (!model) {
      fetchModel();
    }
  }, [model]);

  // Save and Reboot
  const onClick = useCallback(async () => {
    const [width, height, frequency] = resolution
      .replace('@', 'x')
      .replace(/(Hz|p| \(Recommended\))/gi, '')
      .split('x')
      .map(Number);

    try {
      // Update the shadow resolution value based on the selected resolution
      const shadowValue = mapDeviceResolutionToShadow(width, height, nativeResolution.current);
      Logger.info(`[DISPLAY] Setting shadow resolution to ${shadowValue} from UI selection`);
      dispatch(setResolution({ value: shadowValue }));

      const rebootRequired = await window.DeviceAPI.setResolution(width, height, frequency ?? 30);
      Logger.info(`[DISPLAY] Reboot required: ${rebootRequired} from UI selection`);
      if (rebootRequired) {
        setTimeout(() => {
          window.DeviceAPI.reboot();
        }, 3000); // Delay to allow Shadow to update
      }
    } catch (error) {
      Logger.console.error(error);
    }
  }, [resolution, dispatch]);

  // Dropdown handler
  const onChangeResolution = useCallback(
    (selectedOption: string) => {
      setLocalResolution(selectedOption);

      if (selectedOption !== resolution) {
        // focus the save button button after making a change
        resSaveRebootButtonRef.current?.focus();
      }

      if (model) {
        const [width, height] = selectedOption.replace('@', 'x').split('x').map(Number);
        if (Number(width) * Number(height) >= 2500000 && BSdoesUpscaleVideo(model)) {
          setIsUpscaled(true);
        }
      }
    },
    [resolution, model, resSaveRebootButtonRef]
  );

  return (
    <section>
      <h4>RESOLUTION</h4>
      <div>
        <span className="helper">Change resolution</span>
        {resolution ? (
          <Dropdown
            options={resolutions}
            defaultOption={resolution}
            id={'resolution-switcher'}
            onChange={onChangeResolution}
            selection={resolution}
          />
        ) : (
          <Spinner size={40} hexColor="var(--purple)" className="standalone-spinner wifi-spinner" />
        )}
      </div>

      <Button color={UIColor.Purple} id={'changeResolutionButton'} onClick={onClick} ref={resSaveRebootButtonRef}>
        Save &amp; Reboot
      </Button>
      {isUpscaled && (
        <p className="helper purple-text">
          Your video may be upscaled at 2x because it surpasses the maximum output of 2.5 million total pixels supported
          by this device.
        </p>
      )}
    </section>
  );
}

function formatResolution(resolution: string) {
  const [width, height, frequency] = resolution.replace('@', 'x').split('x');
  return `${width} x ${height} @${frequency}Hz`;
}
