/**
 * SmartRoute Geolocation & Dynamic ETA Engine
 * Implements:
 * 1. Great-Circle Haversine spherical distance calculation
 * 2. Monotonic decreasing ETA calculation with traffic crawl fallback
 */

const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates geographical distance in kilometers between two GPS coordinates
 * using the Haversine Great-Circle formula.
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
function calculateDistanceKM(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Computes dynamic decreasing ETA to destination with safety bounds.
 *
 * @param {number} currentLat Current bus latitude
 * @param {number} currentLng Current bus longitude
 * @param {number} destLat Destination latitude
 * @param {number} destLng Destination longitude
 * @param {number} speedKmph Current vehicle speed in km/h from GPS telemetry
 * @param {number} [haltMinutes=0] Additional scheduled stop duration in minutes
 * @returns {{ distanceKm: number, etaMinutes: number, etaText: string }}
 */
function calculateETA(currentLat, currentLng, destLat, destLng, speedKmph, haltMinutes = 0) {
  const distanceKm = calculateDistanceKM(currentLat, currentLng, destLat, destLng);

  // During halts, toll barriers, or traffic crawl (< 15 km/h), fallback to 40 km/h highway average
  const effectiveSpeed = speedKmph >= 15 ? speedKmph : 40.0;

  const travelMinutes = Math.round((distanceKm / effectiveSpeed) * 60);
  const totalMinutes = Math.max(1, travelMinutes + haltMinutes);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let etaText = `${minutes}m`;
  if (hours > 0) {
    etaText = `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
  }

  return {
    distanceKm: parseFloat(distanceKm.toFixed(1)),
    etaMinutes: totalMinutes,
    etaText
  };
}

module.exports = {
  calculateDistanceKM,
  calculateETA
};
