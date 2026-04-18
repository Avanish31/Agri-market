// We use native fetch (Node 18+)

async function geocode(address) {
    if (!address) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'AgriMarket-DevApp/1.0' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
    } catch (e) {
        console.error("Geocoding failed for address:", address, e.message);
    }
    return null;
}

module.exports = geocode;
