# TaOrder — Release & Dağıtım Planı

> **AI Context #3** — Release, CI/CD, müşteriye dosya gönderme.
> Oturum başında: `MANIFEST.md` + `STEPS.md` + **bu dosya**.

Son güncelleme: **2025-06-23** | Sürüm: **1.0.0 (MVP)**

---

## 1. Amaç

Müşteriye **hazır kurulum dosyası** göndermek. Müşteri npm/terminal/proje kodu görmez.

| Platform | Dosya | Müşteri aksiyonu |
|----------|-------|------------------|
| Windows | `TaOrder-X.X.X-x64.exe` | Çift tık → kur → aç |
| Windows portable | `TaOrder-X.X.X-portable.exe` | Çift tık → doğrudan çalışır |
| macOS Apple Silicon | `TaOrder-X.X.X-arm64.dmg` | dmg aç → Applications'a sürükle |
| macOS Intel | `TaOrder-X.X.X-x64.dmg` | aynı |

Ek: [`docs/MUSTERI-KURULUM-WINDOWS.txt`](./docs/MUSTERI-KURULUM-WINDOWS.txt) — müşteriye Türkçe kurulum notu.

---

## 2. Dosya yapısı (release ile ilgili)

```
.github/workflows/
  release.yml              ← Windows + macOS (GitHub Actions)
  release-windows-only.yml ← Sadece Windows (daha ucuz / ücretsiz kotaya sığar)
appveyor.yml               ← Ücretsiz alternatif (Windows, açık kaynak)
build/                     ← İkon dosyaları (opsiyonel)
release/                   ← Yerel build çıktısı (gitignore)
DISTRIBUTION.md            ← Kısa dağıtım özeti
RELEASE.md                 ← Bu dosya (tam plan + CI + billing)
docs/MUSTERI-KURULUM-WINDOWS.txt
```

---

## 3. Yöntem A — GitHub Actions (ana plan)

### Workflow: `release.yml`

| Job | Runner | Çıktı | Süre (tahmini) |
|-----|--------|-------|----------------|
| `build-windows` | `windows-latest` | `.exe` × 2 | ~8–12 dk |
| `build-macos` | `macos-latest` | `.dmg` + `.zip` | ~12–20 dk |
| `github-release` | `ubuntu-latest` | Tag'de Release birleştir | ~1 dk |

**Tetikleme:**
- Manuel: GitHub → Actions → Release → **Run workflow**
- Etiket: `git tag v1.0.0 && git push origin v1.0.0`

**İndirme:**
- Actions → tamamlanan run → **Artifacts** → `windows` / `macos`
- Tag push ise: **Releases** sayfası

### Workflow: `release-windows-only.yml`

Sadece Windows `.exe` gerekiyorsa (Mac müşteri yok) — **daha az dakika, billing sorununa daha az takılır.**

---

## 4. GitHub Actions — Billing / hesap kilitli

### Hata A — Spending limit / ödeme başarısız

```
The job was not started because recent account payments have failed
or your spending limit needs to be increased.
```

### Hata B — Hesap kilitli (public repo bile çalışmaz)

```
The job was not started because your account is locked due to a billing issue.
```

**Önemli:** Repoyu **public** yaptınız ama hâlâ bu hatayı alıyorsanız sorun repoda değil — **tüm GitHub hesabınız** faturalandırma yüzünden kilitli. Public repo = Actions ücretsiz olur, ama **kilitli hesapta hiçbir workflow başlamaz**.

**Hesabı açmak için:**
1. https://github.com/settings/billing
2. Kırmızı uyarı / outstanding balance var mı bakın
3. Ödeme yöntemini güncelleyin (geçerli kart)
4. Varsa **ödenmemiş faturayı** kapatın
5. Spending limit tanımlayın (ör. $5–10) — çoğu MVP'de fatura $0 kalır
6. Birkaç saat bekleyin; hâlâ kilitliyse: https://support.github.com

**GitHub Actions düzelene kadar Windows .exe için → §6 AppVeyor (hemen kullanın).**

---

### GitHub Actions fiyat özeti (hesap açıkken)

| Repo tipi | Standart runner |
|-----------|-----------------|
| **Public (açık)** | **Ücretsiz**, sınırsız dakika (fair use) |
| **Private (kapalı)** | Ayda ~2.000 dakika ücretsiz, sonra ücretli |

**Çarpanlar (private, faturalandırılan dakika):**
- Linux: ×1
- Windows: ×2
- macOS: ×10 ← pahalı

**Örnek tek release (private repo):**
- Windows build ~10 dk → ~20 faturalandırılan dk
- macOS build ~15 dk → ~150 faturalandırılan dk
- **Toplam ~170 dk** → ücretsiz 2.000 kotanın içinde kalır

Hata genelde şunlardan biri:
1. Ödeme yöntemi geçersiz / ödeme başarısız
2. Spending limit **$0** ve ücretsiz kota bitmiş
3. Private repo + billing etkin değil

### Ne yapmalısınız? (öncelik sırası)

#### 🚨 Hesap kilitliyse — AppVeyor kullanın (GitHub Actions beklemeden)

Aşağıdaki **§6 AppVeyor** adımlarını izleyin. GitHub hesabından bağımsız, public OSS için **ücretsiz** Windows `.exe` üretir.

Mac `.dmg` → kendi Mac'inizde `npm run dist:mac` (zaten `release/` klasöründe var).

