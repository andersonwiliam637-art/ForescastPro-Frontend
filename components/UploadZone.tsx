"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";

interface Props { onUpload: (file: File) => Promise<void>; disabled?: boolean; }

export default function UploadZone({ onUpload, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase();
    const allowed = [".csv", ".xlsx", ".xls", ".pdf"];
    if (!allowed.some((ext) => name.endsWith(ext))) { setError("Formato no admitido. Usa PDF, XLSX, XLS o CSV."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("El archivo supera el límite de 15 MB."); return; }
    setError(""); setLoading(true); setDone(false);
    try { await onUpload(file); setDone(true); }
    catch (e: any) { setError(e.message || "Error al procesar el documento"); }
    finally { setLoading(false); }
  };

  return <div>
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (disabled) return; const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={"relative cursor-pointer rounded-2xl border border-dashed p-7 text-center transition-all " + (dragging ? "border-red-400 bg-red-500/[0.08]" : "border-white/15 bg-[#0c0f14] hover:border-red-400/50 hover:bg-red-500/[0.035]") + (disabled ? " cursor-not-allowed opacity-50" : "")}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.currentTarget.value = ""; }} />
      <div className={"mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl " + (done ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : done ? <CheckCircle2 className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
      </div>
      <p className="text-sm font-semibold text-white">{loading ? "Analizando documento..." : done ? "Documento procesado" : "Arrastra tu documento o selecciónalo"}</p>
      <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-5 text-slate-500">ForecastPro buscará tablas y asociará automáticamente columnas de fecha y ventas aunque los encabezados cambien.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">{["PDF", "XLSX", "XLS", "CSV"].map((format) => <span key={format} className="rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] font-bold tracking-wider text-slate-400">{format}</span>)}</div>
    </div>
    {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-[11px] text-rose-400">{error}</motion.p>}
  </div>;
}
