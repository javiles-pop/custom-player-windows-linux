import { UIColor } from '@core/constants';
import React from 'react';
import { AreaChart, XAxis, YAxis, Area, Legend, CartesianGrid } from 'recharts';
interface CPUChartProps {
  data: CPUGraphData[];
  formatter?: (value: string, index?: number) => string;
}
export default function CPUChart({ data, formatter }: CPUChartProps) {
  return (
    <div className="cpu-chart" id="CPUChart">
      <AreaChart
        width={800}
        height={225}
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <XAxis dataKey="label" textAnchor="start" tickCount={20} interval={0} tickFormatter={formatter} />
        <YAxis domain={[0, 100]} unit="%" />
        <CartesianGrid strokeOpacity={0.5} />
        <Area
          type="monotone"
          dataKey="cpu"
          stroke={`var(--${UIColor.Purple})`}
          fill={`var(--${UIColor.Purple})`}
          isAnimationActive={false}
          name="CPU Usage"
        />
        <Legend />
      </AreaChart>
    </div>
  );
}
