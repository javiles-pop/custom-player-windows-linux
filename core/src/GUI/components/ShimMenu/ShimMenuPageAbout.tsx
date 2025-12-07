import React, { useState, useEffect, useMemo } from 'react';
import ShimMenuHeader from './ShimMenuHeader';
import { Logger } from '@core/Util';
import { useIPAddress } from '@core/GUI/hooks/useIPAddress';
import { DiskKeys, TimeFormats, UIColor } from '@core/constants';
import { format } from 'date-fns';
import useWebsocket, { ReadyState } from 'react-use-websocket';
import {
  initialCPUData,
  initialRamData,
  initialStorageData,
  extractMonitoringData,
  formatTimeFromNow,
} from '../Charts/ChartUtils';
import CPUChart from '../Charts/CPUChart';
import RAMChart from '../Charts/RAMChart';
import StorageChart from '../Charts/StorageChart';
import Button from '../Button';
interface AboutInfo {
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  manufacturer: string;
}

export default function ShimMenuAbout() {
  const [aboutInfo, setAboutInfo] = useState<AboutInfo>({
    model: '--',
    serialNumber: '--',
    firmwareVersion: '--',
    manufacturer: '--',
  } as AboutInfo);

  const { ipAddress, macAddress } = useIPAddress();
  const [CPUdata, setCPUData] = useState(initialCPUData);
  const [RAMdata, setRAMdata] = useState<RAMGraphData[]>(initialRamData);
  const [storageData, setStorageData] = useState<DiskGraphData[]>(initialStorageData);
  const [totalRamMB, setTotalRamMB] = useState(0);
  const [totalStorage, setTotalStorage] = useState(0);
  const totalRam = useMemo<number>(() => Math.floor(totalRamMB / 1000), [totalRamMB]);
  const { lastMessage, readyState } = useWebsocket('ws://localhost:9092');

  useEffect(() => {
    if (aboutInfo.manufacturer === '--') {
      Logger.info('Fetching About data for device.');
      getAboutInfo().then((state) => {
        setAboutInfo(state as AboutInfo);
      });
    }
  }, [aboutInfo]);

  const getAboutInfo = async () => {
    const model = await window.DeviceAPI?.getModel();
    const serialNumber = await window.DeviceAPI?.getSerialNumber();
    const firmwareVersion = await window.DeviceAPI?.getFirmwareVersion();
    const manufacturer = window.DeviceAPI?.getManufacturer();
    return {
      model,
      serialNumber,
      firmwareVersion,
      manufacturer,
    } as AboutInfo;
  };

  useEffect(() => {
    try {
      const { cpu, ram, disk, totalStorage, totalRAM } = extractMonitoringData(lastMessage, CPUdata);
      setCPUData(cpu);
      setRAMdata(ram);
      setStorageData(disk);
      setTotalStorage(totalStorage);

      if (!totalRamMB) {
        setTotalRamMB(totalRAM);
      }
    } catch {
      // Do nothing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  useEffect(() => {
    Logger.debug(`[MONITORING] Websocket connection state: ${ReadyState[readyState]}`);
  }, [readyState]);

  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="About" />
      <div className="shim-menu-about shim-menu-monitoring menu-container">
        <Button
          className="visually-hidden"
          color={UIColor.Purple}
          id={'button-about-anchor'}
          onClick={() => {
            const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
            backButton?.focus();
          }}
        >
          Back
        </Button>
        <section className="platform tight">
          <h4>Platform</h4>
          <div className="row">
            <div className="stat">
              <h4>Serial Number</h4>
              <p>{aboutInfo.serialNumber}</p>
            </div>

            <div className="stat">
              <h4>Model</h4>
              <p>{aboutInfo.model}</p>
            </div>

            <div className="stat">
              <h4>Firmware Version</h4>
              <p>{aboutInfo.firmwareVersion}</p>
            </div>

            <div className="stat">
              <h4>Manufacturer</h4>
              <p>{aboutInfo.manufacturer}</p>
            </div>
          </div>
        </section>

        <section className="network tight">
          <h4>Network</h4>
          <div className="row">
            <div className="stat">
              <h4>IP Address</h4>
              <p>{ipAddress}</p>
            </div>

            <div className="stat">
              <h4>MAC Address</h4>
              <p>{macAddress}</p>
            </div>
          </div>
        </section>
        {window.DeviceAPI.supportsMonitoring ? (
          <section>
            <h4>Monitoring</h4>
            <div className="chart-wrapper">
              <CPUChart data={CPUdata} formatter={formatTimeFromNow} />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RAMChart data={RAMdata} totalRam={totalRam} />
                <StorageChart data={storageData} totalStorage={totalStorage} />
              </div>
              <p className="helper">
                <strong>Last Reboot:</strong>{' '}
                <span id="last-reboot">
                  {format(new Date(Number(window.DeviceAPI.getSetting(DiskKeys.LastBoot))), TimeFormats.DateTime)}
                </span>
              </p>

              {/* This button needs to exist because there are no interactive scroll points below the fold on this page.
            Putting a hidden button at the bottom allows the user to scroll to this button to see the content.  */}
              <Button
                className="visually-hidden"
                color={UIColor.Purple}
                id={'button-monitoring-anchor'}
                onClick={() => {
                  const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
                  backButton?.focus();
                }}
              >
                Back
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
