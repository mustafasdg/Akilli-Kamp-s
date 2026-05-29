# Akıllı Kampüs Uygulaması

Üniversite öğrenci ve personelinin günlük kampüs hayatını kolaylaştırmak için geliştirilen mobil uygulama. .NET 9 REST API backend ve React Native (Expo) mobil ön yüzden oluşur.

---

## Proje Yapısı

```
smartcampusapp/
├── SmartCampus.Api/   → .NET 9 ASP.NET Core REST API (SQLite)
├── mobile/            → React Native / Expo mobil uygulama
└── backend/           → Node.js + Prisma (legacy, aktif kullanılmıyor)
```

---

## Özellikler

| Modül | Durum |
|---|---|
| JWT kimlik doğrulama (kayıt / giriş / oturum yenileme) | ✅ |
| Duyurular — sayfalı liste, kategori badge, sonsuz kaydırma | ✅ |
| Yemekhane menüsü — günlük liste, bugün vurgusu, kalori | ✅ |
| İnteraktif kampüs haritası (react-native-maps, gerçek koordinatlar) | ✅ |
| Hava durumu şeridi (Open-Meteo, Isparta) | ✅ |
| Profil ekranı — kullanıcı bilgileri, çıkış | ✅ |
| Light tema, pull-to-refresh, hata yönetimi | ✅ |

---

## Backend — SmartCampus.Api

### Gereksinimler
- .NET SDK 9

### Çalıştırma

```bash
cd SmartCampus.Api
dotnet restore
dotnet run --launch-profile http
```

API `http://0.0.0.0:5206` adresinde başlar.  
İlk açılışta SQLite veritabanı otomatik oluşturulur ve seed verisi eklenir.

### Ortam Ayarları

`SmartCampus.Api/appsettings.json`:

```json
{
  "Database": {
    "Provider": "Sqlite"
  },
  "ConnectionStrings": {
    "SqliteConnection": "Data Source=SmartCampus.db"
  },
  "Jwt": {
    "Key": "BURAYA_GUCLU_BIR_SECRET_YAZ",
    "Issuer": "SmartCampus.Api",
    "Audience": "SmartCampus.Mobile",
    "ExpiresMinutes": 120
  }
}
```

> ⚠️ Üretimde `Jwt.Key` değerini mutlaka değiştir.

### Endpointler

**Auth (herkese açık)**
```
POST /api/auth/register   → { name, email, password }
POST /api/auth/login      → { email, password }
GET  /api/auth/me         → Bearer token gerekli
```

**Veri (Bearer token gerekli)**
```
GET /api/announcements?page=1&pageSize=10
GET /api/menus?page=1&pageSize=10
GET /api/locations?page=1&pageSize=50
```

Tüm liste endpointleri şu formatı döner:
```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "totalCount": 0,
  "totalPages": 0,
  "hasNextPage": false
}
```

**Demo kullanıcı (seed)**
```
E-posta : demo@smartcampus.local
Şifre   : SmartCampus123!
```

---

## Mobil Uygulama — mobile/

### Gereksinimler
- Node.js 18+
- Expo Go uygulaması (iOS veya Android)
- Bilgisayar ve telefon **aynı Wi-Fi / hotspot** ağında olmalı

### Kurulum

```bash
cd mobile
npm install
```

### API Adresi Ayarı

`mobile/src/utils/constants.ts` dosyasında bilgisayarının LAN IP'ini yaz:

```ts
// Windows → cmd → ipconfig → "IPv4 Adresi"
export const API_BASE_URL = 'http://192.168.1.XX:5206/api';
```

### Çalıştırma

```bash
npx expo start
```

Terminaldeki QR kodu Expo Go ile tara.

### Proje Yapısı

```
mobile/
├── App.tsx                          → SafeAreaProvider + AuthProvider + Navigator
├── src/
│   ├── context/AuthContext.tsx      → JWT auth state (login, register, logout)
│   ├── hooks/
│   │   ├── useHomeData.ts           → Ana sayfa paralel veri çekme
│   │   ├── useAnnouncements.ts      → Sayfalı duyuru listesi
│   │   ├── useMenus.ts              → Sayfalı menü listesi
│   │   ├── useLocations.ts          → Kampüs konumları
│   │   └── useWeather.ts            → Open-Meteo hava durumu
│   ├── navigation/
│   │   ├── RootNavigator.tsx        → Auth ↔ App geçişi
│   │   └── AppTabs.tsx              → Alt sekme navigasyonu
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx           → Dashboard (hava, harita, duyurular, menü)
│   │   ├── AnnouncementsScreen.tsx
│   │   ├── MenuScreen.tsx
│   │   ├── MapScreen.tsx            → react-native-maps, 15 gerçek konum
│   │   └── ProfileScreen.tsx
│   ├── services/
│   │   ├── apiClient.ts             → Axios + JWT interceptor
│   │   ├── authService.ts
│   │   └── dataService.ts
│   ├── theme/colors.ts              → Light tema renk paleti
│   └── types/models.ts              → TypeScript arayüzleri
```

### TypeScript Kontrolü

```bash
npm run typecheck
```

---

## Geliştirme Notları

- **Harita:** `react-native-maps` kullanılıyor. iOS'ta Apple Maps, Android'de Google Maps API key gerekir.
- **Hava durumu:** [Open-Meteo](https://open-meteo.com/) — ücretsiz, API key gerektirmez. Koordinatlar `useWeather(lat, lon)` ile değiştirilebilir.
- **Konum verisi:** 15 gerçek kampüs konumu Google My Maps'ten alındı (Isparta — SDÜ / ISUBÜ).
- **Android için** `mobile/app.json` içine Google Maps API key eklenmesi gerekir.
