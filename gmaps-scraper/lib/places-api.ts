/**
 * Google Places API Client
 * Utilise Places API (New) Text Search pour rechercher des entreprises
 */

export interface PlaceResult {
  name: string;
  address: string;
  phone: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  placeId: string;
  mapsUrl?: string;
}

interface GooglePlaceResponse {
  places: Array<{
    id: string;
    displayName: { text: string };
    formattedAddress: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    types?: string[];
    googleMapsUri?: string;
  }>;
  nextPageToken?: string;
}

/**
 * Recherche des places avec Google Places API Text Search
 * @param referer - Referer/Origin de la requête (ex. http://localhost:3004). Envoyé à Google si ta clé a des restrictions "HTTP referrers".
 */
export async function searchPlaces(
  query: string,
  location: string,
  maxResults: number,
  referer?: string
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY manquante dans .env.local');
  }

  const ref = referer || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.types,places.location,nextPageToken',
  };
  if (ref) headers['Referer'] = ref;

  const searchQuery = `${query} ${location}`;
  const results: PlaceResult[] = [];
  let nextPageToken: string | undefined;

  // Google Places Text Search : max 20/page, 3 pages max = 60 résultats par recherche
  const target = Math.min(maxResults, 60);
  const maxPages = 3;

  for (let page = 0; page < maxPages && results.length < target; page++) {
    // Délai 2s avant d'utiliser un pageToken (requis par l'API Google)
    if (page > 0 && nextPageToken) {
      await new Promise((r) => setTimeout(r, 2000));
    }

    const url = new URL('https://places.googleapis.com/v1/places:searchText');
    const requestBody: Record<string, unknown> = {
      textQuery: searchQuery,
      languageCode: 'fr',
      pageSize: 20,
    };
    if (nextPageToken) requestBody.pageToken = nextPageToken;

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${err}`);
    }

    const data: GooglePlaceResponse = await response.json();

    for (const place of data.places ?? []) {
      if (results.length >= target) break;
      const phone = place.nationalPhoneNumber || '';
      const website = place.websiteUri || '';

      results.push({
        name: place.displayName?.text ?? '',
        address: place.formattedAddress ?? '',
        phone: phone || 'Sur site',
        website,
        rating: place.rating,
        reviewCount: place.userRatingCount,
        category: place.types?.[0] || query,
        placeId: place.id ?? '',
        mapsUrl: place.googleMapsUri || (place.id ? `https://www.google.com/maps/place/?q=place_id:${place.id}` : undefined),
      });
    }

    nextPageToken = data.nextPageToken ?? undefined;
    if (!nextPageToken) break;
  }

  return results.slice(0, target);
}

/**
 * Récupère les détails d'un place (phone, website)
 */
async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<{ phone?: string; website?: string }> {
  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set('languageCode', 'fr');
  url.searchParams.set('fields', 'nationalPhoneNumber,websiteUri');

  const response = await fetch(url.toString(), {
    headers: {
      'X-Goog-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    return {};
  }

  const data = await response.json();
  return {
    phone: data.nationalPhoneNumber || '',
    website: data.websiteUri || '',
  };
}
