# TaOrder — Geliştirme Adımları

> **Context dosyası #2** — Yapılan işlerin kronolojik kaydı.
> AI her oturumda `MANIFEST.md` + bu dosyayı okuyarak devam eder.

Son güncelleme: **2025-06-23** | Faz: **v0.2 — İçerik CRUD**

---

## Adım 1 — v0.1 Temel Mimari (2025-06-23)

- Electron + Vite + React + SQLite kuruldu
- Repository pattern + IPC köprüsü (`window.taorder`)
- Menü, masa, sipariş tabloları oluşturuldu
- Seed: 8 masa, 10 menü öğesi
- `MANIFEST.md` oluşturuldu

---

## Adım 2 — Yerel Veritabanı Yapısı

### Nerede saklanır?

Veritabanı **kullanıcının kendi bilgisayarında**, Electron `userData` klasöründe:

| OS | Tipik konum |
|----|-------------|
| **macOS** | `~/Library/Application Support/TaOrder/taorder.db` |
| **Windows** | `%APPDATA%\TaOrder\taorder.db` |

### Nasıl çalışır?

```
Uygulama açılır
    → electron/database/db.js → initDatabase()
    → better-sqlite3 ile taorder.db açılır/oluşturulur
    → Şema yoksa CREATE TABLE çalışır
    → Tablolar boşsa seed verisi eklenir
    → Tüm okuma/yazma main process'te (güvenli)
    → UI IPC ile veri ister
```

### Tablolar

| Tablo | Rol | Soft delete |
|-------|-----|-------------|
| `menu_items` | Yemek/içecek içerik | ✅ `active=0` |
| `tables` | Masa içerik | ✅ `active=0` |
| `orders` | Masaya bağlı adisyon | status: open/closed |
| `order_items` | Sipariş satırları | — |

**Önemli:** Sunucu yok, bulut yok. Veri tamamen lokal SQLite dosyasında.

---

## Adım 3 — Sayfa Ayrımı (v0.2)

Eski tek ekran yapısı 4 sekmeye bölündü:

| Sekme | Dosya | Amaç |
|-------|-------|------|
| **Menü** | `pages/MenuListPage.jsx` | Tüm içerikleri görüntüle, filtrele, düzenle/sil |
| **Menü Ekle** | `pages/MenuAddPage.jsx` | Yeni içerik ekle veya düzenleme formu |
| **Masalar** | `pages/TableManagerPage.jsx` | Masa CRUD + toplu sayı ayarı |
| **Sipariş** | `pages/OrdersPage.jsx` | Masaya menü atama (mevcut OrderPanel) |

Nav sabitleri: `src/constants/views.js`

---

## Adım 4 — Toast Bildirimleri

- `components/Toast.jsx` — 3 sn sonra otomatik kaybolur
- Başarı: yeşil (`toast-success`)
- Hata: kırmızı (`toast-error`)
- Kullanıldığı yerler: menü ekle/güncelle/sil, masa ekle/güncelle/sil/sayı ayarla

---

## Adım 5 — Menü CRUD Detayları

### Menü Listesi
- Yemek / İçecek / Tümü filtresi
- Kart grid görünümü
- Düzenle → Menü Ekle sekmesine yönlendirir
- Sil → confirm + toast

### Menü Ekle
- Form: ad, kategori (food/drink), fiyat
- Ekleme sonrası form temizlenir + `"X menüye eklendi"` toast
- Düzenleme modu: Menü listesinden "Düzenle" ile açılır

---

## Adım 6 — Masa CRUD Detayları

### Toplu sayı (`tables:setCount`)
- 1–99 arası masa sayısı girilir
- Eksik numaralar oluşturulur (Masa 1, Masa 2…)
- Fazla masalar soft-delete edilir
- IPC: `tables:setCount(count)`

### Tek masa ekle
- Masa numarası + opsiyonel etiket
- Numara UNIQUE — çakışmada hata toast

### Liste
- Düzenle (inline form), Sil (soft delete)

