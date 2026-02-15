"""
DE AI Interview Copilot - FastAPI Backend
Auth: Supabase JWT (Header Authorization / x-supabase-auth).
Payments: Stripe Checkout (SEPA, Card, Klarna) + webhook.
"""

import os
import io
import re
import json
import hmac
import hashlib
from pathlib import Path
from typing import Optional

import jwt
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import httpx
from bs4 import BeautifulSoup

_env_dir = Path(__file__).resolve().parent
load_dotenv(_env_dir / ".env")
load_dotenv(_env_dir.parent / ".env")

MOCK_MODE = os.getenv("MOCK_MODE", "").strip().lower() in ("1", "true", "yes")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "").strip()  # Service role key for admin operations

if not MOCK_MODE:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
else:
    client = None

app = FastAPI(title="DE AI Interview Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resume_store: dict[str, str] = {}
# User profile: user_id -> { current_plan, remaining_sessions } (production: use Supabase/DB)
profile_store: dict[str, dict] = {}
FREE_SESSIONS_INITIAL = 3


def get_token(authorization: Optional[str] = Header(None), x_supabase_auth: Optional[str] = Header(None)) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return x_supabase_auth


def get_current_user(token: Optional[str] = Depends(get_token)):
    if not token:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=503, detail="SUPABASE_JWT_SECRET nicht konfiguriert")
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        sub = payload.get("sub")
        email = payload.get("email") or ""
        if not sub:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        return {"id": sub, "email": email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token abgelaufen")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ungültiger Token")


def get_current_user_optional(token: Optional[str] = Depends(get_token)) -> Optional[dict]:
    if not token or not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        sub = payload.get("sub")
        if not sub:
            return None
        return {"id": sub, "email": payload.get("email") or ""}
    except Exception:
        return None


def get_or_create_profile(user_id: str) -> dict:
    if user_id not in profile_store:
        profile_store[user_id] = {"current_plan": "free", "remaining_sessions": FREE_SESSIONS_INITIAL}
    return profile_store[user_id]


def update_user_profile_in_supabase(user_id: str, plan: str) -> bool:
    """
    Update user profile in Supabase using service role key.
    Creates or updates the user_settings table.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print(f"[WARNING] Supabase not configured, using in-memory store for user {user_id}", flush=True)
        profile_store[user_id] = {"current_plan": plan, "remaining_sessions": -1 if plan in ("pro", "lifetime") else FREE_SESSIONS_INITIAL}
        return True
    
    try:
        # Try to update existing user settings
        response = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/user_settings?user_id=eq.{user_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            json={"current_plan": plan},
            timeout=10
        )
        
        if response.status_code == 200 and response.text == "[]":
            # No existing record, try to insert
            response = httpx.post(
                f"{SUPABASE_URL}/rest/v1/user_settings",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                json={"user_id": user_id, "current_plan": plan},
                timeout=10
            )
        
        if response.status_code in (200, 201):
            print(f"[SUCCESS] Updated user {user_id} to plan: {plan}", flush=True)
            return True
        else:
            print(f"[ERROR] Failed to update Supabase: {response.status_code} - {response.text}", flush=True)
            # Fall back to in-memory
            profile_store[user_id] = {"current_plan": plan, "remaining_sessions": -1 if plan in ("pro", "lifetime") else FREE_SESSIONS_INITIAL}
            return True
            
    except Exception as e:
        print(f"[ERROR] Supabase update failed: {e}", flush=True)
        # Fall back to in-memory
        profile_store[user_id] = {"current_plan": plan, "remaining_sessions": -1 if plan in ("pro", "lifetime") else FREE_SESSIONS_INITIAL}
        return True


@app.on_event("startup")
def startup():
    import sys
    mode = "MOCK (keine OpenAI-Calls)" if MOCK_MODE else "LIVE (OpenAI)"
    print(f"Backend mode: {mode}", file=sys.stderr)

# Hardcodierte Antworten für Mock-Modus (Rate-Limit-Bypass, keine OpenAI-Calls)
MOCK_TRANSCRIPT = "Erzählen Sie von einer schwierigen Team-Situation."
MOCK_ANSWER = """Situation: In meinem letzten Projekt gab es Konflikte zwischen zwei Teammitgliedern bezüglich der Priorisierung.
Aufgabe: Ich sollte die Kommunikation verbessern und die Deadline einhalten.
Handlung: Ich habe ein kurzes Meeting einberufen, klare Verantwortlichkeiten verteilt und wöchentliche Syncs eingeführt.
Ergebnis: Das Projekt wurde pünktlich abgeschlossen und die Zusammenarbeit hat sich deutlich verbessert."""
MOCK_CONFIDENCE = 88
MOCK_QUESTIONS = [
    "Erzählen Sie von einer schwierigen Team-Situation.",
    "Was sind Ihre größten Stärken?",
    "Wo sehen Sie sich in fünf Jahren?",
    "Warum möchten Sie zu uns wechseln?",
    "Beschreiben Sie eine Situation, in der Sie unter Zeitdruck gearbeitet haben.",
]


def get_resume_context(session_id: str) -> str:
    """Retrieve resume for RAG context."""
    return resume_store.get(session_id, "Kein Lebenslauf hinterlegt.")


def extract_questions_from_job_text(text: str) -> list[str]:
    """Extract likely interview questions from job description (nur bei Live-Modus mit OpenAI)."""
    if not text or len(text.strip()) < 50:
        return []
    if MOCK_MODE:
        return MOCK_QUESTIONS
    try:
        prompt = """Analysiere die folgende Stellenbeschreibung und extrahiere 5-10 typische Vorstellungsgespräch-Fragen, 
