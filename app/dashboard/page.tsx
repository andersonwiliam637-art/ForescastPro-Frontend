"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, ArrowUpRight, BarChart3, Bell, CalendarDays,
  CheckCircle2, ChevronRight, CircleHelp, Clock3, Database, FileSpreadsheet,
  FileText, Gauge, KeyRound, LayoutDashboard, Loader2, LogOut, Menu, Play,
  RefreshCw, ShieldCheck, Sparkles, TrendingUp, UploadCloud, X
} from "lucide-react";
import ForecastChart from "@/components/ForecastChart";
import Forecast3D from "@/components/Forecast3D";
import UploadZone from "@/components/UploadZone";
import { uploadCSV, trainModel, predict, getMe } from "@/lib/api";
import type { PredictPoint, UploadResponse } from "@/lib/api";

type ThemeName = "red" | "gray" | "black";
const navigation = [
  { id: "overview", label: "Resumen general", icon: LayoutDashboard },
  { id: "documents", label: "Centro documental", icon: FileSpreadsheet },
  { id: "forecasts", label: "Pronósticos", icon: TrendingUp },
  { id: "model", label: "Modelo analítico", icon: Gauge },
];
const formatNumber = (value: number) => value.toLocaleString("es-GT", { maximumFractionDigits: 0 });

