# 🎓 ISUBÜ Akıllı Kampüs

> Isparta Uygulamalı Bilimler Üniversitesi öğrenci ve akademisyenlerinin günlük kampüs hayatını tek bir uygulamada toplayan, **yapay zeka destekli** akıllı kampüs platformu.

Sistem üç bağımsız servisten oluşur:

| Servis | Teknoloji | Port | Görevi |
|--------|-----------|------|--------|
| 🟦 **Backend API** | .NET 9 REST API | `5206` | İş mantığı, kimlik doğrulama, veritabanı, SignalR |
| 🟩 **AI Servisi** | Python · FastAPI · LangGraph | `8000` | Tool-Calling yapan Kampüs AI Asistanı |
| 🟨 **Mobil İstemci** | React Native · Expo · TypeScript | Expo | Kullanıcı arayüzü |

---

## 1. 🏛️ Mimari ve Teknolojik Altyapı

### 🟦 Backend — .NET 9 REST API
- **Onion Architecture** üzerine kuruludur. Bağımlılıklar daima içe doğru akar:
  `WebAPI` ➜ `Application` ➜ `Domain`, altyapı detayları (`Infrastructure`) en dışta yer alır.
  ```
  Core/
  ├── SmartCampus.Domain/        → Entity'ler, iş kuralları (hiçbir şeye bağımlı değil)
  └── SmartCampus.Application/   → Servisler, DTO'lar, arayüzler, CQRS handler'ları
  Infrastructure/
  └── SmartCampus.Infrastructure/→ EF Core DbContext, repository'ler, seeding, migration'lar
  WebAPI/
  └── SmartCampus.Api/           → Controller'lar, Program.cs, SignalR Hub'ları
  ```
- **CQRS deseni** — okuma/yazma akışları MediatR handler'ları ile ayrıştırılır (`AddApplicationServices`).
- **EF Core** ile ORM; **JWT Bearer** ile token tabanlı kimlik doğrulama.

### 📡 Real-Time İletişim — SignalR Hub
- Topluluk sohbetleri için kesintisiz **WebSocket (SignalR)** tüneli (`/hubs/community`) kuruludur.
- WebSocket bağlantıları HTTP header taşıyamadığından, JWT güvenlik amacıyla **query-string** üzerinden okunur:
  ```
  wss://<host>:5206/hubs/community?access_token=<JWT>
  ```
  Backend yalnızca `/hubs` ile başlayan yollarda bu `access_token` parametresini doğrular.

### 🟨 Frontend — React Native & Expo
- Tam **TypeScript** tip güvenliği. Sürdürülebilir, katmanlı `src/` klasör mimarisi:
  ```
  mobile/src/
  ├── components/   → Tekrar kullanılabilir UI parçaları (UserAvatar, kartlar…)
  ├── screens/      → Ekranlar (Home, Academics, AiAssistant, CommunityChat…)
  ├── hooks/        → Veri çekme & iş mantığı hook'ları (useTeachers, useHomeData…)
  ├── services/     → API istemcileri (apiClient.ts, aiClient.ts, authService.ts)
  ├── context/      → Global state (AuthContext, ThemeContext)
  └── utils/        → Yardımcılar (avatarUtils, constants…)
  ```

### ⚙️ Otonom Migration & Seeding
- Proje **ilk kez** ayağa kalkarken, `Program.cs` içindeki `context.Database.Migrate()` çağrısı veritabanı şemasını otomatik kurar — elle `dotnet ef database update` çalıştırmaya gerek yoktur.
- Hemen ardından **Data Seeding** devreye girer: sahte kayıtları temizleyip gerçek ISUBÜ kadrosunu, ders programlarını, duyuruları, yemekhane menülerini ve toplulukları otomatik tohumlar.
  ```
  Migrate()  →  SeedTeachersAsync()  →  DbInitializer.Initialize()  →  SeedCommunitiesAsync()
  ```

---

## 2. 🤖 Yapay Zeka (AI Agent) Özellikleri ve Araçları

Kampüs AI Asistanı, gücünü **Groq** altyapısından ve **`llama-3.3-70b-versatile`** modelinden alır. **LangChain / LangGraph** ile inşa edilmiş bir `StateGraph` ajanıdır ve **RAG (Retrieval-Augmented Generation)** yaklaşımıyla, .NET backend'in gerçek verilerini çağırarak yanıt üretir — yani uydurmaz, **canlı kampüs verisinden** konuşur.

```
Kullanıcı mesajı ─▶ FastAPI /chat ─▶ LangGraph Ajanı  ⇄  Tools  ──▶  .NET Backend (:5206)
                                          (chatbot ⇄ araç çağrısı döngüsü)
```

