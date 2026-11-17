"use client";

import { motion } from "framer-motion";
import { TrendingUp, Target, Activity, Calendar } from "lucide-react";

interface Props {
  avgForecast: number;
  trend: number;
  forecastPoints: number;
  days: number;
}

export default function KPICards({ avgForecast, trend, forecastPoints, days }: Props) {
  const cards = [
    {
      label: "Promedio proyectado",
      value: avgForecast.toLocaleString("es-GT", { maximumFractionDigits: 0 }),
      icon: TrendingUp,
      color: "text-pearl-400",
      suffix: "",
    },
    {
      label: "Variación del horizonte",
      value: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`,
      icon: Activity,
      color: trend >= 0 ? "text-emerald-400" : "text-rose-400",
      suffix: "",
    },
    {
      label: "Puntos proyectados",
      value: forecastPoints.toLocaleString("es-GT"),
      icon: Target,
      color: "text-amber-400",
      suffix: "",
    },
    {
      label: "Horizonte",
      value: `${days}`,
      icon: Calendar,
      color: "text-sky-400",
      suffix: " días",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i }}
          className="glass rounded-xl p-4 border border-slate-700/50 hover:border-pearl-500/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              {card.label}
            </span>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <div className="text-2xl font-semibold text-white">
            {card.value}
            <span className="text-sm font-normal text-slate-400">{card.suffix}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
