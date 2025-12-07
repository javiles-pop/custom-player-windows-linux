import { UIColor } from '@core/constants';
import React from 'react';
import { PieChart, Pie, Cell, Legend } from 'recharts';

interface StorageChartProps {
  data: DiskGraphData[];
  totalStorage: number;
}

export default function RAMChart({ data, totalStorage }: StorageChartProps) {
  const COLORS = [UIColor.Purple, UIColor.Grey_light];
  const [, free] = data;

  return (
    <div className="storage-chart" id="StorageChart">
      <PieChart width={300} height={275} cx={0} cy={0}>
        <Pie
          data={data}
          cx={0}
          cy={0}
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={`var(--${COLORS[index % COLORS.length]})`} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
      <p className="storage-totals helper">
        {totalStorage == 0 ? '100%' : `${Math.floor(Number(free.value))}% of ${totalStorage}GB`} available
      </p>
    </div>
  );
}
