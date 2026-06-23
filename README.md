# TaOrder

Restoran ve kafeler için masaüstü adisyon / sipariş yönetim uygulaması (MVP).

## Özellikler

- Menü yönetimi (yemek / içecek CRUD)
- Masa yönetimi ve sipariş atama
- Adisyon görüntüleme, fiş yazdırma (önizleme + yazıcı)
- Özelleştirilebilir sekme isimleri (Ayarlar)
- Windows ve macOS desteği
- Veriler yerel SQLite dosyasında (bulut yok)

## Geliştirme

```bash
npm install
npm run dev
```

## Kullanıcıya dağıtım (.dmg / .exe)

**Önerilen:** GitHub Actions — Mac'ten push, GitHub Windows'ta `.exe` üretir.

Detaylı adımlar: **[RELEASE.md](./RELEASE.md)** (billing, AppVeyor, karar ağacı)

```bash
# GitHub'a push sonrası:
# Actions → Release → Run workflow → Artifacts → windows → TaOrder-1.0.0-x64.exe
```

Müşteriye sadece `.exe` veya `.dmg` gönderilir; npm/terminal gerekmez.

## Proje dokümantasyonu

- [`MANIFEST.md`](./MANIFEST.md) — mimari ve veri modeli
- [`STEPS.md`](./STEPS.md) — geliştirme adımları
- [`DISTRIBUTION.md`](./DISTRIBUTION.md) — paketleme ve kullanıcı kurulumu
