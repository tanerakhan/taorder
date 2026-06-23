# TaOrder — Proje Manifesti

> **AI Context Dosyası** — Bu dosya projenin tek kaynaklı gerçeğidir (single source of truth).
> Her yeni oturumda veya context dağıldığında önce bu dosyayı, ardından `STEPS.md` dosyasını oku.

Son güncelleme: **2025-06-23** | Versiyon: **1.0.0 (MVP)**

---

## 1. Proje Özeti

**TaOrder**, restoran/kafe için masaüstü **adisyon ve sipariş yönetim** uygulamasıdır.

| Özellik | Durum |
|---------|-------|
| Ayarlar + özelleştirilebilir sekme isimleri | ✅ v0.3 |
| Menü ekleme formu + success toast | ✅ v0.2 |
| Menü düzenle / sil | ✅ v0.2 |
| Masa CRUD + toplu sayı ayarı | ✅ v0.2 |
| Sipariş sayfası (masaya atama) | ✅ v0.1 (temel) |
| Adisyon kapatma (ödeme uygulama dışı) | ✅ v0.1 |
| Ödeme entegrasyonu | ❌ Bilinçli olarak yok |
| Kapalı adisyon geçmişi | ❌ Sonraki faz |
| Yazdırma | ✅ v0.4 (fiş yazdır) |

**Hedef platform:** Windows + macOS (Electron cross-platform)

---

## 2. Teknoloji Yığını

```
Electron 33       → Masaüstü kabuk (main process)
Vite 6 + React 18 → Renderer UI
better-sqlite3    → Yerel SQLite veritabanı (main process)
IPC (contextBridge) → Güvenli main ↔ renderer iletişimi
electron-builder  → Dağıtım paketleri (.dmg, .exe)
electron-rebuild  → Native modül derlemesi (postinstall)
```

---

## 3. Yerel Veritabanı

Veri **kullanıcının bilgisayarında** saklanır. Sunucu/bulut yok.

| OS | Konum |
|----|-------|
| macOS | `~/Library/Application Support/TaOrder/taorder.db` |
| Windows | `%APPDATA%\TaOrder\taorder.db` |

- `electron/database/db.js` → `app.getPath('userData')` + `taorder.db`
- WAL modu, foreign keys aktif
- IPC: `app:getDbPath()` ile yol sorgulanabilir

---

## 4. Dizin Yapısı

```
taorder/
├── MANIFEST.md              ← Mimari + veri modeli (AI context #1)
├── STEPS.md                 ← Geliştirme adımları (AI context #2)
├── RELEASE.md               ← Dağıtım, CI, billing, müşteri exe/dmg (AI context #3)
├── DISTRIBUTION.md          ← Kısa dağıtım özeti
├── electron/
│   ├── main.js
│   ├── preload.js
│   ├── ipc/handlers.js
│   └── database/
│       ├── db.js
│       ├── menuRepository.js
│       ├── tableRepository.js
│       └── orderRepository.js
└── src/
    ├── App.jsx
    ├── constants/views.js   ← Nav sekme sabitleri
    ├── pages/
    │   ├── MenuListPage.jsx
    │   ├── MenuAddPage.jsx
    │   ├── TableManagerPage.jsx
    │   └── OrdersPage.jsx
    └── components/
        ├── Layout.jsx
        ├── Toast.jsx
        ├── TableGrid.jsx
        └── OrderPanel.jsx
```

---

## 5. Veri Modeli

### settings
| Alan | Tip | Açıklama |
|------|-----|----------|
| key | TEXT PK | Örn. `nav_menuList`, `app_title` |
| value | TEXT | Görünen isim |

Varsayılanlar `settingsDefaults.js` içinde; DB'de yoksa fallback kullanılır.

### menu_items (içerik)
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER PK | |
| name | TEXT | Ürün adı |
| category | TEXT | `food` \| `drink` |
| price | REAL | Birim fiyat (₺) |
| active | INTEGER | Soft delete |

### tables (içerik)
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER PK | |
| number | INTEGER UNIQUE | Masa numarası |
| label | TEXT | Görünen ad |
| active | INTEGER | Soft delete |

### orders / order_items
Sipariş fazında kullanılır. Detay §5 eski manifest ile aynı — `order_items.unit_price` snapshot.

**İçerik mantığı:** Menü ve masa bağımsız içerik varlıklarıdır. Sipariş ekranında menü içerikleri masalara atanır.

---

## 6. IPC API (`window.taorder`)

### app / settings
- `getDbPath()` → string
- `settings.getAll()`, `settings.setMany(updates)`, `settings.reset()`

### menu
- `getAll()`, `getByCategory(category)`, `create()`, `update()`, `remove()`

### tables
- `getAll()` → düz masa listesi (yönetim)
- `getSummaries()` → sipariş ekranı (total, hasOpenOrder)
- `getCount()`, `setCount(count)` → toplu masa sayısı
- `create()`, `update()`, `remove()`

### orders
- `getBill()`, `addItem()`, `removeItem()`, `updateItemQuantity()`, `close()`

### print
- `receipt(data)` → sistem yazdırma diyaloğu
- `getPrinters()` → bağlı yazıcı listesi

---

## 7. UI Sekmeleri

| Sekme | Açıklama |
|-------|----------|
| **Menü** | Tüm yemek/içecek kartları, filtre, düzenle/sil |
| **Menü Ekle** | Yeni içerik formu; success toast 3 sn |
| **Masalar** | Toplu sayı, tek ekle, liste CRUD; DB yolu gösterilir |
| **Ayarlar** | Uygulama adı + sekme isimlerini özelleştir |
| **Sipariş** | Masa seç → menüden atama → adisyon |

---

## 8. Komutlar

```bash
npm install
npm run dev              # geliştirme
npm run build && npm start
npm run dist:mac         # macOS .dmg
npm run dist:win         # Windows .exe (Windows'ta)
```

Detay: [`DISTRIBUTION.md`](./DISTRIBUTION.md)

---

## 9. AI Talimatları

1. **MANIFEST.md + STEPS.md + RELEASE.md oku** — context kaybında buradan devam
2. DB sadece main process; renderer IPC kullanır
3. Soft delete koru (menu_items, tables)
4. Ödeme ekleme — kullanıcı istemedikçe
5. Her anlamlı değişiklikte MANIFEST + STEPS güncelle

---

## 10. Sonraki Adımlar

1. Sipariş UX iyileştirmesi (atama akışı)
2. Kapalı adisyon geçmişi
3. Adisyon fişi yazdırma

---

## 11. Değişiklik Günlüğü

| Tarih | Versiyon | Değişiklik |
|-------|----------|------------|
| 2025-06-23 | 0.1.0 | İlk mimari |
| 2025-06-23 | 1.0.0 | MVP dağıtım paketi (electron-builder) |
| 2025-06-23 | 0.2.1 | Preload.cjs fix |
