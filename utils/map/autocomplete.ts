// utils/map/autocomplete.ts
import { debounce } from './debounce';

/**
 * Recherche d'adresses avec Google Places Autocomplete (debounced)
 */
export function createFetchAutocomplete(setAutocompleteLoading: (b: boolean) => void, setAutocompleteError: (msg: string | null) => void, setAutocompleteResults: (results: any[]) => void) {
  return debounce(async (input: string) => {
    setAutocompleteLoading(true);
    setAutocompleteError(null);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0';
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&language=fr&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== 'OK') {
        setAutocompleteError(data.error_message || data.status || 'Erreur API');
        setAutocompleteResults([]);
      } else if (data.predictions) setAutocompleteResults(data.predictions);
      else setAutocompleteResults([]);
    } catch (e) {
      setAutocompleteError('Erreur réseau ou API');
      setAutocompleteResults([]);
    }
    setAutocompleteLoading(false);
  }, 350);
}