die ein Bewerber erwarten könnte. Gib NUR die Fragen zurück, jeweils eine pro Zeile, nummeriert (1., 2., ...).
Keine Einleitung, keine Erklärungen.

Stellenbeschreibung:
"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt + text[:4000]}],
            max_tokens=500,
        )
        content = response.choices[0].message.content
        questions = [q.strip() for q in re.findall(r"\d+\.\s*(.+)", content)]
        return questions[:10]
    except Exception:
        return []


@app.get("/")
def root():
    return {"status": "ok", "app": "DE AI Interview Copilot API"}


@app.get("/me")
def api_me(current_user: dict = Depends(get_current_user)):
    """Vorstrukturierte User-Meta für Frontend (currentPlan, remainingSessions)."""
    profile = get_or_create_profile(current_user["id"])
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "current_plan": profile["current_plan"],
        "remaining_sessions": profile["remaining_sessions"],
    }


@app.post("/resume")
async def save_resume(session_id: str = Form(...), content: str = Form(...)):
    """Store resume for RAG. Mock: nur speichern, kein OpenAI."""
    resume_store[session_id] = content
    msg = "Mock: Lebenslauf gespeichert" if MOCK_MODE else "Lebenslauf gespeichert"
    return {"ok": True, "message": msg}


@app.post("/stream")
async def process_audio_stream(
    audio: UploadFile = File(...),
    session_id: str = Form(default="default"),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """
    Audio chunks → Whisper (de) → GPT-4o-mini → STAR-Antworten.
    Bei authentifiziertem User: verbraucht eine Session (free plan).
    """
    if MOCK_MODE:
        try:
            if audio:
                await audio.read()
        except Exception:
            pass
        return {
            "transcript": MOCK_TRANSCRIPT,
            "answer": MOCK_ANSWER,
            "confidence": MOCK_CONFIDENCE,
            "question": MOCK_TRANSCRIPT,
        }

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY nicht konfiguriert")

    try:
        data = await audio.read()
        if len(data) < 100:
            raise HTTPException(status_code=400, detail="Audio zu kurz oder leer")

        file_obj = io.BytesIO(data)
        file_obj.name = "audio.webm"
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=file_obj,
            language="de",
        )
        text = transcript.text.strip()
        if not text:
            return {"transcript": "", "answer": "", "confidence": 0, "question": ""}

        resume_ctx = get_resume_context(session_id)

        prompt = f"""Du bist ein Interview-Coach. 
Lebenslauf des Bewerbers (Kontext): {resume_ctx[:2000]}

Transkript des Gesprächs: "{text}"

1. Erkenne: Ist das eine Interview-FRAGE (z.B. vom Interviewer) oder eine ANTWORT des Bewerbers?
2. Wenn es eine Frage ist: Generiere eine STAR-Antwort (Situation, Task, Action, Result) auf Deutsch, passend zum Lebenslauf.
3. Wenn es eine Antwort ist: Bewerte sie kurz und gib ggf. Verbesserungsvorschläge.

Antworte NUR mit der relevanten Ausgabe:
- Bei Fragen: Die STAR-Antwort
- Bei Antworten: Kurze Bewertung + Tipp

Halte die Antwort auf max. 150 Wörter."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
        )
        answer = response.choices[0].message.content.strip()

        star_keywords = ["situation", "aufgabe", "handlung", "ergebnis", "kontext", "zusammenarbeit"]
        has_star = any(k in answer.lower() for k in star_keywords)
        conf = min(100, 60 + (20 if has_star else 0) + min(20, len(answer) // 10))

        if current_user:
            profile = get_or_create_profile(current_user["id"])
            if profile["current_plan"] == "free" and profile["remaining_sessions"] > 0:
                profile["remaining_sessions"] -= 1

        return {
            "transcript": text,
            "answer": answer,
            "confidence": conf,
            "question": text if "?" in text or text.lower().startswith(("was", "wie", "warum", "welche", "erzähl")) else "",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Audio-Verarbeitung fehlgeschlagen: " + str(e))


# ---------- Stripe (PCI-DSS-konform, tokenbasiert) ----------
STRIPE_SECRET = os.getenv("STRIPE_SECRET_KEY", "").strip()
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "").strip()
STRIPE_PRICE_ID_LIFETIME = os.getenv("STRIPE_PRICE_ID_LIFETIME", "").strip()  # One-time payment price ID
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()


@app.post("/create-checkout-session")
async def create_checkout_session(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Stripe Checkout: SEPA, Karte, Klarna ($29/Monat) oder $299 Lifetime."""
    if not STRIPE_SECRET:
        raise HTTPException(status_code=503, detail="Stripe nicht konfiguriert")
    
    try:
        body = await request.json()
        plan = body.get("plan", "pro")  # "pro" or "lifetime"
        success_url = body.get("success_url") or (str(request.base_url).rstrip("/") + "/dashboard")
        cancel_url = body.get("cancel_url") or (str(request.base_url).rstrip("/") + "/dashboard")
    except Exception:
        plan = "pro"
        success_url = cancel_url = None

    import stripe
    stripe.api_key = STRIPE_SECRET
    
    try:
        # Determine which price to use
        price_id = STRIPE_PRICE_ID_LIFETIME if plan == "lifetime" else STRIPE_PRICE_ID
        
        if not price_id:
            raise HTTPException(status_code=503, detail=f"Stripe Price ID nicht konfiguriert für Plan: {plan}")

        if plan == "lifetime":
            # One-time payment (lifetime deal)
            session = stripe.checkout.Session.create(
                mode="payment",
                client_reference_id=current_user["id"],
                customer_email=current_user.get("email"),
                line_items=[{"price": price_id, "quantity": 1}],
                payment_method_types=["card", "sepa_debit", "klarna"],
                success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}&plan=lifetime",
                cancel_url=cancel_url,
                metadata={"plan": "lifetime", "user_id": current_user["id"]},
            )
        else:
            # Subscription (pro monthly)
            session = stripe.checkout.Session.create(
                mode="subscription",
                client_reference_id=current_user["id"],
                customer_email=current_user.get("email"),
                line_items=[{"price": price_id, "quantity": 1}],
                payment_method_types=["card", "sepa_debit", "klarna"],
                success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}&plan=pro",
                cancel_url=cancel_url,
                metadata={"plan": "pro", "user_id": current_user["id"]},
            )
        
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def verify_stripe_signature(payload: bytes, signature: str) -> dict:
    """Verify Stripe webhook signature."""
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook secret nicht konfiguriert")
    
    import stripe
    stripe.api_key = STRIPE_SECRET
    
    try:
        event = stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
        return event
    except ValueError:
        raise HTTPException(status_code=400, detail="Ungültiger Payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Ungültige Signatur")


