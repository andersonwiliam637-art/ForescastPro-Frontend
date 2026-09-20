const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://forecastpro-latam.onrender.com";

export interface TenantCreateResponse {
  tenant_id: string;
  api_key: string;
  name: string;
  message?: string;
}

export interface PredictPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface PredictResponse {
  forecast: PredictPoint[];
  days: number;
  tenant?: string;
}

export async function createTenant(name: string, email?: string): Promise<TenantCreateResponse> {
  const res = await fetch(`${API_BASE}/tenants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email: email || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al crear tenant");
  }
  return res.json();
}

export async function uploadCSV(apiKey: string, file: File): Promise<{ message: string; rows?: number }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { "X-API-Key": apiKey },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al subir CSV");
  }
  return res.json();
}

export async function trainModel(apiKey: string): Promise<{ message: string; status?: string }> {
  const res = await fetch(`${API_BASE}/train`, {
    method: "POST",
    headers: { "X-API-Key": apiKey },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al entrenar modelo");
  }
  return res.json();
}

export async function predict(apiKey: string, days: number = 30): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict?days=${days}`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al generar forecast");
  }
  return res.json();
}

export async function getMe(apiKey: string): Promise<any> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!res.ok) throw new Error("API Key inválida");
  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
