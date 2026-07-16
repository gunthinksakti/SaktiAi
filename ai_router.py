"""
ai_router.py — Free-Tier Router (HALAL)
Muter otomatis antar provider AI gratis: Groq, Gemini, OpenRouter.
- Fallback otomatis kalau satu provider limit/error
- Round-robin load balancing (beban merata)
- Budget harian per provider biar gak over-quota
- Reuse key & fungsi chat() dari ai_hybrid.py (gak duplikasi key)

Cara pakai:
    from ai_router import chat_router
    r = chat_router("Halo")
    print(r["reply"], "via", r["provider"])
"""
import json
import os
from datetime import date

from ai_hybrid import APIS, chat  # reuse key & fungsi chat

# ============ KONFIG ============
STATE_FILE = "/root/.router_state.json"

# Estimasi budget harian (token). Free tier bervariasi, ini konservatif.
DAILY_BUDGET = {
    "groq": 30000,
    "gemini": 50000,
    "openrouter": 20000,
}

# Urutan default (bisa di-override pas panggil)
DEFAULT_ORDER = ["groq", "gemini", "openrouter"]


# ============ STATE ============
def _load_state():
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return {"last_index": -1, "usage": {}, "date": str(date.today())}


def _save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)


def _reset_if_new_day(state):
    today = str(date.today())
    if state.get("date") != today:
        state["date"] = today
        state["usage"] = {}  # reset budget tiap hari
    return state


def _usage(provider, state):
    return state.get("usage", {}).get(provider, 0)


def _add_usage(provider, tokens, state):
    u = state.setdefault("usage", {})
    u[provider] = u.get(provider, 0) + tokens


# ============ HELPER ============
def available_providers(order=None, state=None):
    """Provider yang masih punya sisa budget hari ini."""
    order = order or DEFAULT_ORDER
    state = state or _reset_if_new_day(_load_state())
    out = []
    for p in order:
        if p in APIS and _usage(p, state) < DAILY_BUDGET.get(p, 10**9):
            out.append(p)
    return out


def stats():
    """Lihat sisa budget hari ini."""
    state = _reset_if_new_day(_load_state())
    rows = []
    for p in DEFAULT_ORDER:
        if p in APIS:
            used = _usage(p, state)
            bud = DAILY_BUDGET.get(p, 0)
            rows.append(f"  {p:11s}: {used:>7d}/{bud:<7d}  sisa {bud-used}")
    return "\n".join(rows)


# ============ ROUTER ============
def chat_router(prompt, history=None, order=None, strategy="round_robin"):
    """
    Kirim prompt lewat provider yang tersedia, otomatis fallback.
    strategy:
      "round_robin"  -> giliran rata (default)
      "cheapest"     -> pilih yang paling sedikit dipakai hari ini
    Return: dict {"reply","provider","model","tokens","tried"}
    """
    order = order or DEFAULT_ORDER
    state = _reset_if_new_day(_load_state())
    avail = available_providers(order, state)

    if not avail:
        return {"error": "Semua provider habis budget hari ini. Coba besok atau naikkan DAILY_BUDGET.",
                "tried": []}

    # tentukan urutan starting point
    if strategy == "cheapest":
        avail.sort(key=lambda p: _usage(p, state))
        queue = avail
    else:  # round_robin
        start = (state["last_index"] + 1) % len(avail)
        queue = avail[start:] + avail[:start]
        state["last_index"] = (start - 1) % len(avail)

    tried = []
    for p in queue:
        res = chat(p, prompt, history)
        if "reply" in res:
            tokens = res.get("tokens", 0)
            _add_usage(p, tokens, state)
            _save_state(state)
            return {
                "reply": res["reply"],
                "provider": p,
                "model": res.get("model", APIS[p]["default_model"]),
                "tokens": tokens,
                "tried": tried + [p],
            }
        else:
            tried.append(f"{p}:{res.get('error','?')[:60]}")

    _save_state(state)
    return {"error": "Semua provider gagal.", "tried": tried}


# ============ TEST ============
if __name__ == "__main__":
    print("🔀 Free-Tier Router Test")
    print("Budget hari ini:")
    print(stats())
    print("-" * 40)
    r = chat_router("Balas hanya dengan kata SAKTI_ROUTER")
    if "reply" in r:
        print(f"✅ {r['reply']}")
        print(f"   via {r['provider']} / {r['model']} ({r['tokens']} token)")
        print(f"   urutan coba: {r['tried']}")
    else:
        print(f"❌ {r.get('error')}")
        print(f"   detail: {r.get('tried')}")
    print("-" * 40)
    print("Budget sisa:")
    print(stats())
