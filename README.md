# KI-Interview-Coach (SaaS)

Produktionsnahe Web-App: Live-Zoom-Interviews mit Speech2Text (Whisper) + STAR-Antworten (GPT-4o), Auth (Supabase), Zahlungen (Stripe: SEPA, Karte, Klarna).

## Stack

- **Frontend:** Vite/React, Tailwind-ähnliches CSS, React Router
- **Backend:** FastAPI (async, Uvicorn)
- **Auth:** Supabase (E-Mail + Google)
- **Zahlung:** Stripe (SEPA-Lastschrift, Kreditkarte, Klarna; PCI-DSS-konform, tokenbasiert)
- **AI:** OpenAI Whisper + GPT-4o-mini (Speech2Text + STAR-Antworten)

## Projektstruktur

```
interview-copilot-de/
├── src/
│   ├── App.jsx, main.jsx
│   ├── context/AuthContext.jsx
│   ├── pages/Login.jsx, Dashboard.jsx, Interview.jsx
│   ├── components/UpgradeBanner.jsx
│   └── lib/supabase.js
├── backend/main.py      # FastAPI + Auth-Middleware + Stripe
├── backend/requirements.txt
├── .env.example
└── vercel.json
```

## Setup

1. **Dependencies**
   ```bash
   npm install
   cd backend && pip install -r requirements.txt
   ```

2. **Umgebungsvariablen**
   - Projektroot: `.env` mit `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (optional: ohne = Demo-Modus, 3 Sessions)
   - Backend: `backend/.env` mit `OPENAI_API_KEY`, `SUPABASE_JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` (siehe .env.example)

3. **Backend starten**
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

4. **Frontend starten**
   ```bash
   npm run dev
   ```
   → http://localhost:3000 (oder 3001 falls 3000 belegt)

## Auth (Supabase)

- **/login:** E-Mail/Passwort + „Continue with Google“, DSGVO-Checkbox
- **Zustand:** `user.isLoggedIn`, `user.currentPlan` (free/pro), `user.remainingSessions` (z. B. 3 kostenlos)
- Nach Login → **/dashboard**
- **GET /api/me:** JWT aus Header `Authorization` oder `x-supabase-auth` → User-Meta (plan, remaining_sessions)

## Zahlung (Stripe)

- **Upgrade-Banner** bei `remainingSessions ≤ 0`: „Upgrade to Pro – 19,99 €/Monat“ → Checkout-Button
- **POST /api/create-checkout-session:** erstellt Stripe Checkout (SEPA, Karte, Klarna); Redirect zu Stripe
- **POST /api/webhook:** Stripe-Webhook setzt nach erfolgreicher Zahlung `current_plan: pro`, unbegrenzte Sessions
- Keine Kartendaten im Backend (PCI-DSS-konform)

## Features

- Dark-Stealth-Overlay (z-index: 999999) für Zoom/Teams
- Mikrofon → Speech2Text (Whisper) → STAR-Antwort (GPT-4o-mini)
- Lebenslauf PDF Drag & Drop (clientseitig), RAG für personalisierte Antworten
- XING/StepStone URL → Fragen extrahieren
- Session-Limit (Free: 3 Sessions; Pro: unbegrenzt)

## Deploy

- **Frontend:** Vercel – `vercel`
- **Backend:** Railway/Render – `VITE_API_URL` im Frontend auf Backend-URL setzen
- **Stripe Webhook:** URL z. B. `https://your-backend.com/webhook`, Signatur mit `STRIPE_WEBHOOK_SECRET` prüfen
