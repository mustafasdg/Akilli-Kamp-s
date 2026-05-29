# context/

Global state yönetimi (React Context). JWT/Auth ve tema burada yaşar.

Planlanan provider'lar:
- `AuthContext.tsx` — token saklama (AsyncStorage), login/logout, kullanıcı.
- `ThemeContext.tsx` — sistem/açık/koyu mod (dark mode desteği).

İhtiyaç büyürse Zustand/Redux'a buradan geçeriz; şimdilik Context yeterli.
