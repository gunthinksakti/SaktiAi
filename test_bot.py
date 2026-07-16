import requests
import json
import time
import random

# Simulasi bot yang ambil data dari API publik
def get_crypto_price(coin="bitcoin"):
    url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin}&vs_currencies=usd"
    resp = requests.get(url)
    return resp.json()

def save_report(data, filename="report.json"):
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Report saved to {filename}")

def main():
    print("🚀 Bot crypto berjalan...")
    
    coins = ["bitcoin", "ethereum", "solana"]
    results = {}
    
    for coin in coins:
        try:
            price_data = get_crypto_price(coin)
            results[coin] = price_data[coin]["usd"]
            print(f"  {coin}: ${price_data[coin]['usd']:,.2f}")
        except Exception as e:
            print(f"  ⚠️ {coin} error: {e}")
            results[coin] = f"Error: {e}"
    
    save_report(results)
    
    # Bonus: hitung total
    total = sum(v for v in results.values() if isinstance(v, (int, float)))
    print(f"💰 Total value: ${total:,.2f}")

if __name__ == "__main__":
    main()
