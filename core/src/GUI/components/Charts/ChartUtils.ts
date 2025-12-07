export function formatTimeFromNow(value: string) {
  if (value === '') return value;
  const now = new Date().getTime() / 1000;
  const then = new Date(Number(value)).getTime() / 1000;

  return `${Math.round(then - now)}s`;
}

export const initialCPUData: CPUGraphData[] = Array(20)
  .fill(0)
  .map(() => {
    return {
      label: '',
      cpu: 0,
    };
  })
  .reverse();

export const initialRamData = [
  { name: 'RAM Used', value: 0 },
  { name: 'RAM Free', value: 100 },
];

export const initialStorageData = [
  { name: 'Disk Used', value: 0 },
  { name: 'Disk Free', value: 100 },
];

export const extractMonitoringData = (
  lastMessage: MessageEvent<unknown> | null,
  CPUdata: CPUGraphData[]
): { cpu: CPUGraphData[]; ram: RAMGraphData[]; disk: DiskGraphData[]; totalStorage: number; totalRAM: number } => {
  try {
    const data = JSON.parse(lastMessage?.data as string);
    if (data) {
      const { cpu, memory, disk } = data;
      const newCPUData = [
        ...CPUdata,
        {
          label: new Date().getTime(),
          cpu,
        },
      ];
      newCPUData.length > 20 ? newCPUData.shift() : null;

      const ramData = [
        { name: 'RAM Used', value: memory.usedMemMb },
        { name: 'RAM Free', value: memory.freeMemMb },
      ];

      const diskData = [
        { name: 'Disk Used', value: Number(disk.usedPercentage) },
        { name: 'Disk Free', value: Number(disk.freePercentage) },
      ];

      return { cpu: newCPUData, ram: ramData, disk: diskData, totalStorage: disk.totalGb, totalRAM: memory.totalMemMb };
    }
  } catch (error) {
    return { cpu: initialCPUData, ram: initialRamData, disk: initialStorageData, totalStorage: 0, totalRAM: 0 };
  }
  return { cpu: initialCPUData, ram: initialRamData, disk: initialStorageData, totalStorage: 0, totalRAM: 0 };
};
