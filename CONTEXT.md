# TaOrder — Oturum Context & Son Değişiklikler

> **AI Context #4** — Yeni bir sohbete geçildiğinde bu dosyayı oku.
> Sıra: `MANIFEST.md` → `STEPS.md` → `RELEASE.md` → **bu dosya**

Son güncelleme: **2025-06-23** | Uygulama sürümü: **1.0.0** | Preload API: **0.5.0**

---

## 1. Proje durumu (özet)

**TaOrder** — Electron + React + SQLite masaüstü adisyon uygulaması (Windows + macOS).

| Alan | Durum |
|------|--------|
| Menü / masa / sipariş CRUD | ✅ |
| Ayarlar (özelleştirilebilir sekme isimleri) | ✅ |
| Fiş yazdırma (HTML → sistem yazıcısı) | ✅ |
| Dinamik kategori CRUD + etiket rengi | ✅ (yerelde, commit bekliyor olabilir) |
| GitHub Actions Windows `.exe` build | ✅ (run #28012323019 başarılı) |
| Ödeme entegrasyonu | ❌ bilinçli yok |
| ESC/POS ağ yazıcı modu | ❌ planlı (v0.5+) |
| Otomatik test suite | ❌ yok |

---

## 2. Son oturumda yapılanlar (kronolojik)

### CI / Dağıtım
- Node 20 deprecation → `actions/checkout@v6`, `setup-node@v6`, `upload-artifact@v6`, `download-artifact@v7`, `cache@v5`
- `better-sqlite3@12` + CI Node **22** (Node 24'te Windows prebuild yoktu)
- **Asıl CI hatası:** `electron-builder` CI modunda `GH_TOKEN` arıyordu → `publish: null` + `-p never` ile çözüldü
- `scripts/ci-workflow.sh` + `npm run ci:win` — workflow tetikleme/izleme
- `release-windows-only.yml` → `main` push'ta otomatik tetiklenir (ilgili dosya değişince)
- Başarılı run: https://github.com/tanerakhan/taorder/actions/runs/28012323019 (~2 dk)

### Kategori sistemi (yemek/içecek sınırı kaldırıldı)
- Yeni tablo: **`categories`** (`id`, `name`, `color`, `sort_order`, `active`)
- `menu_items.category` (enum) → **`menu_items.category_id`** (FK)
- Otomatik migrate: eski `food`/`drink` → Yemek/İçecek kategorileri
- Yarım kalmış migrate durumu düzeltildi (`menu_items_new` artığı, FK, index sırası)
- **Kategoriler** sekmesi: ekle / düzenle / sil (dolu kategori silinemez)
- Menü listesi, menü ekle, sipariş paneli → dinamik kategori sekmeleri

### Kategori etiket renkleri
- `categories.color` — hex (`#rrggbb`)
- 8 hazır renk + özel renk seçici (`CategoryColorPicker`)
- Renkler menü etiketlerinde ve aktif filtre/sipariş sekmesinde kullanılır
- Varsayılan: Yemek `#ff9f0a`, İçecek `#4f8cff`

### Termal yazıcı (henüz kod yok, karar kaydı)
- TaOrder **Windows sistem yazıcısı** + HTML fiş (`72mm` / 80mm kağıt) kullanır
- Önerilen: **Xprinter XP-Q80A** (USB, ~2.300–2.650 ₺), Windows sürücüsü şart
- Sürücüsüz alternatif: gelecekte ESC/POS + Ethernet (IP:9100) modu planlandı

---

## 3. Veri modeli (güncel)

### categories
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER PK | |
| name | TEXT UNIQUE | Kategori adı |
| color | TEXT | Hex renk, örn. `#ff9f0a` |
| sort_order | INTEGER | Sıralama |
| active | INTEGER | Soft delete |

### menu_items
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | INTEGER PK | |
| name | TEXT | |
| category_id | INTEGER FK → categories | |
| price | REAL | |
| active | INTEGER | Soft delete |

### Diğer tablolar
`tables`, `orders`, `order_items`, `settings` — değişmedi.

**DB yolu:** macOS `~/Library/Application Support/TaOrder/taorder.db`

---

## 4. IPC API (`window.taorder`) — v0.5.0

Preload: `electron/preload.cjs` (CommonJS, **`.cjs` zorunlu**)

### categories (YENİ)
- `getAll()` → `{ id, name, color, sort_order, item_count, ... }`
- `create({ name, color? })`
- `update(id, { name, color })`
- `remove(id)` → kategoride ürün varsa hata

### menu (güncellendi)
- `getAll()` → `category_id`, `category_name`, `category_color`
- `create/update` → `{ name, categoryId, price }` (eski `category: 'food'` yok)
- `getByCategoryId(categoryId)` (eski `getByCategory` kaldırıldı)

### print / settings / tables / orders
Önceki gibi. Bkz. `MANIFEST.md`.

---

## 5. UI sekmeleri (güncel)

| Sekme | view id | Açıklama |
|-------|---------|----------|
| Menü | `menu-list` | Kart grid, dinamik kategori filtreleri |
| Menü Ekle | `menu-add` | Ürün formu, kategori dropdown |
| **Kategoriler** | `categories` | CRUD + renk seçimi |
| Masalar | `tables` | Masa yönetimi |
| Sipariş | `orders` | Masa → adisyon, dinamik kategori sekmeleri |
| Ayarlar | `settings` | App adı, sekme isimleri, yazıcı |

Nav isimleri ayarlardan özelleştirilebilir (`nav_categories` eklendi).

---

## 6. Önemli dosyalar

```
electron/database/
  db.js                    ← şema + migrate (categories, category_id, color)
  categoryRepository.js
  categoryColors.js        ← backend renk sabitleri
  menuRepository.js

src/pages/CategoryManagerPage.jsx
src/components/CategoryColorPicker.jsx
src/constants/categoryColors.js

.github/workflows/
  release-windows-only.yml ← Windows .exe CI
  release.yml              ← Windows + macOS

scripts/ci-workflow.sh     ← gh workflow yönetimi
```

---

## 7. Komutlar

```bash
npm install
npm run dev                 # geliştirme (Electron penceresi)
npm run postinstall         # better-sqlite3 Electron rebuild

npm run ci:win              # Windows CI tetikle + izle
npm run ci:win:status
npm run ci:win:logs

npm run dist:mac            # Mac .dmg
# Windows .exe → GitHub Actions Artifacts veya npm run dist:win (Windows'ta)
```

---

## 8. Bilinen sorunlar / dikkat

1. **Preload güncellenince** uygulamayı tamamen kapatıp `npm run dev` ile aç — aksi halde `categories` API eksik hatası
2. **`npm rebuild better-sqlite3`** system Node için derler; Electron için `npm run postinstall` gerekir
3. Kategori + renk değişiklikleri **commit/push edilmemiş olabilir** — `git status` kontrol et
4. Windows müşteri testi: Actions artifact `.exe` indir → kur → smoke test

---

## 9. Sonraki mantıklı adımlar

1. Kategori/renk değişikliklerini commit + push
2. Windows `.exe` müşteri smoke testi
3. ESC/POS Ethernet yazıcı modu (opsiyonel)
4. Kapalı adisyon geçmişi
5. Uygulama ikonu (`build/icon.icns`, `icon.ico`)

---

## 10. Aktivasyon promptu (yeni context'e yapıştır)

Aşağıdaki bloğu yeni sohbette kullan:

```
TaOrder projesine devam ediyorum (Electron + React + SQLite adisyon uygulaması).

Lütfen önce şu dosyaları oku:
- MANIFEST.md
- STEPS.md
- RELEASE.md
- CONTEXT.md

Proje: /Users/tanerakhan/Projects/taorder
Preload API: 0.5.0 | Uygulama: 1.0.0

Son durum:
- Dinamik kategori CRUD + etiket rengi eklendi (categories tablosu, category_id FK)
- GitHub Actions Windows build çalışıyor (electron-builder GH_TOKEN fix, better-sqlite3@12, Node 22)
- Termal yazıcı: Windows sürücülü 80mm (Xprinter XP-Q80A önerildi); ESC/POS modu henüz yok
- Kategori/renk değişiklikleri commit edilmemiş olabilir — git status kontrol et

Kurallar:
- Ödeme entegrasyonu ekleme (bilinçli olarak dışarıda)
- preload.cjs kullan (ESM preload çalışmıyor)
- Değişikliklerde MANIFEST + STEPS + CONTEXT güncelle
- Türkçe yanıt ver

[Buraya o oturumdaki görevini yaz]
```

---

## 11. Değişiklik günlüğü (context)

| Tarih | Konu | Detay |
|-------|------|-------|
| 2025-06-23 | CI | GH_TOKEN, better-sqlite3 12, Node 22, ci-workflow.sh |
| 2025-06-23 | Kategoriler | categories tablosu, migrate, CategoryManagerPage |
| 2025-06-23 | Renkler | categories.color, CategoryColorPicker |
| 2025-06-23 | Yazıcı | XP-Q80A önerisi, sürücü gerekli (dokümantasyon) |
