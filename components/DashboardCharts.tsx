"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  label: string;
  athletes: number;
}

export default function DashboardCharts({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="athleteGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E6007E" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#E6007E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #E4E4E7",
            borderRadius: "10px",
            fontSize: "12px",
          }}
          formatter={(value) => [value, "Nouveaux athlètes"]}
          labelFormatter={(label) => `Le ${label}`}
        />
        <Area
          type="monotone"
          dataKey="athletes"
          stroke="#E6007E"
          strokeWidth={2}
          fill="url(#athleteGradient)"
          dot={{ fill: "#E6007E", r: 3 }}
          activeDot={{ r: 5, fill: "#E6007E" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
