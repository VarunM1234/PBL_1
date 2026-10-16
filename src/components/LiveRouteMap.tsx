import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Kind = 'ORIGIN' | 'BOARDING' | 'TOLL' | 'HALT' | 'DROPPING';
interface Stop { name: string; lat: number; lng: number; f: number; kind: Kind; approx?: boolean }

// f = fraction of the trip at which the app's alerts fire for this stop (same values as RouteMiniMap)
const STOPS: Stop[] = [
  { name: 'Kashmere Gate ISBT, Delhi', lat: 28.6686894, lng: 77.2304182, f: 0.0, kind: 'ORIGIN' },
  { name: 'Dhaula Kuan Metro, Delhi', lat: 28.59187, lng: 77.16172, f: 0.05, kind: 'BOARDING' },
  { name: 'Shahjahanpur Toll Plaza', lat: 27.99978, lng: 76.430522, f: 0.33, kind: 'TOLL' },
  { name: 'Highway Food Mall (midway halt)', lat: 27.89908, lng: 76.35255, f: 0.5, kind: 'HALT', approx: true },
  { name: 'Kotputli Toll Plaza', lat: 27.7036, lng: 76.2012, f: 0.83, kind: 'TOLL', approx: true },
  { name: 'Narayan Singh Circle, Jaipur', lat: 26.89918, lng: 75.813, f: 0.985, kind: 'DROPPING' },
];

const COLORS: Record<Kind, string> = {
  ORIGIN: '#16a34a', BOARDING: '#0ea5e9', TOLL: '#f59e0b', HALT: '#8b5cf6', DROPPING: '#16a34a',
};

function positionAt(progress: number): [number, number] {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= STOPS[0].f) return [STOPS[0].lat, STOPS[0].lng];
  for (let i = 1; i < STOPS.length; i++) {
    const a = STOPS[i - 1];
    const b = STOPS[i];
    if (p <= b.f) {
      const t = (p - a.f) / (b.f - a.f);
      return [a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t];
    }
  }
  const last = STOPS[STOPS.length - 1];
  return [last.lat, last.lng];
}

export default function LiveRouteMap({ progress, height = 320 }: { progress: number; height?: number }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const busRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false });
    mapRef.current = map;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const points = STOPS.map((s) => [s.lat, s.lng] as [number, number]);
    L.polyline(points, { color: '#2563eb', weight: 4, dashArray: '6 6' }).addTo(map);
    STOPS.forEach((s) => {
      L.circleMarker([s.lat, s.lng], {
        radius: 7, color: '#ffffff', weight: 2, fillColor: COLORS[s.kind], fillOpacity: 1,
      }).addTo(map).bindTooltip(s.name + (s.approx ? ' (approx.)' : ''));
    });
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });

    busRef.current = L.circleMarker(positionAt(progress), {
      radius: 10, color: '#ffffff', weight: 3, fillColor: '#dc2626', fillOpacity: 1,
    }).addTo(map).bindTooltip('Bus', { permanent: true, direction: 'top' });

    return () => { map.remove(); mapRef.current = null; busRef.current = null; };
  }, []);

  useEffect(() => {
    busRef.current?.setLatLng(positionAt(progress));
  }, [progress]);

  return (
    <div>
      <div ref={elRef} style={{ height, width: '100%', borderRadius: 8, overflow: 'hidden' }} />
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
        Schematic route between stops (not road geometry). Bus position is simulated.
      </div>
    </div>
  );
}
