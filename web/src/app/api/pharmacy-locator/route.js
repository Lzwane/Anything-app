export async function GET(request) {
  try {
    const url = new URL(request.url);
    const latitude = url.searchParams.get("latitude");
    const longitude = url.searchParams.get("longitude");
    const radius = url.searchParams.get("radius") || 5000; // 5km default

    if (!latitude || !longitude) {
      return Response.json(
        { error: "Latitude and longitude required" },
        { status: 400 },
      );
    }

    // Use Google Places API to find nearby pharmacies
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${latitude},${longitude}&` +
        `radius=${radius}&` +
        `type=pharmacy&` +
        `key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
    );

    if (!placesResponse.ok) {
      throw new Error("Failed to fetch nearby pharmacies");
    }

    const placesData = await placesResponse.json();

    // Process and enhance pharmacy data
    const pharmacies = placesData.results.map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      location: place.geometry.location,
      photos:
        place.photos?.map((photo) => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
        })) || [],
      open_now: place.opening_hours?.open_now,
      types: place.types,
      price_level: place.price_level,
      distance_km: calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        place.geometry.location.lat,
        place.geometry.location.lng,
      ).toFixed(2),
    }));

    // Sort by distance
    pharmacies.sort(
      (a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km),
    );

    return Response.json({
      pharmacies,
      search_location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      total_found: pharmacies.length,
    });
  } catch (error) {
    console.error("Pharmacy locator error:", error);
    return Response.json(
      {
        error: "Failed to find pharmacies",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { place_id } = body;

    if (!place_id) {
      return Response.json({ error: "place_id required" }, { status: 400 });
    }

    // Get detailed pharmacy information
    const detailsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${place_id}&` +
        `fields=name,formatted_address,formatted_phone_number,opening_hours,website,photos&` +
        `key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
    );

    if (!detailsResponse.ok) {
      throw new Error("Failed to fetch pharmacy details");
    }

    const detailsData = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      throw new Error(`Places API error: ${detailsData.status}`);
    }

    const pharmacy = detailsData.result;

    return Response.json({
      pharmacy: {
        id: place_id,
        name: pharmacy.name,
        address: pharmacy.formatted_address,
        phone: pharmacy.formatted_phone_number,
        website: pharmacy.website,
        opening_hours: pharmacy.opening_hours,
        photos:
          pharmacy.photos?.map((photo) => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
          })) || [],
      },
    });
  } catch (error) {
    console.error("Pharmacy details error:", error);
    return Response.json(
      {
        error: "Failed to get pharmacy details",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
