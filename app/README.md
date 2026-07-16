# AI Studio — Android App (Flutter WebView)

Wrapper Flutter yang menampilkan web app AI Studio (Puter.js):
https://gunthinksakti.github.io/SaktiAi/

## Auto-build APK
Setiap push ke branch `master` (yang menyentuh folder `app/`) akan memicu
GitHub Actions `.github/workflows/build-apk.yml` untuk build APK release.
Unduh hasilnya dari tab **Actions → Artifacts** (`sakti-ai-apk`).

## Build lokal (opsional)
```
cd app
flutter pub get
flutter build apk --release
```

APK ada di `build/app/outputs/flutter-apk/app-release.apk`.
