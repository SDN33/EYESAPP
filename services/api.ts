/**
 * Récupère la météo locale (température, icône, description) via Open-Meteo API.
 * @param lat Latitude
 * @param lon Longitude
 * @returns { temperature: number, icon: string, description: string } | null
 */
export async function getWeatherFromCoords(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=weathercode`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur météo');
    const data = await res.json();
    if (!data.current_weather) return null;
    // Mapping simple code météo -> icône/description
    const code = data.current_weather.weathercode;
    const temp = data.current_weather.temperature;
    const mapping: Record<number, { icon: string, description: string }> = {
      0: { icon: 'wb-sunny', description: 'Ensoleillé' },
      1: { icon: 'wb-sunny', description: 'Principalement clair' },
      2: { icon: 'wb-cloudy', description: 'Partiellement nuageux' },
      3: { icon: 'cloud', description: 'Couvert' },
      45: { icon: 'fog', description: 'Brouillard' },
      48: { icon: 'fog', description: 'Brouillard givrant' },
      51: { icon: 'grain', description: 'Bruine légère' },
      53: { icon: 'grain', description: 'Bruine modérée' },
      55: { icon: 'grain', description: 'Bruine dense' },
      61: { icon: 'umbrella', description: 'Pluie faible' },
      63: { icon: 'umbrella', description: 'Pluie modérée' },
      65: { icon: 'umbrella', description: 'Pluie forte' },
      71: { icon: 'ac-unit', description: 'Neige faible' },
      73: { icon: 'ac-unit', description: 'Neige modérée' },
      75: { icon: 'ac-unit', description: 'Neige forte' },
      80: { icon: 'grain', description: 'Averses faibles' },
      81: { icon: 'grain', description: 'Averses modérées' },
      82: { icon: 'grain', description: 'Averses fortes' },
      // ...autres codes si besoin
    };
    const meteo = mapping[code] || { icon: 'help-outline', description: 'Inconnu' };
    return { temperature: temp, icon: meteo.icon, description: meteo.description };
  } catch {
    return null;
  }
}