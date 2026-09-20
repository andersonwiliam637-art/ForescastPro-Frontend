"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export default function UploadZone({ onUpload, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Solo se aceptan archivos .csv");
      return;
    }
    setError("");
    setLoading(true);
    setDone(false);
    try {
      await onUpload(file);
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Error al subir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragging ? "border-pearl-400 bg-pearl-500/10" : "border-slate-600 hover:border-pearl-500/50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {loading ? (
          <Loader2 className="w-10 h-10 mx-auto text-pearl-400 animate-spin mb-3" />
        ) : done ? (
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
        ) : (
          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
        )}
        <p className="text-sm text-slate-300">
          {loading
            ? "Subiendo y procesando..."
            : done
            ? "CSV cargado correctamente"
            : "Arrastra tu CSV aquí o haz clic"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Columnas requeridas: <code className="text-pearl-300">ds</code> (fecha) y{" "}
          <code className="text-pearl-300">y</code> (ventas)
        </p>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-rose-400 mt-2"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
