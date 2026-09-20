"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PredictPoint } from "@/lib/api";

interface Props {
  data: PredictPoint[];
}

export default function ForecastChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d.ds.slice(5), // MM-DD
    fullDate: d.ds,
    forecast: Math.round(d.yhat),
    lower: Math.round(d.yhat_lower),
    upper: Math.round(d.yhat_upper),
  }));

  return (
    <div className="w-full h-[320px] md:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748B" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "12px",
              color: "#e2e8f0",
            }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullDate || ""
            }
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="upper"
            stroke="transparent"
            fill="url(#colorBand)"
            name="Banda superior"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="transparent"
            fill="url(#colorBand)"
            name="Banda inferior"
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#38BDF8"
            strokeWidth={2.5}
            fill="url(#colorForecast)"
            name="Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
