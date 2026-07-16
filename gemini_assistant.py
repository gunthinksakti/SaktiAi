import requests
import json
import sys

GEMINI_API_KEY = "AIzaSyDWQZETwTDKXHUBlstfGw5CMqguqtIdcfA"
MODEL = "gemini-2.0-flash"

def chat_with_gemini(prompt, history=None):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"
    
    # Siapkan content
    contents = []
    if history:
        contents = history
    contents.append({"parts": [{"text": prompt}]})
    
    payload = {"contents": contents}
    
    try:
        resp = requests.post(url, json=payload, timeout=30)
        data = resp.json()
        
        if "candidates" in data and len(data["candidates"]) > 0:
            reply = data["candidates"][0]["content"]["parts"][0]["text"]
            return reply
        else:
            return f"[Error] {json.dumps(data, indent=2)}"
    except Exception as e:
        return f"[Error] {e}"

def main():
    print("🤖 Gemini AI Assistant (via Kai)")
    print("Ketik 'exit' untuk keluar\n")
    
    history = []
    while True:
        try:
            user_input = input("Kamu: ")
        except EOFError:
            break
            
        if user_input.lower() == "exit":
            print("Dadah! 👋")
            break
        
        print("Gemini: ", end="", flush=True)
        reply = chat_with_gemini(user_input, history if history else None)
        print(reply)
        print()
        
        # Simpan ke history
        history.append({"role": "user", "parts": [{"text": user_input}]})
        history.append({"role": "model", "parts": [{"text": reply}]})
        
        # Batasi history biar nggak kebesaran
        if len(history) > 20:
            history = history[-20:]

if __name__ == "__main__":
    main()