export default function DashboardPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [days, setDays] = useState(30);
  const [forecast, setForecast] = useState<PredictPoint[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadResponse | null>(null);
  const [loadingTrain, setLoadingTrain] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("red");
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const themeVars = {
    red: { accent: "#ef4444", soft: "rgba(239,68,68,.13)", bg: "#090b10" },
    gray: { accent: "#a3a3a3", soft: "rgba(163,163,163,.12)", bg: "#0d1015" },
    black: { accent: "#f1f5f9", soft: "rgba(241,245,249,.1)", bg: "#030405" },
  }[theme];

  useEffect(() => {
    const key = localStorage.getItem("fp_api_key");
    const name = localStorage.getItem("fp_tenant_name") || "Empresa";
    if (!key) { router.replace("/"); return; }
    setApiKey(key);
    setTenantName(name);
    getMe(key).then((data) => { setWorkspace(data); setReady(true); }).catch(() => {
      localStorage.removeItem("fp_api_key");
      router.replace("/");
    });
  }, [router]);

  const refreshWorkspace = async () => {
    if (!apiKey) return;
    const data = await getMe(apiKey);
    setWorkspace(data);
  };

  const handleUpload = async (file: File) => {
    setError("");
    setStatus("Leyendo documento y detectando tablas...");
    try {
      const result = await uploadCSV(apiKey, file);
      setUploadSummary(result);
      const firstTable = result.detected_tables && result.detected_tables[0];
      const recognition = firstTable
        ? "Detecté " + (result.detected_table_count || 1) + " tabla(s): " + firstTable.date_column + " → fecha; " + firstTable.sales_column + " → métrica."
        : "Se reconoció la estructura de ventas del documento.";
      const quality = [
        formatNumber(result.rows) + " registros diarios válidos (" + result.date_min + " a " + result.date_max + ").",
        recognition,
        result.rows_removed > 0 ? result.rows_removed + " filas descartadas." : "",
        result.duplicate_rows_aggregated > 0 ? result.duplicate_rows_aggregated + " registros del mismo día agrupados." : "",
        result.missing_days_in_range > 0 ? result.missing_days_in_range + " días sin registro; completa la serie antes de entrenar." : "Serie diaria sin días faltantes.",
      ].filter(Boolean);
      setStatus(quality.join(" "));
      await refreshWorkspace();
    } catch (uploadError: any) {
      setStatus("");
      setError(uploadError?.message || "No se pudo procesar el documento.");
      throw uploadError;
    }
  };

  const handleTrain = async () => {
    setLoadingTrain(true); setError(""); setStatus("Entrenando el modelo Holt-Winters...");
    try {
      await trainModel(apiKey);
      await refreshWorkspace();
      setStatus("Modelo entrenado correctamente. Ya puedes generar un pronóstico.");
    } catch (e: any) { setError(e.message || "No se pudo entrenar el modelo."); setStatus(""); }
    finally { setLoadingTrain(false); }
  };

  const handlePredict = async () => {
    setLoadingPredict(true); setError(""); setStatus("Calculando proyección para " + days + " días...");
    try {
      const result = await predict(apiKey, days);
      setForecast(result.forecast || []);
      setActiveSection("forecasts");
      setStatus("Pronóstico de " + days + " días generado.");
    } catch (e: any) { setError(e.message || "No se pudo generar el pronóstico."); setStatus(""); }
    finally { setLoadingPredict(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("fp_api_key");
    localStorage.removeItem("fp_tenant_name");
    router.replace("/");
  };
  const average = useMemo(() => forecast.length ? forecast.reduce((sum, point) => sum + point.yhat, 0) / forecast.length : 0, [forecast]);
  const first = forecast[0]?.yhat || 0;
  const last = forecast[forecast.length - 1]?.yhat || 0;
  const trend = first ? ((last - first) / first) * 100 : 0;
  const rowsAnalyzed = uploadSummary?.rows ?? workspace?.last_upload?.rows ?? null;
  const modelReady = workspace?.model_status === "ready" || forecast.length > 0;

  const handleNavigation = (id: string) => {
    setActiveSection(id); setMobileNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-[#090b10]"><Loader2 className="h-8 w-8 animate-spin text-red-400" /></div>;

  const sidebar = (
    <aside className="flex h-full w-[258px] flex-col border-r border-white/[0.07] bg-[#0b0d12] px-5 py-6">
      <div className="mb-10 flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-950/40"><Activity className="h-5 w-5" /></div>
        <div><p className="text-[15px] font-bold tracking-wide text-white">FORECAST<span className="text-red-400">PRO</span></p><p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">Executive Intelligence</p></div>
      </div>
      <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Workspace</p>
      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return <button key={item.id} onClick={() => handleNavigation(item.id)} className={"group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] transition " + (active ? "bg-red-500/10 text-white ring-1 ring-red-500/20" : "text-slate-400 hover:bg-white/[0.04] hover:text-white")}>
            <Icon className={"h-[17px] w-[17px] " + (active ? "text-red-400" : "text-slate-500")} /><span className="flex-1">{item.label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-red-400" />}
          </button>;
        })}
      </nav>
      <div className="mt-9 rounded-2xl border border-white/[0.07] bg-[#11141b] p-4">
        <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /><span className="text-xs font-semibold text-slate-200">Espacio aislado</span></div>
        <p className="text-[11px] leading-5 text-slate-500">Tus datos y modelos se guardan en el espacio de tu empresa.</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> PostgreSQL conectado</div>
      </div>
      <div className="mt-auto border-t border-white/[0.07] pt-5">
        <div className="mb-4 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#1b202a] text-xs font-bold text-slate-200">{tenantName.slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{tenantName}</p><p className="text-[10px] text-slate-500">Cuenta de empresa</p></div>
        </div>
        <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 transition hover:bg-white/[0.04] hover:text-white"><LogOut className="h-4 w-4" /> Cerrar sesión</button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen text-slate-100" style={{ "--accent": themeVars.accent, "--accent-soft": themeVars.soft, "--app-bg": themeVars.bg } as CSSProperties}>
      <div className="min-h-screen" style={{ background: "var(--app-bg)" }}>
        <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
        {mobileNavOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Cerrar menú" className="absolute inset-0 bg-black/75" onClick={() => setMobileNavOpen(false)} /><div className="relative h-full w-[280px]">{sidebar}</div></div>}
        <main className="min-h-screen lg:pl-[258px]">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-white/[0.07] bg-[#090b10]/90 px-4 backdrop-blur-xl sm:px-7">
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu className="h-4 w-4" /></button>
              <div><div className="flex items-center gap-2 text-[11px] text-slate-500"><span>Workspace</span><ChevronRight className="h-3 w-3" /><span className="text-slate-300">Inteligencia comercial</span></div><p className="mt-0.5 text-sm font-semibold text-white">Panel ejecutivo</p></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-[#11141b] p-1 sm:flex">
                <span className="px-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Tema</span>
                {(["red", "gray", "black"] as ThemeName[]).map((choice) => <button key={choice} aria-label={"Tema " + choice} title={"Tema " + choice} onClick={() => setTheme(choice)} className={"h-5 w-5 rounded-full border-2 transition " + (theme === choice ? "border-white" : "border-transparent")} style={{ background: choice === "red" ? "#ef4444" : choice === "gray" ? "#9ca3af" : "#08090b" }} />)}
              </div>
              <span className="hidden text-[11px] text-slate-500 md:block">{new Date().toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}</span>
              <button className="relative rounded-xl border border-white/[0.08] bg-[#11141b] p-2.5 text-slate-400 hover:text-white" aria-label="Notificaciones"><Bell className="h-4 w-4" /></button>
              <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-[11px] font-bold text-red-300 sm:flex">{tenantName.slice(0, 2).toUpperCase()}</div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-7 sm:px-7">
            <section id="overview" className="scroll-mt-24">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300"><Sparkles className="h-3 w-3" /> Intelligence workspace</div><h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Resumen ejecutivo</h1><p className="mt-1.5 text-sm text-slate-500">Visión de datos, rendimiento y proyecciones de {tenantName}.</p></div>
                <button onClick={() => refreshWorkspace().catch(() => {})} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#11141b] px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"><RefreshCw className="h-3.5 w-3.5" /> Actualizar datos</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/[0.07] bg-[#11141b] p-5"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Registros analizados</span><Database className="h-4 w-4 text-red-400" /></div><p className="mt-4 text-3xl font-semibold tabular-nums text-white">{rowsAnalyzed === null ? "—" : formatNumber(rowsAnalyzed)}</p><p className="mt-2 text-[11px] text-slate-500">Días válidos almacenados</p></div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#11141b] p-5"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Media proyectada</span><TrendingUp className="h-4 w-4 text-red-400" /></div><p className="mt-4 text-3xl font-semibold tabular-nums text-white">{forecast.length ? formatNumber(average) : "—"}</p><p className="mt-2 text-[11px] text-slate-500">{forecast.length ? "Promedio diario del horizonte" : "Genera un forecast para calcularla"}</p></div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#11141b] p-5"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Variación estimada</span><Activity className="h-4 w-4 text-red-400" /></div><p className="mt-4 text-3xl font-semibold tabular-nums text-white">{forecast.length ? (trend >= 0 ? "+" : "") + trend.toFixed(1) + "%" : "—"}</p><p className="mt-2 text-[11px] text-slate-500">Entre el primer y último punto</p></div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#11141b] p-5"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Motor predictivo</span><Gauge className="h-4 w-4 text-red-400" /></div><p className="mt-4 text-2xl font-semibold text-white">{modelReady ? "Activo" : "Pendiente"}</p><p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><span className={"h-1.5 w-1.5 rounded-full " + (modelReady ? "bg-emerald-400" : "bg-amber-400")} /> Holt-Winters · serie temporal</p></div>
              </div>
            </section>

            <section id="documents" className="scroll-mt-24 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-red-300"><UploadCloud className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.2em]">Document intelligence</span></div><h2 className="mt-2 text-lg font-semibold text-white">Centro de importación</h2><p className="mt-1 text-xs text-slate-500">Carga el reporte de tu empresa. ForecastPro buscará tablas y reconocerá los campos de fecha y ventas.</p></div><span className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1.5 text-[10px] font-medium text-emerald-300">15 MB máx.</span></div>
                <UploadZone onUpload={handleUpload} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[#0b0e13] px-2.5 py-2 text-[10px] text-slate-400"><FileText className="h-3.5 w-3.5 text-red-400" /> PDF con tabla digital</span>
                  <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[#0b0e13] px-2.5 py-2 text-[10px] text-slate-400"><FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Excel XLSX / XLS</span>
                  <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[#0b0e13] px-2.5 py-2 text-[10px] text-slate-400"><FileText className="h-3.5 w-3.5 text-sky-400" /> CSV</span>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-slate-600">PDF: tablas digitales con texto seleccionable. Documentos escaneados o fotografías requerirán OCR. Debe existir una fecha y una métrica numérica de ventas o demanda.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Table recognition</p><h2 className="mt-1 text-lg font-semibold text-white">Análisis de estructura</h2></div><div className="rounded-xl bg-red-500/10 p-2.5 text-red-400"><FileSpreadsheet className="h-5 w-5" /></div></div>
                {uploadSummary ? <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /><div><p className="text-xs font-semibold text-emerald-200">{uploadSummary.detected_table_count || 1} tabla(s) reconocida(s)</p><p className="mt-0.5 text-[10px] text-slate-500">{uploadSummary.file_format || "Archivo"} · {formatNumber(uploadSummary.rows)} registros válidos</p></div></div>
                  {(uploadSummary.detected_tables || []).slice(0, 3).map((table, index) => <div key={table.source + index} className="rounded-xl border border-white/[0.07] bg-[#0c0f14] p-3"><p className="mb-2 text-[10px] font-semibold text-slate-300">{table.source}</p><div className="grid grid-cols-2 gap-2"><div><p className="text-[9px] uppercase text-slate-600">Fecha detectada</p><p className="mt-1 truncate text-[11px] text-slate-200">{table.date_column}</p></div><div><p className="text-[9px] uppercase text-slate-600">Métrica detectada</p><p className="mt-1 truncate text-[11px] text-slate-200">{table.sales_column}</p></div></div></div>)}
                  <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#0c0f14] p-3"><p className="text-[9px] uppercase text-slate-600">Filas descartadas</p><p className="mt-1 text-lg font-semibold text-white">{formatNumber(uploadSummary.rows_removed)}</p></div><div className="rounded-xl bg-[#0c0f14] p-3"><p className="text-[9px] uppercase text-slate-600">Días faltantes</p><p className="mt-1 text-lg font-semibold text-white">{formatNumber(uploadSummary.missing_days_in_range)}</p></div></div>
                </div> : <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0c0f14] px-5 text-center"><div className="mb-3 rounded-2xl bg-white/[0.04] p-3 text-slate-500"><Database className="h-6 w-6" /></div><p className="text-xs font-medium text-slate-300">Esperando documento</p><p className="mt-1 max-w-[230px] text-[10px] leading-5 text-slate-600">Aquí verás las tablas encontradas y los encabezados que el sistema asoció automáticamente.</p></div>}
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Forecast pipeline</p><h2 className="mt-1 text-lg font-semibold text-white">Procesamiento predictivo</h2><p className="mt-1 text-xs text-slate-500">Entrena el motor y define el horizonte de proyección.</p></div><span className="rounded-full border border-white/[0.08] bg-[#0c0f14] px-3 py-1.5 text-[10px] text-slate-400">Holt-Winters</span></div>
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
                <button onClick={handleTrain} disabled={loadingTrain} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0c0f14] px-4 py-3 text-xs font-semibold text-slate-200 transition hover:border-red-500/40 hover:bg-red-500/[0.06] disabled:opacity-50">{loadingTrain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 text-red-400" />}{loadingTrain ? "Entrenando..." : "Entrenar modelo"}</button>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c0f14] px-3"><CalendarDays className="h-4 w-4 text-slate-500" /><select value={days} onChange={(event) => setDays(Number(event.target.value))} className="w-full bg-transparent py-3 text-xs text-white outline-none"><option className="bg-[#11141b]" value={30}>30 días</option><option className="bg-[#11141b]" value={60}>60 días</option><option className="bg-[#11141b]" value={90}>90 días</option></select></div>
                <button onClick={handlePredict} disabled={loadingPredict} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white transition disabled:opacity-50" style={{ background: "var(--accent)" }}>{loadingPredict ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{loadingPredict ? "Calculando..." : "Generar pronóstico"}<ArrowUpRight className="h-3.5 w-3.5" /></button>
              </div>
              {(status || error) && <div className={"mt-4 flex items-start gap-2 rounded-xl border p-3 " + (error ? "border-rose-500/20 bg-rose-500/[0.06]" : "border-white/[0.07] bg-[#0c0f14]")}>{error ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}<p className={"text-[11px] leading-5 " + (error ? "text-rose-300" : "text-slate-400")}>{error || status}</p></div>}
            </section>

            <section id="forecasts" className="scroll-mt-24">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Forecast analytics</p><h2 className="mt-1 text-lg font-semibold text-white">Proyección de demanda y ventas</h2></div>{forecast.length > 0 && <span className="text-[10px] text-slate-500">Horizonte: {days} días · {forecast.length} puntos</span>}</div>
              {forecast.length > 0 ? <div className="grid gap-5 xl:grid-cols-[1.5fr_.8fr]"><div className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-4 sm:p-6"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-white">Serie proyectada</h3><p className="mt-1 text-[10px] text-slate-500">Estimación central y bandas heurísticas de variación</p></div><TrendingUp className="h-4 w-4 text-red-400" /></div><ForecastChart data={forecast} /></div><div className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-4 sm:p-5"><div className="mb-3"><h3 className="text-sm font-semibold text-white">Exploración 3D</h3><p className="mt-1 text-[10px] text-slate-500">Vista interactiva de la proyección</p></div><Forecast3D data={forecast} /></div></div> : <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#11141b] px-6 text-center"><div className="mb-4 rounded-2xl bg-red-500/[0.08] p-4 text-red-400"><BarChart3 className="h-7 w-7" /></div><h3 className="text-sm font-semibold text-white">Aún no hay una proyección</h3><p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">Carga un documento, verifica las tablas detectadas, entrena el modelo y genera tu primer pronóstico.</p></div>}
              {forecast.length > 0 && <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11141b]"><div className="border-b border-white/[0.07] px-5 py-4"><h3 className="text-sm font-semibold text-white">Detalle del pronóstico</h3></div><div className="max-h-72 overflow-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="sticky top-0 bg-[#151922] text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Proyección</th><th className="px-5 py-3">Rango inferior</th><th className="px-5 py-3">Rango superior</th></tr></thead><tbody>{forecast.slice(0, 60).map((point) => <tr key={point.ds} className="border-t border-white/[0.05] text-slate-300"><td className="px-5 py-3">{point.ds}</td><td className="px-5 py-3 font-semibold text-white">{formatNumber(point.yhat)}</td><td className="px-5 py-3 text-slate-500">{formatNumber(point.yhat_lower)}</td><td className="px-5 py-3 text-slate-500">{formatNumber(point.yhat_upper)}</td></tr>)}</tbody></table></div></div>}
            </section>

            <section id="model" className="scroll-mt-24 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-5"><div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-red-400" /><h3 className="text-sm font-semibold text-white">Modelo analítico</h3></div><div className="mt-4 space-y-3"><div className="flex items-center justify-between border-b border-white/[0.06] pb-3"><span className="text-xs text-slate-500">Motor</span><span className="text-xs text-slate-200">Holt-Winters</span></div><div className="flex items-center justify-between border-b border-white/[0.06] pb-3"><span className="text-xs text-slate-500">Estado</span><span className={modelReady ? "text-xs text-emerald-400" : "text-xs text-amber-300"}>{modelReady ? "Entrenado" : "Sin entrenar"}</span></div><div className="flex items-center justify-between"><span className="text-xs text-slate-500">Datos históricos</span><span className="text-xs text-slate-200">{rowsAnalyzed === null ? "Sin carga" : formatNumber(rowsAnalyzed) + " días"}</span></div></div></div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-5"><div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-red-400" /><h3 className="text-sm font-semibold text-white">Acceso de empresa</h3></div><p className="mt-2 text-[11px] leading-5 text-slate-500">La clave se mantiene en este navegador para autenticar las solicitudes de tu espacio.</p><div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0c0f14] p-3"><span className="font-mono text-[11px] text-slate-400">{apiKey.slice(0, 10)}••••••••••</span><span className="flex items-center gap-1.5 text-[10px] text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /> Activa</span></div></div>
            </section>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] py-5 text-[10px] text-slate-600"><span>ForecastPro LATAM · Executive Intelligence</span><span className="flex items-center gap-3"><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Datos persistentes</span><span className="flex items-center gap-1"><CircleHelp className="h-3 w-3" /> Soporte técnico</span></span></footer>
          </div>
        </main>
      </div>
    </div>
  );
}
