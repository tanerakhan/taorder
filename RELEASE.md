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

## 4. GitHub Actions — Billing hatası ve çözümler

### Aldığınız hata

```
The job was not started because recent account payments have failed
or your spending limit needs to be increased.
```

Bu **kod hatası değil** — GitHub hesabında faturalandırma/ limit ayarı engelliyor.

### GitHub Actions fiyat özeti (2025)

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

#### ✅ Seçenek 1 — Repoyu PUBLIC yapın (önerilen, $0)

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

## 6. Yöntem B — AppVeyor (ücretsiz Windows alternatifi)

**Ne zaman:** GitHub billing çözülemiyorsa, sadece Windows `.exe` lazımsa.

**Koşul:** Proje **açık kaynak** (public GitHub repo) — AppVeyor OSS planı ücretsiz.

**Kurulum:**
1. https://ci.appveyor.com → GitHub ile giriş
2. `taorder` reposunu ekle
3. Push veya “New build” → Windows'ta `.exe` üretir
4. AppVeyor arayüzünden artifact indir

Config: kökte `appveyor.yml`

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
Windows müşteri var mı?
  └─ Evet → .exe lazım
       ├─ GitHub public repo yapabilir misin?
       │    └─ Evet → release-windows-only.yml veya release.yml (ÜCRETSİZ)
       ├─ GitHub billing düzeltebilir misin?
       │    └─ Evet → private + $5–10 limit
       ├─ AppVeyor OSS?
       │    └─ Public repo → appveyor.yml (ÜCRETSİZ)
       └─ Windows PC / VM var mı?
            └─ npm run dist:win (ÜCRETSİZ, tek seferlik)

Mac müşteri var mı?
  └─ Kendi Mac'inizde npm run dist:mac (zaten çalışıyor)
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
| 2025-06-23 | release-windows-only.yml + appveyor.yml eklendi |
