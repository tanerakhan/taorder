# TaOrder — Dağıtım (kısa özet)

> Tam plan, billing, alternatifler: **[RELEASE.md](./RELEASE.md)**

## Müşteriye gönderilecek dosya

| Platform | Dosya |
|----------|-------|
| Windows | `TaOrder-1.0.0-x64.exe` |
| Mac M1/M2/M3 | `TaOrder-1.0.0-arm64.dmg` |

Müşteri sadece çift tıklar — npm/terminal yok.

## Exe/dmg nasıl üretilir?

1. **GitHub Actions** (önerilen) — `.github/workflows/release.yml`
2. **Sadece Windows** (ucuz) — `release-windows-only.yml`
3. **AppVeyor** (ücretsiz OSS) — `appveyor.yml`
4. **Yerel** — Mac: `npm run dist:mac`, Windows: `npm run dist:win`

Billing hatası alırsanız → **RELEASE.md §4**

## Müşteri kurulum notu

[`docs/MUSTERI-KURULUM-WINDOWS.txt`](./docs/MUSTERI-KURULUM-WINDOWS.txt)