### 🧰 Tool-Calling (Araç Çağırma) Yetenekleri

| Araç | Ne yapar? |
|------|-----------|
| 📅 **Dinamik Randevu & Takvim Aracı** | Konuşma içinden hocanın haftalık takvimini sorgular, boş/dolu saatleri analiz eder ve **doğrudan veritabanına randevu oluşturur.** Kullanıcı kimliğini `session_id` → `InjectedState` ile güvenle alır (LLM bu kimliği asla görmez/üretmez). |
| 🎓 **Akademisyen Uzmanlık & Rehber Aracı** | Hocaların **uzmanlık alanlarını, biyografilerini ve oda numaralarını** tarayarak "yapay zeka alanında kim var?" gibi sorulara nokta atışı yanıt verir. |
| 🍽️ **Yemekhane & Duyuru Bilgi Sistemi** | Günlük yemek menüsü ve güncel kampüs duyurularını doğal dille sunar. |

Ajan, **aynı `session_id`** ile gelen ardışık mesajlarda konuşmayı hatırlar (LangGraph `MemorySaver` checkpointer); farklı oturumlar birbirinden tamamen izoledir.

---

## 3. 🚀 Projeyi Çalıştırma Kılavuzu

### ✅ Ön Gereksinimler
- **.NET 9 SDK**
- **Node.js v18+** (mobil istemci için)
- **Python 3.11+** (AI asistanını test edecekseniz)
- `ai_service/` dizininde geçerli bir **`GROQ_API_KEY`** içeren `.env` dosyası
  > `ai_service/.env.example` dosyasını `.env` olarak kopyalayıp `GROQ_API_KEY` değerini girin. Ücretsiz anahtar: <https://console.groq.com>

> 💡 **Üç terminal mantığı:** Backend + Mobil çekirdek deneyim için yeterlidir. **AI Asistanı** özelliğini test etmek için ayrıca AI Servisi terminalini de çalıştırın. AI servisi kapalıyken uygulamanın geri kalanı sorunsuz çalışır, yalnızca asistan yanıt vermez.

---

### 🟦 Terminal 1 — Backend API
```bash
cd WebAPI/SmartCampus.Api
dotnet run --launch-profile http
```
- API **`http://0.0.0.0:5206`** adresinde ayağa kalkar.
- ⚙️ Açılışta seeding mekanizması **eski verileri temizler**, gerçek akademik kadroyu + ders programlarını yükler ve veritabanı şemasını otomatik kurar.
- Swagger arayüzü: <http://localhost:5206/swagger>

---

### 🟩 Terminal 2 — AI Servisi *(AI Asistanı için)*
```bash
cd ai_service

# 1) Sanal ortam
python -m venv .venv
.venv\Scripts\activate          # Windows (PowerShell/CMD)
# source .venv/bin/activate     # macOS / Linux

# 2) Bağımlılıklar
pip install -r requirements.txt

# 3) Ortam değişkenleri
copy .env.example .env          # Windows  (cp .env.example .env → Unix)
#    → .env içine GROQ_API_KEY değerinizi yazın

# 4) Çalıştır  (--host 0.0.0.0 ŞART: telefon/emülatör LAN IP'sinden erişir)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- FastAPI **`http://0.0.0.0:8000`** adresinde başlar · API dokümanı: <http://localhost:8000/docs>
- Sağlık kontrolü: `curl http://localhost:8000/health` → `{"status":"ok"}`
- ⚠️ Backend (Terminal 1) **çalışıyor** olmalı; ajan verileri ondan çeker.

---

### 🟨 Terminal 3 — Mobil Ön Yüz
```bash
cd mobile
npm install
npx expo start
```

> ⚠️ **EN KRİTİK ADIM — API_HOST ayarı:** Fiziksel cihazla test ediyorsanız
> [`mobile/src/services/apiClient.ts`](mobile/src/services/apiClient.ts) içindeki **`API_HOST`** değerini bilgisayarınızın **güncel LAN IP'si** yapın.
> Aynı `API_HOST`, AI servisine de `:8000` portuyla bağlanmak için kullanılır (tek kaynak).
> ```ts
> // Windows → cmd → ipconfig → "IPv4 Adresi"
> export const API_HOST = '192.168.1.XX';
> ```
> Emülatör için: Android `10.0.2.2`, iOS `localhost`.

- Bilgisayar ve telefon **aynı Wi-Fi / hotspot** ağında olmalı.
- Terminaldeki **QR kodu** Expo Go ile tarayın **veya** emülatör için `a` (Android) / `i` (iOS) tuşuna basın.

---

## 4. 🔑 Test Kullanıcı Giriş Bilgileri

