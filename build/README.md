# Build assets (electron-builder)

Bu klasör paketleme kaynaklarını içerir.

## İkon (opsiyonel)

Özel uygulama ikonu eklemek için:

| Dosya | Platform | Boyut |
|-------|----------|-------|
| `icon.icns` | macOS | 512×512 ve üzeri |
| `icon.ico` | Windows | 256×256 multi-size |
| `icon.png` | Linux | 512×512 |

Dosyaları buraya koyduktan sonra `npm run dist` tekrar çalıştırın.

İkon yoksa Electron varsayılan ikonu kullanılır (MVP için yeterli).
