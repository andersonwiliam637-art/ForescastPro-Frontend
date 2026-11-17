"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BarChart3, Shield, Zap } from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import { createTenant } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Escribe el nombre de tu empresa o proyecto");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createTenant(name.trim(), email.trim() || undefined);
      setApiKey(res.api_key);
      // Guardar en localStorage para el dashboard
      localStorage.setItem("fp_api_key", res.api_key);
      localStorage.setItem("fp_tenant_name", res.name || name);
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err: any) {
      setError(err.message || "No se pudo crear el acceso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pearl-500/10 border border-pearl-500/20 text-pearl-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            SaaS Multi-tenant · LATAM Edition
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            ForecastPro{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pearl-300 to-pearl-500">
              LATAM
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Forecasting de ventas con IA para empresas de Latinoamérica.
            Pronósticos comerciales explicables, listos para analizar y escalar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-5"
          >
            {[
              {
                icon: BarChart3,
                title: "Forecast con Holt-Winters",
                desc: "Suavizamiento exponencial con tendencia y estacionalidad semanal; muestra rangos estimados.",
              },
              {
                icon: Shield,
                title: "Multi-tenant seguro",
                desc: "Cada cliente tiene su API Key y sus propios modelos aislados.",
              },
              {
                icon: Zap,
                title: "Listo para comercializar",
                desc: "Sube CSV, entrena y visualiza en minutos. Ideal para PyMEs.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex gap-4 glass rounded-xl p-4 border border-slate-700/40"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pearl-500/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-pearl-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{f.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Create access form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-strong rounded-2xl p-6 md:p-8 border border-pearl-500/20"
          >
            {!apiKey ? (
              <>
                <h2 className="text-xl font-semibold text-white mb-1">
                  Crear acceso
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                  Obtén tu API Key y entra al dashboard de lujo.
                </p>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">
                      Nombre de empresa / proyecto *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Distribuidora El Sol"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:border-pearl-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@empresa.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:border-pearl-500 transition"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-rose-400">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-pearl-500 to-sky-500 text-slate-950 font-semibold hover:opacity-90 transition disabled:opacity-60"
                  >
                    {loading ? "Creando..." : "Crear acceso y entrar"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  ¡Acceso creado!
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Redirigiendo al dashboard...
                </p>
                <code className="block text-xs bg-slate-900 p-3 rounded-lg text-pearl-300 break-all">
                  {apiKey.slice(0, 20)}...
                </code>
              </div>
            )}
          </motion.div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-12">
          ForecastPro LATAM · Guerrilla Escalable · Powered by Holt-Winters + FastAPI
        </p>
      </div>
    </div>
  );
}
