import os, sys, json, requests

GROQ_KEY = "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"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

prompt = sys.argv[1] if len(sys.argv) > 1 else "Halo"

headers = {
    "Authorization": f"Bearer {GROQ_KEY}",
    "Content-Type": "application/json"
}

data = {
    "model": "llama3-70b-8192",
    "messages": [
        {"role": "system", "content": "Kamu adalah Sakti, asisten pribadi. Jawab dengan ramah, singkat, dan langsung ke inti. Gunakan bahasa Indonesia."},
        {"role": "user", "content": prompt}
    ],
    "max_tokens": 300,
    "temperature": 0.7
}

try:
    r = requests.post(GROQ_URL, headers=headers, json=data, timeout=15)
    if r.status_code == 200:
        result = r.json()
        reply = result["choices"][0]["message"]["content"]
        tokens = result["usage"]["total_tokens"]
        print(reply)
        print(f"\n⚡{tokens} token", file=sys.stderr)
    else:
        print(f"[GROQ ERROR] {r.status_code}: {r.text[:100]}", file=sys.stderr)
        print("Maaf, Groq lagi error. Coba lagi nanti.")
except Exception as e:
    print(f"[GROQ EXCEPTION] {str(e)}", file=sys.stderr)
    print("Maaf, koneksi ke Groq bermasalah.")
