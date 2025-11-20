from fastapi import FastAPI
from pydantic import BaseModel
import os, httpx

app = FastAPI(title="Magnus AI API")

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

class Win(BaseModel):
    title: str
    buy: float
    sell: float
    yield_pct: float
    url: str | None = None

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/market/feed")
def market_feed():
    return {
        "items": [
            {"id": "macbook", "title": "MacBook Pro M3", "price": 950, "ai": {"yield_pct": 42.1, "conf": 0.82}},
            {"id": "jordan1", "title": "Jordan 1 Retro", "price": 180, "ai": {"yield_pct": 77.8, "conf": 0.74}}
        ]
    }

@app.post("/notify/win")
async def notify_win(win: Win):
    msg = f"🏆 Win: {win.title}\nBuy ${win.buy:.2f} → Sell ${win.sell:.2f} (Yield {win.yield_pct:.1f}%)"
    if DISCORD_WEBHOOK_URL:
        async with httpx.AsyncClient() as client:
            await client.post(DISCORD_WEBHOOK_URL, json={"content": msg})
    if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
        tg_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as client:
            await client.post(tg_url, data={"chat_id": TELEGRAM_CHAT_ID, "text": msg})
    return {"sent": True}
