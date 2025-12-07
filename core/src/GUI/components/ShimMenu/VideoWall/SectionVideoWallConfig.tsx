import React, { useEffect, useRef, useState, useCallback, type ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@core/createStore';
import Toggle from '../../Toggle';
import { setVideoWallBezelComp, setVideoWallEnabled } from '@core/appState/appSetting';
import Checkbox from '../../Checkbox';
import Dropdown from '../../Dropdown';
import Button from '../../Button';
import { UIColor } from '@core/constants';
import {
  type BezelCompensation,
  getEstimatedPosition,
  getLayoutOptions,
  extractLayoutFromConfig,
} from '@core/GUI/components/ShimMenu/VideoWall/util';
import { Tabs } from '../../Tabs/Tabs';
import { TabPanel } from '../../Tabs/TabPanel';
import { LayoutPreview } from './LayoutPreview';
import { BezelCompensationForm } from './BezelCompensationForm';
import { Logger } from '@core/Util';

export function SectionVideoWallConfig(): ReactElement {
  const dispatch = useDispatch();
  const { videoWallEnabled = false, videoWallBezelComp } = useSelector(({ appSettings }: RootState) => appSettings);
  const nativeResolution = useRef<string>('1920x1080');
  const [videoWallOutputs, setVideoWallOutputs] = useState<VideoModeScreenConfig[] | undefined>();
  const [nextConfig, setNextConfig] = useState<VideoModeScreenConfig[] | undefined>();
  const [previewConfig, setPreviewConfig] = useState<VideoModeScreenConfig[] | undefined>();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [layoutOptions, setLayoutOptions] = useState<{ value: string }[]>([]);
  const [layout, setLayout] = useState<string>('');
  const [bezelCompensation, setBezelCompensation] = useState<BezelCompensation>(
    videoWallBezelComp ?? {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    }
  );

  // Track the number of enabled displays with a ref to detect changes
  const enabledDisplaysCountRef = useRef<number>(0);

  // Define handleLayoutChange with useCallback to avoid dependency issues
  const handleLayoutChange = useCallback((newLayout: string) => {
    if (newLayout) {
      Logger.debug(`[DISPLAY] Setting layout to ${newLayout}`);
      setLayout(newLayout);
    }
  }, []);

  // Update layout preview without causing infinite loop
  useEffect(() => {
    if (layout && nextConfig) {
      const enabledOutputs = nextConfig.filter((output) => output.enabled);
      if (enabledOutputs.length > 0) {
        const updatedPreviewConfig = nextConfig.map((output, index) => {
          if (output.enabled) {
            const { x, y } = getEstimatedPosition(
              index,
              layout,
              nativeResolution.current,
              bezelCompensation,
              output.transform
            );
            return {
              ...output,
              screenX: x,
              screenY: y,
            };
          }
          return output;
        });

        // Update preview config instead of nextConfig
        setPreviewConfig(updatedPreviewConfig);
      }
    }
  }, [layout, bezelCompensation, nextConfig]);

  useEffect(() => {
    const getOutputs = async () => {
      Logger.log('[DISPLAY] Getting available video config outputs...');

      const [initialOutputs, { best }] = await Promise.all([
        window.DeviceAPI.getDisplayConfig(),
        window.DeviceAPI.getResolutions(),
      ]);
      let outputs = initialOutputs;

      nativeResolution.current = best.replace(/@\d+/, '');
      outputs = outputs?.filter((out) => !out.outputName.includes('TypeC')) ?? [];
      Logger.debug(`[DISPLAY] Video config outputs: ${JSON.stringify(outputs)}`);
      const _layout = extractLayoutFromConfig(outputs);
      // make sure that all outputs have a videoMode set to 'auto'
      outputs = outputs.map((output) => ({
        ...output,
        videoMode: output.videoMode || 'auto',
      }));

      setVideoWallOutputs(outputs);
      setNextConfig(outputs);
      setPreviewConfig(outputs);
      const options = getLayoutOptions(outputs);
      setLayoutOptions(options);

      const layoutToUse = _layout || (options.length > 0 ? options[0].value : '1x1');
      handleLayoutChange(layoutToUse);
    };

    if (videoWallEnabled && !videoWallOutputs) {
      getOutputs();
    }
  }, [videoWallEnabled, videoWallOutputs, handleLayoutChange]);

  const handleToggle = () => {
    dispatch(setVideoWallEnabled({ value: !videoWallEnabled }));
  };

  const onClickApply = async () => {
    if (!videoWallEnabled) {
      // reset the config to default
      const defaultConfig: VideoModeScreenConfig[] = videoWallOutputs?.map((output, i) => ({
        ...output,
        enabled: i === 0,
        screenX: 0,
        screenY: 0,
        videoMode: 'auto',
        transform: 'normal',
      })) ?? [
        {
          outputName: 'HDMI-1',
          enabled: true,
          screenX: 0,
          screenY: 0,
          videoMode: 'auto',
          transform: 'normal',
        },
      ];

      const rebootRequired = await window.DeviceAPI.setDisplayConfig(defaultConfig);

      if (rebootRequired) {
        Logger.log('[DISPLAY] Reboot required to apply changes');
        window.DeviceAPI.reboot();
      } else {
        Logger.log('[DISPLAY] Changes applied successfully without reboot');
      }
      return;
    }

    if (nextConfig) {
      const updatedConfig = previewConfig
        ? [...previewConfig]
        : nextConfig.map((output, index) => {
            const { x, y } = getEstimatedPosition(
              index,
              layout,
              nativeResolution.current,
              bezelCompensation,
              output.transform
            );

            return output.enabled
              ? {
                  ...output,
                  screenX: x,
                  screenY: y,
                  videoMode: 'auto',
                }
              : { ...output, videoMode: 'auto' };
          });

      setNextConfig(updatedConfig);

      const rebootRequired = await window.DeviceAPI.setDisplayConfig(updatedConfig);
      if (rebootRequired) {
        Logger.log('[DISPLAY] Reboot required to apply changes');
        window.DeviceAPI.reboot();
      } else {
        Logger.log('[DISPLAY] Changes applied successfully without reboot');
      }
    }
  };

  const onRotationChange = (index: number, transform: VideoModeScreenConfig['transform']) => {
    if (nextConfig) {
      const newConfig = [...nextConfig];
      newConfig[index].transform = transform;
      setNextConfig(newConfig);

      // Also update the preview config when rotation changes
      if (previewConfig) {
        const newPreviewConfig = [...previewConfig];
        newPreviewConfig[index].transform = transform;
        setPreviewConfig(newPreviewConfig);
      }
    }
  };

  const handleBezelCompensationChange = (side: 'top' | 'left' | 'bottom' | 'right', value: number) => {
    setBezelCompensation((prev) => ({
      ...prev,
      [side]: value,
    }));

    dispatch(
      setVideoWallBezelComp({
        ...videoWallBezelComp,
        [side]: value,
      } as BezelCompensation)
    );
  };

  useEffect(() => {
    if (nextConfig) {
      const enabledDisplaysCount = nextConfig.filter((config) => config.enabled).length;

      // Only update layout options when the number of enabled displays changes
      if (enabledDisplaysCount !== enabledDisplaysCountRef.current) {
        enabledDisplaysCountRef.current = enabledDisplaysCount;
        const options = getLayoutOptions(nextConfig);
        setLayoutOptions(options);

        // Set default layout if current layout is invalid or none is selected
        if (options.length > 0) {
          const isCurrentLayoutValid = options.some((option) => option.value === layout);
          if (!isCurrentLayoutValid || !layout) {
            handleLayoutChange(options[0].value);
          }
        }
      }
    }
  }, [nextConfig, layout, handleLayoutChange]);

  return (
    <section className="video-wall-config">
      <h4>Video Wall</h4>
      <div className="stack gap-m ai-fs jc-fs">
        <div className="grow-0 shrink-1">
          <Toggle
            checked={videoWallEnabled}
            name=""
            onChange={handleToggle}
            id="video-wall-toggle"
            falseName="Off"
            trueName="On"
          />
        </div>

        {videoWallEnabled && nextConfig?.length ? (
          <div className="stack gap-l">
            <div>
              <h4>Outputs</h4>
              {nextConfig?.length ? (
                <Tabs
                  tabNames={nextConfig.map(({ outputName }) => outputName)}
                  onTabChange={(index) => {
                    setActiveTab(index);
                  }}
                  activeTab={activeTab}
                />
              ) : null}

              {nextConfig?.map(({ outputName }, index) => (
                <TabPanel key={outputName} value={activeTab} index={index}>
                  <div className="row">
                    <Checkbox
                      checked={nextConfig?.[index].enabled}
                      name="Enabled"
                      onChange={() => {
                        if (nextConfig) {
                          const newConfig = [...nextConfig];
                          newConfig[index].enabled = !newConfig[index].enabled;
                          setNextConfig(newConfig);
                        }
                      }}
                      id={`${outputName}-enabled`}
                    />

                    <div className="stack grow-1 shrink-0 rotation">
                      Rotation
                      <Dropdown
                        options={[{ value: 'normal' }, { value: '90' }, { value: '180' }, { value: '270' }]}
                        defaultOption="normal"
                        id="rotation"
                        selection={nextConfig?.[index].transform}
                        onChange={(transform) => {
                          onRotationChange(index, transform as VideoModeScreenConfig['transform']);
                        }}
                      />
                    </div>
                  </div>
                </TabPanel>
              ))}
            </div>

            {layoutOptions.length > 0 && layout ? (
              <div className="stack shrink-0 grow-1">
                Layout:
                <Dropdown
                  options={layoutOptions}
                  id="video-wall-layout"
                  defaultOption={layout}
                  onChange={handleLayoutChange}
                  selection={layout}
                />
              </div>
            ) : null}

            <BezelCompensationForm
              bezelCompensation={bezelCompensation}
              setBezelCompensation={handleBezelCompensationChange}
            />

            <LayoutPreview
              layout={layout}
              nextConfig={previewConfig ?? nextConfig}
              bezelCompensation={bezelCompensation}
            />
          </div>
        ) : null}

        <Button
          className="video-wall-apply-button"
          onClick={onClickApply}
          disabled={nextConfig?.length === 0}
          color={UIColor.Purple}
          id="video-wall-apply-button"
        >
          Apply
        </Button>
      </div>
    </section>
  );
}
