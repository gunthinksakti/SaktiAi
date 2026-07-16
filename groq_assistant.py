import requests
import json
import sys

API_KEY = "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"
MODEL = "llama-3.3-70b-versatile"  # default

AVAILABLE_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
]

def chat(prompt, history=None, model=None):
    if model is None:
        model = MODEL
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    messages = list(history) if history else []
    messages.append({"role": "user", "content": prompt})
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        data = resp.json()
        if "choices" in data and len(data["choices"]) > 0:
            reply = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            tokens = usage.get("total_tokens", 0)
            return reply, tokens
        else:
            return f"[Error] {json.dumps(data, indent=2)}", 0
    except Exception as e:
        return f"[Error] {e}", 0

# Test langsung
reply, tokens = chat("Balas 2-3 kata aja: siapa kamu?")
print(f"Jawab: {reply}")
print(f"Token: {tokens}")
