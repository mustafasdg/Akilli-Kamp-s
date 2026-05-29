# services/

Backend REST API çağrı katmanı (**Axios**). .NET 9 API'ye giden tek kapı.

Planlanan dosyalar:
- `apiClient.ts` — Axios instance (baseURL, JWT interceptor, hata normalize).
- `authService.ts` — `register`, `login`, `me`.
- `announcementService.ts`, `menuService.ts`, `locationService.ts`.

Bileşenler/ekranlar `fetch`/`axios`'u doğrudan kullanmaz; hep bu katmandan geçer.