### DB yolu
- Masalar sayfası altında `app:getDbPath` ile dosya yolu gösterilir

---

## Adım 7 — API Değişiklikleri (v0.2)

### Yeni IPC kanalları
```
app:getDbPath          → string (db dosya yolu)
tables:getCount        → number
tables:setCount(count) → Table[]
tables:getSummaries    → TableSummary[] (sipariş ekranı için)
```

### Değişen davranış
- `tables:getAll` artık sadece düz masa listesi (yönetim ekranı)
- Sipariş ekranı `tables:getSummaries` kullanır (toplam, dolu/boş)

---

## Adım 8 — Bilinçli Erteleme (Sipariş Fazı)

Sipariş sekmesi mevcut `TableGrid` + `OrderPanel` ile çalışıyor.
Sonraki fazda geliştirilecekler:
- Menü-masa atama UX iyileştirmesi
- Sipariş geçmişi
- Ödeme notu / fiş

---

## Adım 9 — Sonraki Oturum İçin

1. `MANIFEST.md` §10 öncelik listesine bak
2. Bu dosyadaki son adım numarasından devam et
3. Yeni adım eklendiğinde buraya **Adım N** olarak yaz
4. `MANIFEST.md` changelog güncelle

---

## Değişiklik Günlüğü

| Tarih | Adım | Özet |
|-------|------|------|
| 2025-06-23 | 1 | v0.1 temel mimari |
| 2025-06-23 | 2–7 | v0.2 sayfa ayrımı, toast, masa/menü CRUD, setCount API |
| 2025-06-23 | 10 | Preload ESM hatası düzeltildi → `preload.cjs` |
| 2025-06-23 | 11 | Ayarlar sekmesi + özelleştirilebilir nav isimleri |
| 2025-06-23 | 12 | Adisyon fişi yazdırma |
| 2025-06-23 | 14 | GitHub Actions release workflow (exe/dmg CI) |

---

## Adım 14 — GitHub Actions (2025-06-23)

- `.github/workflows/release.yml`
- `workflow_dispatch` → Actions'tan manuel build
- `v*` tag push → GitHub Release + dosyalar
- Artifacts: `windows` (exe), `macos` (dmg/zip)
- Müşteriye sadece indirilen exe/dmg gider


- `npm run dist:mac` / `dist:win` komutları
- `release/` klasörüne installer çıktısı
- `DISTRIBUTION.md` kullanıcı/kurulum kılavuzu
- Sürüm **1.0.0**


### Sorun
Menü/masa ekleme butonları çalışmıyordu. Kök neden:
```
Unable to load preload script: preload.js
SyntaxError: Cannot use import statement outside a module
```

### Çözüm
- `electron/preload.js` → `electron/preload.cjs` (require kullanır)
- `src/utils/taorder.js` → merkezi API erişimi + anlamlı hata mesajı

---

## Adım 11 — Ayarlar ve Özelleştirilebilir İsimler (2025-06-23)

### Eklenenler
- `settings` SQLite tablosu (key-value, lokal DB'de)
- `settingsRepository` + IPC: `getAll`, `setMany`, `reset`
- **Ayarlar** sekmesi — uygulama adı + tüm sekme isimleri düzenlenebilir
- `SettingsContext` — nav ve sayfa başlıkları ayarlardan okunur
- Varsayılana dön butonu

### Özelleştirilebilir alanlar
| Anahtar | Varsayılan |
|---------|------------|
| app_title | TaOrder |
| nav_menuList | Menü |
| nav_menuAdd | Menü Ekle |
| nav_tables | Masalar |
| nav_orders | Sipariş |
| nav_settings | Ayarlar |

---

## Adım 12 — Adisyon Fişi Yazdırma (2025-06-23)

### Akış
1. Sipariş → masa seç → ürün ekle
2. **Fiş Yazdır** → yazdırma diyaloğu
3. Fiş masaya götürülür

### Teknik
- `electron/print/` — 80mm termal HTML + `webContents.print()`
- Ayarlar: işletme adı, alt mesaj, yazıcı seçimi

