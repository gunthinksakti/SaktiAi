import requests
import json

# ============ KONFIGURASI API ============
APIS = {
    "openrouter": {
        "key": "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",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "models": ["openrouter/free", "openai/gpt-4o-mini", "openai/gpt-4o"],
        "default_model": "openrouter/free",
        "type": "openai",
        "headers": {
            "HTTP-Referer": "https://kai.app",
            "X-Title": "SaktiDoc AI"
        }
    },
    "groq": {
        "key": "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",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
        "default_model": "llama-3.3-70b-versatile",
        "type": "openai"
    },
    "gemini": {
        "key": "AIzaSyBOlhS8RTID1-Y62uGzXD1Z7WLSr1caSFA",
        "url": "https://generativelanguage.googleapis.com/v1beta/models/",
        "models": ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.0-flash-lite"],
        "default_model": "gemini-2.5-flash",
        "type": "gemini"
    }
}

# ============ FUNGSI CHAT ============
def chat(api_name="openrouter", prompt="Halo", history=None, model=None):
    api = APIS.get(api_name)
    if not api:
        return {"error": f"API {api_name} tidak ditemukan"}
    
    if model is None:
        model = api["default_model"]
    
    messages = []
    if history:
        messages = history
    messages.append({"role": "user", "content": prompt})
    
    headers = {
        "Authorization": f"Bearer {api['key']}",
        "Content-Type": "application/json"
    }
    
    # Tambah header khusus OpenRouter
    extra_headers = api.get("headers", {})
    headers.update(extra_headers)
    
    if api["type"] == "gemini":
        url = f"{api['url']}{model}:generateContent?key={api['key']}"
        payload = {"contents": messages}
    else:
        url = api["url"]
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": 1024,
            "temperature": 0.7
        }
    
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        data = r.json()
        
        if r.status_code != 200:
            return {"error": data.get("error", {}).get("message", str(data)[:200]), "code": r.status_code}
        
        if api["type"] == "gemini":
            reply = data["candidates"][0]["content"]["parts"][0]["text"]
            tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
        else:
            reply = data["choices"][0]["message"]["content"]
            tokens = data["usage"]["total_tokens"]
        
        return {"reply": reply, "tokens": tokens, "model": data.get("model", model)}
    
    except Exception as e:
        return {"error": str(e)}

# ============ TEST ============
if __name__ == "__main__":
    print("🔍 Test OpenRouter...")
    result = chat("openrouter", "Balas dengan kata SAKTI_SIAP")
    if "reply" in result:
        print(f"✅ {result['reply']} ({result['tokens']} token via {result['model']})")
    else:
        print(f"❌ {result.get('error', 'Gagal')}")
