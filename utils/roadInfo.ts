// utils/roadInfo.ts

// API gratuite pour l'adresse : Nominatim (OpenStreetMap)
export async function getAddressFromCoords(lat: number, lon: number) {
  let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  // Utilise un proxy CORS uniquement sur web
  if (typeof window !== "undefined") {
    url = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }
  let headers: Record<string, string> = { 'Accept-Language': 'fr' };
  if (typeof window !== "undefined") {
    headers['User-Agent'] = 'MotoAngles/1.0';
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Erreur Nominatim');
    const data = await res.json();
    return data.address;
  } catch {
    return null;
  }
}

// API gratuite pour la limitation de vitesse : Overpass (OpenStreetMap)
export async function getSpeedLimitFromCoords(lat: number, lon: number) {
  const query = `
    [out:json];
    way(around:20,${lat},${lon})["highway"]["maxspeed"];
    out tags center 1;
  `;
  const url = "https://overpass-api.de/api/interpreter";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Erreur Overpass');
    const data = await res.json();
    if (data.elements && data.elements.length > 0) {
      return data.elements[0].tags.maxspeed;
    }
    return null;
  } catch {
    return null;
  }
}
