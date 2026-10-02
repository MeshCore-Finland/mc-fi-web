import outline from '../data/finland-outline.json';
// An equirectangular projection at 65°N preserves the silhouette's proportions.
const longitudeScale = Math.cos((65 * Math.PI) / 180);
const points = outline.rings.flat();
const left = Math.min(...points.map(([lon]) => lon * longitudeScale));
const right = Math.max(...points.map(([lon]) => lon * longitudeScale));
const bottom = Math.min(...points.map(([, lat]) => lat));
const top = Math.max(...points.map(([, lat]) => lat));
const scale = Math.min(310 / (right - left), 374 / (top - bottom));
const offsetX = (480 - (right - left) * scale) / 2;
const offsetY = (440 - (top - bottom) * scale) / 2;
// Frame the outline tightly, with room for the repeater halos at its edges.
const padding = 12;
export const finlandViewBox = [
  offsetX - padding,
  offsetY - padding,
  (right - left) * scale + padding * 2,
  (top - bottom) * scale + padding * 2,
].join(' ');
export function projectLocation(lat: number, lon: number) {
  return {
    x: offsetX + (lon * longitudeScale - left) * scale,
    y: offsetY + (top - lat) * scale,
  };
}
function ringPath(ring: number[][]) {
  return (
    ring
      .map(([lon, lat], index) => {
        const { x, y } = projectLocation(lat, lon);
        return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ') + ' Z'
  );
}
const ringPaths = outline.rings.map(ringPath);
export const finlandPath = ringPaths.join(' ');
// Animate only the largest land mass; SVG dashes restart on separate islands.
function ringArea(ring: number[][]) {
  return Math.abs(
    ring.reduce((area, [x, y], index) => {
      const [nextX, nextY] = ring[(index + 1) % ring.length];
      return area + x * nextY - nextX * y;
    }, 0),
  );
}
const mainlandIndex = outline.rings.reduce(
  (largest, ring, index) =>
    ringArea(ring) > ringArea(outline.rings[largest]) ? index : largest,
  0,
);
// Rotate the closed mainland ring so the runner starts nearest Helsinki.
const mainlandRing = outline.rings[mainlandIndex].slice(0, -1);
const helsinki = projectLocation(60.1699, 24.9384);
const distanceToHelsinki = ([lon, lat]: number[]) => {
  const point = projectLocation(lat, lon);
  return (point.x - helsinki.x) ** 2 + (point.y - helsinki.y) ** 2;
};
const startIndex = mainlandRing.reduce(
  (closest, point, index) =>
    distanceToHelsinki(point) < distanceToHelsinki(mainlandRing[closest])
      ? index
      : closest,
  0,
);
export const finlandMainlandPath = ringPath([
  ...mainlandRing.slice(startIndex),
  ...mainlandRing.slice(0, startIndex),
]);