#### ✅ Seçenek 1 — Repoyu PUBLIC yapın ($0, hesap açık olmalı)

Settings → General → Change visibility → **Public**

Açık repolarda GitHub Actions **ücretsiz** (standart runner). MVP için kod gizliliği kritik değilse en kolay yol.

#### ✅ Seçenek 2 — Sadece Windows workflow çalıştırın

Mac build'i atlayın → `release-windows-only.yml` kullanın. macOS runner en pahalı kısım.

Mac `.dmg` zaten **kendi Mac'inizde** `npm run dist:mac` ile üretilebilir (zaten yaptınız).

#### ✅ Seçenek 3 — Billing düzelt (private kalacaksa)

GitHub → Settings → **Billing and plans**:
- Geçerli ödeme yöntemi ekleyin
- **Spending limit**: aylık **$5–10** yeterli (ayda birkaç release için)
- Çoğu MVP kullanımında **$0 fatura** — limit sadece “job başlasın” diye tanımlanır

#### ✅ Seçenek 4 — AppVeyor (Windows, ücretsiz OSS)

Açık kaynak proje olarak AppVeyor'da Windows build — **ücretsiz tier**.  
Dosya: `appveyor.yml` (projede hazır).  
Detay: §6 aşağıda.

#### ✅ Seçenek 5 — Yerel / tanıdık Windows PC

Bir kez Windows'ta `npm run dist:win` → `release/*.exe` → müşteriye gönder.

---

## 5. Adım adım: GitHub'dan exe almak

```bash
# 1) Projeyi GitHub'a yükle (bir kez)
git init && git add . && git commit -m "TaOrder 1.0.0"
git remote add origin https://github.com/KULLANICI/taorder.git
git push -u origin main

# 2) Actions'tan build (veya tag)
# GitHub UI → Actions → Release (veya Release Windows Only) → Run workflow

# 3) Artifacts indir
# windows → TaOrder-1.0.0-x64.exe

# 4) Müşteriye gönder (WeTransfer, Drive, e-posta)
```

Sürüm güncelleme:
1. `package.json` → `"version": "1.0.1"`
2. Commit + push
3. Workflow tekrar çalıştır veya `git tag v1.0.1 && git push origin v1.0.1`

---

## 6. Yöntem B — AppVeyor (GitHub Actions kilitliyken BİRİNCİL yol)

**Ne zaman:** `account is locked due to a billing issue` veya Actions hiç çalışmıyor.

**Maliyet:** Public açık kaynak repo → **$0**

**Adımlar:**

1. Kod GitHub'da public ve push edilmiş olsun (`appveyor.yml` repo kökünde)
2. https://ci.appveyor.com/sites → **GitHub** ile giriş
3. **New project** → `taorder` reposunu seç → **Add**
4. İlk build otomatik başlar (~10–15 dk)
5. Build bitince → **Artifacts** sekmesi:
   - `TaOrder-Setup` → `TaOrder-1.0.0-x64.exe`
   - `TaOrder-Portable` → portable exe
6. İndir → müşteriye gönder

**Yeniden build:** AppVeyor → projeye gir → **New build** veya yeni commit push.

Config dosyası: kökte `appveyor.yml` (projede hazır).

---

## 7. Yöntem C — Yerel build

| Nerede | Komut | Çıktı |
|--------|-------|-------|
| Mac | `npm run dist:mac` | `.dmg` |
| Windows | `npm run dist:win` | `.exe` |

`release/` klasöründen müşteriye dosya gönder.

---

## 8. Müşteri verisi (kurulum sonrası)

| OS | Konum |
|----|-------|
| macOS | `~/Library/Application Support/TaOrder/taorder.db` |
| Windows | `%APPDATA%\TaOrder\taorder.db` |

Güncellemede aynı `appId` → veri korunur.

---

## 9. MVP sınırları

- Kod imzası yok → SmartScreen / Gatekeeper uyarısı normal
- Otomatik güncelleme yok
- GitHub Artifacts 90 gün saklanır
- Windows build Mac'te cross-compile **edilemez** (better-sqlite3 native)

---

## 10. Karar ağacı (hangi yöntem?)

```
GitHub Actions "account is locked" hatası?
  └─ Evet → AppVeyor (§6) + Mac dmg yerel (npm run dist:mac)
  └─ Hayır → GitHub Actions (public repo, §3)

Windows müşteri var mı?
  └─ Evet → .exe lazım
       ├─ AppVeyor (hesap kilitliyse — ÜCRETSİZ)
       ├─ GitHub Actions windows-only (hesap açıksa — ÜCRETSİZ public)
       └─ Windows PC → npm run dist:win

Mac müşteri var mı?
  └─ Kendi Mac'inizde npm run dist:mac
```

---

## 11. AI talimatları

1. Release sorularında **önce bu dosyayı oku**
2. Billing hatası = GitHub ayarı, kod değil
3. En ucuz exe yolu: **public repo + windows-only workflow** veya **AppVeyor**
4. Mac dmg: yerel Mac build yeterli
5. Değişiklik olursa §12 changelog güncelle

---

## 12. Changelog

| Tarih | Değişiklik |
|-------|------------|
| 2025-06-23 | İlk RELEASE.md — GitHub Actions planı, billing notları, alternatifler |
| 2025-06-23 | Workflow Node.js 24 + actions/checkout@v6, setup-node@v6 |
