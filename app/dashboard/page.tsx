"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut,
  Play,
  RefreshCw,
  Download,
  Key,
  Loader2,
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import GlassPanel from "@/components/GlassPanel";
import KPICards from "@/components/KPICards";
import ForecastChart from "@/components/ForecastChart";
import Forecast3D from "@/components/Forecast3D";
import UploadZone from "@/components/UploadZone";
import {
  uploadCSV,
  trainModel,
  predict,
  getMe,
  PredictPoint,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [days, setDays] = useState(30);
  const [forecast, setForecast] = useState<PredictPoint[]>([]);
  const [loadingTrain, setLoadingTrain] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("fp_api_key");
    const name = localStorage.getItem("fp_tenant_name") || "Cliente";
    if (!key) {
      router.replace("/");
      return;
    }
    setApiKey(key);
    setTenantName(name);
    getMe(key)
      .then(() => setReady(true))
      .catch(() => {
        localStorage.removeItem("fp_api_key");
        router.replace("/");
      });
  }, [router]);

  const handleUpload = async (file: File) => {
    setError("");
    setStatus("Subiendo y validando archivo...");
    try {
      const result = await uploadCSV(apiKey, file);
      const warnings: string[] = [];
      if (result.rows_removed > 0) warnings.push(`${result.rows_removed} filas descartadas por datos inválidos.`);
      if (result.duplicate_rows_aggregated > 0) warnings.push(`${result.duplicate_rows_aggregated} filas del mismo día agrupadas.`);
      if (result.missing_days_in_range > 0) warnings.push(`${result.missing_days_in_range} días sin registro; completa la serie diaria antes de entrenar.`);
      const summary = `${result.rows.toLocaleString("es-GT")} días válidos · ${result.date_min} a ${result.date_max}.`;
      setStatus([summary, ...warnings].join(" "));
    } catch (uploadError: any) {
      setStatus("");
      setError(uploadError?.message || "No se pudo cargar el archivo.");
      throw uploadError;
    }
  };

  const handleTrain = async () => {
    setLoadingTrain(true);
    setError("");
    setStatus("Entrenando modelo Holt-Winters...");
    try {
      await trainModel(apiKey);
      setStatus("Modelo entrenado. Genera el forecast.");
    } catch (e: any) {
      setError(e.message);
      setStatus("");
    } finally {
      setLoadingTrain(false);
    }
  };

  const handlePredict = async () => {
    setLoadingPredict(true);
    setError("");
    setStatus("Generando forecast...");
    try {
      const res = await predict(apiKey, days);
      // Normalizar respuesta (puede venir como array o como { forecast: [] })
      const points = Array.isArray(res) ? res : res.forecast || [];
      setForecast(points);
      setStatus(`Forecast de ${days} días listo`);
    } catch (e: any) {
      setError(e.message);
      setStatus("");
    } finally {
      setLoadingPredict(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fp_api_key");
    localStorage.removeItem("fp_tenant_name");
    router.replace("/");
  };

  // KPIs derivados
  const avg =
    forecast.length > 0
      ? forecast.reduce((s, d) => s + d.yhat, 0) / forecast.length
      : 0;
  const first = forecast[0]?.yhat || 0;
  const last = forecast[forecast.length - 1]?.yhat || 0;
  const trend = first ? ((last - first) / first) * 100 : 0;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-pearl-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              ForecastPro{" "}
              <span className="text-pearl-400">LATAM</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {tenantName} · Dashboard comercial
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 glass px-3 py-1.5 rounded-lg">
              <Key className="w-3.5 h-3.5" />
              {apiKey.slice(0, 12)}...
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        {/* Actions row */}
        <GlassPanel className="mb-6" delay={0.05}>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                1. Subir datos
              </h3>
              <UploadZone onUpload={handleUpload} />
            </div>
            <div className="flex flex-col justify-center gap-3">
              <h3 className="text-sm font-medium text-slate-300 mb-1">
                2. Entrenar modelo
              </h3>
              <button
                onClick={handleTrain}
                disabled={loadingTrain}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {loadingTrain ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Entrenar modelo
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                </select>
                <button
                  onClick={handlePredict}
                  disabled={loadingPredict}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-pearl-500 to-sky-500 text-slate-950 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loadingPredict ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Generar forecast
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-medium text-slate-300 mb-2">
                Estado
              </h3>
              {status && (
                <p className="text-sm text-pearl-300">{status}</p>
              )}
              {error && (
                <p className="text-sm text-rose-400 mt-1">{error}</p>
              )}
              {!status && !error && (
                <p className="text-sm text-slate-500">
                  Sube un CSV → Entrena → Genera forecast
                </p>
              )}
            </div>
          </div>
        </GlassPanel>

        {/* KPIs */}
        {forecast.length > 0 && (
          <div className="mb-6">
            <KPICards
              avgForecast={avg}
              trend={trend}
              forecastPoints={forecast.length}
              days={days}
            />
          </div>
        )}

        {/* Charts */}
        {forecast.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <GlassPanel delay={0.1}>
              <h3 className="text-sm font-medium text-slate-300 mb-4">
                Forecast 2D · Rango estimado
              </h3>
              <ForecastChart data={forecast} />
            </GlassPanel>
            <GlassPanel delay={0.15}>
              <h3 className="text-sm font-medium text-slate-300 mb-4">
                Visualización 3D · Arrastra para explorar
              </h3>
              <Forecast3D data={forecast} />
            </GlassPanel>
          </div>
        )}

        {/* Table */}
        {forecast.length > 0 && (
          <GlassPanel delay={0.2}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">
                Detalle diario
              </h3>
              <button
                onClick={() => {
                  const csv = [
                    "ds,yhat,yhat_lower,yhat_upper",
                    ...forecast.map(
                      (d) =>
                        `${d.ds},${d.yhat.toFixed(2)},${d.yhat_lower.toFixed(2)},${d.yhat_upper.toFixed(2)}`
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `forecast_${days}d.csv`;
                  a.click();
                }}
                className="flex items-center gap-1.5 text-xs text-pearl-400 hover:text-pearl-300"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar CSV
              </button>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-700">
                    <th className="pb-2 pr-4">Fecha</th>
                    <th className="pb-2 pr-4">Forecast</th>
                    <th className="pb-2 pr-4">Inferior</th>
                    <th className="pb-2">Superior</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.slice(0, 15).map((d) => (
                    <tr
                      key={d.ds}
                      className="border-b border-slate-800/50 text-slate-300"
                    >
                      <td className="py-2 pr-4">{d.ds}</td>
                      <td className="py-2 pr-4 font-medium text-pearl-300">
                        {Math.round(d.yhat).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-slate-400">
                        {Math.round(d.yhat_lower).toLocaleString()}
                      </td>
                      <td className="py-2">
                        {Math.round(d.yhat_upper).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {forecast.length > 15 && (
                <p className="text-xs text-slate-500 mt-2">
                  Mostrando 15 de {forecast.length} días · Descarga el CSV para ver todo
                </p>
              )}
            </div>
          </GlassPanel>
        )}

        {forecast.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg mb-2">Aún no hay forecast</p>
            <p className="text-sm">
              Sube un CSV con columnas <code className="text-pearl-400">ds</code> y{" "}
              <code className="text-pearl-400">y</code>, entrena y genera.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
