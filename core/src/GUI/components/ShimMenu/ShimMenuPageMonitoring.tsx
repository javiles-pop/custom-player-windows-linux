import React, { useEffect, useMemo, useState } from 'react';
import useWebsocket, { ReadyState } from 'react-use-websocket';
import {
  initialCPUData,
  initialRamData,
  extractMonitoringData,
  formatTimeFromNow,
  initialStorageData,
} from '../Charts/ChartUtils';
import { Logger } from '@core/Util';
import ShimMenuHeader from './ShimMenuHeader';
import CPUChart from '../Charts/CPUChart';
import RAMChart from '../Charts/RAMChart';
import StorageChart from '../Charts/StorageChart';
import { format } from 'date-fns';
import { DiskKeys, TimeFormats } from '@core/constants';
import { onMount } from '@core/GUI/hooks/onMount';

export default function ShimMenuMonitoring() {
  const [CPUdata, setCPUData] = useState(initialCPUData);
  const [RAMdata, setRAMdata] = useState<RAMGraphData[]>(initialRamData);
  const [storageData, setStorageData] = useState<DiskGraphData[]>(initialStorageData);
  const [totalRamMB, setTotalRamMB] = useState(0);
  const [totalStorage, setTotalStorage] = useState(0);
  const totalRam = useMemo<number>(() => Math.floor(totalRamMB / 1000), [totalRamMB]);
  const { lastMessage, readyState } = useWebsocket('ws://localhost:9092');

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

  onMount(() => {
    const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
    backButton?.focus();
    document.querySelector('.menu-container')?.scrollTo(0, 0);
  });

  // Render
  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Monitoring" />
      <div className="shim-menu-monitoring menu-container">
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
          </div>
        </section>
      </div>
    </>
  );
}
