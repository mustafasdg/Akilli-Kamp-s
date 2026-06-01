/**
 * "ahmet yılmaz" veya "AHMET YILMAZ" → "Ahmet YILMAZ"
 * İsimin baş harfi büyük geri kalanı küçük, soyisim tamamen büyük.
 */
export function formatName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name;
  if (parts.length === 1) {
    // Tek kelime: baş harf büyük, geri kalanı küçük
    const w = parts[0];
    return w.charAt(0).toLocaleUpperCase('tr') + w.slice(1).toLocaleLowerCase('tr');
  }
  // Son kelime = soyisim → tamamen büyük
  const lastName = parts[parts.length - 1].toLocaleUpperCase('tr');
  // Diğer kelimeler = isim(ler) → baş harf büyük
  const firstNames = parts.slice(0, -1).map(
    w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1).toLocaleLowerCase('tr')
  );
  return [...firstNames, lastName].join(' ');
}

/** Ad soyaddan 2 baş harf üretir: "Ahmet Yılmaz" → "AY" */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return (name[0] ?? '?').toUpperCase();
}

/** İsimden tutarlı bir renk üretir (aynı isim → hep aynı renk) */
export function stringToColor(str: string): string {
  const palette = [
    '#1D4ED8', '#0F766E', '#7C3AED', '#B45309',
    '#0369A1', '#BE185D', '#15803D', '#C2410C',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
