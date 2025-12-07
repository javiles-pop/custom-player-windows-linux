import React, { type ReactElement } from 'react';
import { BezelCompensation } from './util';

interface LayoutPreviewProps {
  layout: string;
  nextConfig: VideoModeScreenConfig[] | undefined;
  bezelCompensation: BezelCompensation;
}

export function LayoutPreview({ layout, nextConfig, bezelCompensation }: LayoutPreviewProps): ReactElement {
  return (
    <div>
      <h4>Layout Preview</h4>
      {layout && nextConfig?.filter((output) => output.enabled).length ? (
        <div className="video-wall-layout-preview">
          {(() => {
            const [cols, rows] = layout.split('x').map(Number);
            const enabledOutputs = nextConfig?.filter((output) => output.enabled) || [];
            const previewRows = [];

            for (let r = 0; r < rows; r++) {
              const rowScreens = [];
              for (let c = 0; c < cols; c++) {
                const index = r * cols + c;
                if (index < enabledOutputs.length) {
                  rowScreens.push(
                    <div
                      key={`screen-${index}`}
                      className={`bezel-comp-preview rot-${enabledOutputs[index].transform}`}
                      style={{
                        borderTopWidth: `${bezelCompensation.top}px`,
                        borderLeftWidth: `${bezelCompensation.left}px`,
                        borderBottomWidth: `${bezelCompensation.bottom}px`,
                        borderRightWidth: `${bezelCompensation.right}px`,
                      }}
                    >
                      <span className="screen-label">{enabledOutputs[index].outputName}</span>
                    </div>
                  );
                }
              }
              previewRows.push(
                <div key={`row-${r}`} className="row">
                  {rowScreens}
                </div>
              );
            }

            return previewRows;
          })()}
        </div>
      ) : null}
    </div>
  );
}
