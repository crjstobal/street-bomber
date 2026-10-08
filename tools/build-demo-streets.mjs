// Bakes the demo city's street network into web/demo-streets.json, so the
// hosted demo works without GPS and without depending on a public Overpass server.
//   node build-demo-streets.mjs [lat] [lon]
import fs from 'fs';

const [lat, lon] = [+(process.argv[2] ?? 40.4169), +(process.argv[3] ?? -3.7035)];
const RADIUS = 500, R = 6371000, rad = d => d * Math.PI / 180;
const dLat = (RADIUS / R) * (180 / Math.PI);
const dLon = (RADIUS / (R * Math.cos(rad(lat)))) * (180 / Math.PI);
const bbox = [lat - dLat, lon - dLon, lat + dLat, lon + dLon].map(n => n.toFixed(6)).join(',');

// Same filter as overpassQuery() in web/index.html.
const query = `[out:json][timeout:40];
(
  way["highway"]
     ["highway"!~"^(motorway|motorway_link|trunk|trunk_link|construction|proposed|raceway|bus_guideway|escape|corridor|elevator|platform)$"]
     ["area"!="yes"]
     ["access"!="private"]
     ["footway"!="sidewalk"]["footway"!="crossing"]
     ["service"!~"^(parking_aisle|driveway)$"]
     (${bbox});
);
out geom;`;

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: 'data=' + encodeURIComponent(query),
  headers: { 'Content-Type': 'application/x-www-form-urlencoded',
             'User-Agent': 'StreetBomber/0.1 (Hacktoberfest 2026 prototype)' },
});
if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
const { elements } = await res.json();
// Keep only what the game reads, to keep the file small.
const slim = elements.filter(e => e.type === 'way' && e.geometry).map(e => ({
  type: 'way',
  tags: e.tags?.name ? { name: e.tags.name } : undefined,
  geometry: e.geometry.map(g => ({ lat: +g.lat.toFixed(7), lon: +g.lon.toFixed(7) })),
}));
fs.writeFileSync(new URL('../web/demo-streets.json', import.meta.url),
  JSON.stringify({ center: [lat, lon], elements: slim }));
console.log(`wrote ${slim.length} ways`);
