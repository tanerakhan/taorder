# TaOrder — Dağıtım Kılavuzu (MVP)

Son güncelleme: **2025-06-23** | Sürüm: **1.0.0**

Müşteriye **hazır .exe / .dmg** göndermek için en pratik yol: **GitHub Actions** (Windows PC gerekmez).

---

## Önerilen: GitHub Actions ile derleme

Mac'inizde kodu GitHub'a push edersiniz; GitHub'ın Windows ve Mac sunucuları `.exe` ve `.dmg` üretir. Siz sadece indirip müşteriye gönderirsiniz.

### Bir kez yapılacaklar

```bash
cd taorder
git init
git add .
git commit -m "TaOrder MVP 1.0.0"
git branch -M main
git remote add origin https://github.com/KULLANICI/taorder.git
git push -u origin main
```

(GitHub'da boş repo oluşturun, `KULLANICI/taorder` kısmını kendi adresinizle değiştirin.)

### Her sürüm için — exe/dmg almak

**Yöntem A — Manuel (en kolay)**

1. GitHub repo → **Actions** sekmesi
2. Sol menüden **Release** workflow
3. Sağ üst **Run workflow** → **Run workflow**
4. ~10–15 dk bekleyin (Windows + Mac paralel derlenir)
5. Tamamlanan run'a tıklayın → en altta **Artifacts**:
   - **windows** → `TaOrder-1.0.0-x64.exe` (+ portable)
   - **macos** → `TaOrder-1.0.0-arm64.dmg`, `x64.dmg`, zip'ler

**Yöntem B — Etiket ile (Release sayfası)**

```bash
# package.json version güncelle, commit et
git tag v1.0.0
git push origin v1.0.0
```

GitHub → **Releases** bölümünde tüm dosyalar tek zip/release altında listelenir.

### Müşteriye ne gönderilir?

| Müşteri | Gönderilecek dosya | Müşteri ne yapar? |
|---------|-------------------|-------------------|
| **Windows** | `TaOrder-1.0.0-x64.exe` | Çift tık → kur → masaüstünden aç |
| Windows (kurulumsuz) | `TaOrder-1.0.0-portable.exe` | Çift tık → doğrudan çalışır |
| **Mac (M1/M2/M3)** | `TaOrder-1.0.0-arm64.dmg` | dmg aç → Applications'a sürükle |
| **Mac (Intel)** | `TaOrder-1.0.0-x64.dmg` | aynı |

İsteğe bağlı: [`docs/MUSTERI-KURULUM-WINDOWS.txt`](./docs/MUSTERI-KURULUM-WINDOWS.txt) dosyasını exe ile birlikte gönderin.

**Müşteriye npm, terminal veya proje dosyası gönderilmez.**

---

## Yerel derleme (alternatif)

GitHub kullanmak istemezseniz:

| Platform | Komut | Nerede çalışır |
|----------|-------|----------------|
| macOS | `npm run dist:mac` | Mac |
| Windows | `npm run dist:win` | Windows |

Çıktı: `release/` klasörü.

---

## Sürüm güncelleme

1. `package.json` → `"version": "1.0.1"`
2. Commit + push
3. Actions → Run workflow **veya** `git tag v1.0.1 && git push origin v1.0.1`
4. Yeni `.exe` / `.dmg` indir → müşteriye gönder

---

## Kullanıcı verileri

| OS | Veritabanı konumu |
|----|-------------------|
| macOS | `~/Library/Application Support/TaOrder/taorder.db` |
| Windows | `%APPDATA%\TaOrder\taorder.db` |

Güncellemede veriler korunur.

---

## MVP sınırları

- Kod imzası yok → ilk açılışta güvenlik uyarısı normal
- Otomatik güncelleme yok → yeni exe/dmg manuel gönderilir
- GitHub Actions artifact'ları **90 gün** saklanır

---

## Workflow dosyası

`.github/workflows/release.yml` — Windows (`windows-latest`) + macOS (`macos-latest`) paralel build.
