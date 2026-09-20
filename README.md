# ForecastPro LATAM – Dashboard Comercial de Lujo

Frontend Next.js 14 + TypeScript + Tailwind + Framer Motion + React Three Fiber.

## Características

- Tema gris oscuro + azul perla con destellos
- Glassmorphism y animaciones fluidas
- Visualización 3D interactiva del forecast
- Flujo comercial completo:
  1. Crear tenant → API Key
  2. Subir CSV
  3. Entrenar modelo Prophet
  4. Generar forecast (30/60/90 días)
  5. KPIs + gráfica 2D + 3D + tabla + descarga

## Conectado a

`https://forecastpro-latam.onrender.com`

## Desarrollo local

```bash
cd ForecastPro-Frontend
npm install
npm run dev
```

Abre http://localhost:3000

## Variables de entorno (opcional)

Crea `.env.local`:

```
NEXT_PUBLIC_API_URL=https://forecastpro-latam.onrender.com
```

## Deploy en Vercel

1. Sube este folder a un repo de GitHub (o al mismo ForecastPro-LATAM).
2. En Vercel → New Project → importa el repo.
3. Root Directory: `ForecastPro-Frontend` (si está dentro de otro repo).
4. Deploy.

## Estructura

```
app/
  page.tsx          → Landing + crear acceso
  dashboard/page.tsx → Dashboard principal
components/
  ParticlesBackground.tsx
  GlassPanel.tsx
  KPICards.tsx
  ForecastChart.tsx
  Forecast3D.tsx
  UploadZone.tsx
lib/api.ts          → Cliente de la API
```

## Notas Master Senior

- Diseño pensado para vender a PyMEs LATAM.
- El 3D es el “wow”; el flujo CSV → Train → Predict es lo que cierra la venta.
- Free tier de Vercel es suficiente para el MVP.
