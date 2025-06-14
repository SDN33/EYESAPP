// utils/formatDistance.ts
// Formatte une distance Google Maps (ex: "2.1 mi" ou "4,2 km") en km français

export function formatDistance(text: string): string {
  if (!text) return '';
  // Si déjà en km, juste remplacer le séparateur
  if (text.includes('km')) return text.replace('.', ',').replace('km', 'km');
  // Si en miles, convertir
  const match = text.match(/([\d.,]+)\s?mi/);
  if (match) {
    const miles = parseFloat(match[1].replace(',', '.'));
    const km = miles * 1.60934;
    return km.toFixed(1).replace('.', ',') + ' km';
  }
  return text;
}
