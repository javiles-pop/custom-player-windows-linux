import React from 'react';
import ShimMenuHeader from './ShimMenuHeader';
import { SectionDisplayOrientation } from './SectionDisplayOrientation';
import DisplayControl from './ShimMenuSectionDisplayControl';
import { SectionDisplayResolution } from './SectionDisplayResolution';
import { SectionVideoWallConfig } from './VideoWall/SectionVideoWallConfig';

export default function ShimMenuDisplayOrientation() {
  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Display" />
      <div className="menu-container">
        <SectionDisplayOrientation />
        {window.DeviceAPI.supportsCECControl ? <DisplayControl /> : null}
        {window.DeviceAPI.supportsCustomResolution ? <SectionDisplayResolution /> : null}
        {window.DeviceAPI.supportsVideoWall ? <SectionVideoWallConfig /> : null}
      </div>
    </>
  );
}
