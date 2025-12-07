import { UIColor } from '@core/constants';
import React from 'react';
import { PieChart, Pie, Cell, Legend } from 'recharts';

interface RAMChartProps {
  data: RAMGraphData[];
  totalRam: number;
}
export default function RAMChart({ data, totalRam }: RAMChartProps) {
  const COLORS = [UIColor.Purple, UIColor.Grey_light];
  const [used, free] = data;

  return (
    <div className="memory-chart" id="MemoryChart">
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
      <p className="ram-totals helper">
        {Math.floor((free.value / (used.value + free.value)) * 100)}% {totalRam === 0 ? '' : `of ${totalRam}GB`}{' '}
        available
      </p>
    </div>
  );
}