> **Ortak şifre (tüm hesaplar): `123456`**

### 👤 Çekirdek Hesaplar
| Rol | E-posta | Test senaryosu |
|-----|---------|----------------|
| 🛡️ **Yönetici** | `admin@gmail.com` | Birleştirilmiş Kontrol Merkezi, FAB (+) butonu, duyuru/topluluk CRUD |
| 🎒 **Öğrenci** | `student@gmail.com` | Topluluklar, SignalR canlı sohbet, AI asistan |

### 👨‍🏫 Gerçek Akademik Kadro
*(Giriş yapıp randevu ve ders programı simülasyonunu test etmek için)*

| E-posta | Uzmanlık / Görev | Oda |
|---------|------------------|-----|
| `tuncayaydogan@gmail.com` | Bölüm Başkanı — Veri Yapıları & Algoritmalar | 401 |
| `ahmetsuzen@gmail.com` | Siber Güvenlik ve Bilgisayar Ağları | 405 |
| `sinanuguz@gmail.com` | Yapay Zeka Anabilim Dalı Başkanı | 410 |
| `serapbakioglu@gmail.com` | İleri Algoritma Analizi & Otomata | 412 |
| `kiyaskayaalp@gmail.com` | Sayısal Sistem Tasarımı & Donanım | 415 |
| `burhanduman@gmail.com` | Bilgisayar Mimarisi & Lojik Devre | 420 |
| `cevriyealtintas@gmail.com` | Web Programlama & Frontend UI/UX | 422 |
| `serdarpacaci@gmail.com` | Yazılım Mühendisliği & Backend Mimari | 425 |
| `rafetgozbasi@gmail.com` | **Arş. Gör.** — Derse girmez; Staj İşlemleri & Öğrenci Görüşmeleri | 430 |
| `huseyinzengin@gmail.com` | **Arş. Gör.** — Derse girmez; Laboratuvar & Staj Koordinasyonu | 431 |

---

## 5. ✨ Cilalanmış UI/UX ve Ayırt Edici Özellikler

### 🎛️ Birleştirilmiş Kontrol Merkezi
Admin için **Duyurular** ve **Topluluklar** sekmelerini tek ekranda toplar. Aktif sekmeye göre akıllıca yönlendiren bir **Floating Action Button (+)** ve her iki varlık için de tam **CRUD** altyapısı sunar.

### 💬 WhatsApp Tarzı Real-Time Sohbet
- **Inverted FlatList** optimizasyonu ile akıcı, alttan yukarı mesaj akışı.
- `skipNegotiation` ile doğrudan **WebSocket** bağlantısı.
- Her kullanıcıya **sabit renkli isim etiketi** (aynı isim → hep aynı renk).

### 🏷️ Akıllı Unvan Ayıklama Maskesi
Profil fotoğrafı olmayan hocalarda `UserAvatar` bileşeni, akademik unvanları (**Prof. Dr., Doç. Dr., Dr. Öğr. Üyesi, Arş. Gör.** …) ayıklar ve placeholder'ı **gerçek isim-soyisim baş harflerinden** üretir:

| İsim | Üretilen avatar |
|------|:---:|
| Prof. Dr. Tuncay AYDOĞAN | **TA** |
| Doç. Dr. Ahmet Ali SÜZEN | **AS** |
| Dr. Öğr. Üyesi Burhan DUMAN | **BD** |
| Arş. Gör. Rafet GÖZBAŞI | **RG** |

### 🗓️ Gelecek Odaklı Etkinlik Vitrini
Ana sayfadaki "Yaklaşan Etkinlikler" vitrininin boş kalmaması için **ileri tarihli, gerçekçi veri** tohumlanır (ör. *15 Temmuz Şehitleri Anma Günü* etkinliği) — değerlendirici uygulamayı ilk açtığında dolu ve canlı bir ekranla karşılaşır.

---

## 🗂️ Hızlı Referans

| | |
|---|---|
| Backend portu | `5206` |
| AI servis portu | `8000` |
| Mobil API ayarı | [`mobile/src/services/apiClient.ts`](mobile/src/services/apiClient.ts) → `API_HOST` |
| AI ortam değişkenleri | `ai_service/.env` (`GROQ_API_KEY`, `BACKEND_BASE_URL`) |
| SignalR Hub | `/hubs/community` (`?access_token=<JWT>`) |
| Veritabanı | İlk açılışta otomatik migrate + seed |
| Ortak test şifresi | `123456` |

> 📁 Not: Kök dizindeki `backend/` klasörü **eski (legacy) Node.js + Prisma** denemesidir ve **aktif olarak kullanılmaz**. Güncel backend `WebAPI/SmartCampus.Api`'dir.
