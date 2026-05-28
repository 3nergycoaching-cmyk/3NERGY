"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  name: string;
  revenue: number;
  couleur: string;
}

interface Props {
  data: DataPoint[];
}

const formatEuro = (value: number) => `${value.toLocaleString("fr-FR")} €`;

export default function FinanceChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
        Aucune donnée à afficher
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v} €`}
          width={58}
        />
        <Tooltip
          formatter={(value) => [formatEuro(Number(value)), "Revenus"]}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "13px",
          }}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={52}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.couleur} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