@app.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe Webhook: Nach erfolgreicher Zahlung Pro-Plan setzen.
    Handle:
    - checkout.session.completed (subscription)
    - checkout.session.completed (one-time payment for lifetime)
    """
    # Get raw body for signature verification
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    
    if not STRIPE_WEBHOOK_SECRET:
        print("[WARNING] Stripe webhook secret not configured!", flush=True)
        raise HTTPException(status_code=503, detail="Webhook nicht konfiguriert")
    
    # Verify signature
    try:
        event = verify_stripe_signature(payload, signature)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Webhook signature verification failed: {e}", flush=True)
        raise HTTPException(status_code=400, detail="Signatur验证失败")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        metadata = session.get("metadata", {})
        
        # Get plan from metadata or infer from session mode
        plan = metadata.get("plan")
        if not plan:
            # Check if it's a subscription or one-time payment
            if session.get("mode") == "subscription":
                plan = "pro"
            elif session.get("mode") == "payment":
                plan = "lifetime"
            else:
                # Check line items to determine
                try:
                    import stripe
                    stripe.api_key = STRIPE_SECRET
                    line_items = stripe.checkout.Session.list_line_items(session["id"], limit=1)
                    if line_items.data:
                        price_id = line_items.data[0].price.id
                        if price_id == STRIPE_PRICE_ID_LIFETIME:
                            plan = "lifetime"
                        else:
                            plan = "pro"
                except:
                    plan = "pro"  # Default to pro
        
        if user_id and plan:
            print(f"[INFO] Processing payment for user {user_id}, plan: {plan}", flush=True)
            
            # Update user profile in Supabase (or fallback to in-memory)
            success = update_user_profile_in_supabase(user_id, plan)
            
            if success:
                print(f"[SUCCESS] User {user_id} upgraded to {plan}", flush=True)
            else:
                print(f"[ERROR] Failed to update user {user_id}", flush=True)
        else:
            print(f"[WARNING] No user_id in session: {session}", flush=True)
    
    elif event["type"] == "customer.subscription.deleted":
        # Handle subscription cancellation
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        
        # Find user by customer email and revert to free
        # This is optional - you might want to keep them as pro until they explicitly cancel
        print(f"[INFO] Subscription cancelled: {customer_id}", flush=True)
    
    elif event["type"] == "invoice.payment_failed":
        # Handle failed payments
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")
        print(f"[WARNING] Payment failed for customer: {customer_id}", flush=True)
    
    else:
        print(f"[INFO] Unhandled event type: {event['type']}", flush=True)
    
    return JSONResponse(content={"received": True})


@app.post("/parse")
async def parse_job_url(url: str = Form(...)):
    """
    XING/StepStone URL → scrape job description → extract interview questions.
    Mock-Modus: keine OpenAI-Calls, gibt Mock-Fragen zurück.
    """
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Ungültige URL")

    if MOCK_MODE:
        return {
            "ok": True,
            "url": url,
            "text_preview": "Mock: Stellenbeschreibung (kein Scrape im Test).",
            "questions": MOCK_QUESTIONS,
        }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as c:
            r = await c.get(url, headers=headers)
            r.raise_for_status()
            html = r.text

        soup = BeautifulSoup(html, "html.parser")
        for s in soup(["script", "style"]):
            s.decompose()
        text = soup.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", text)[:8000]

        questions = extract_questions_from_job_text(text)

        return {
            "ok": True,
            "url": url,
            "text_preview": text[:500] + "..." if len(text) > 500 else text,
            "questions": questions,
        }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"URL nicht erreichbar: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

