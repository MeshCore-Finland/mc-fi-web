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
export function projectLocation(lat: number, lon: number) {
  return {
    x: offsetX + (lon * longitudeScale - left) * scale,
    y: offsetY + (top - lat) * scale,
  };
}
export const finlandPath = outline.rings
  .map(
    (ring) =>
      ring
        .map(([lon, lat], index) => {
          const { x, y } = projectLocation(lat, lon);
          return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ') + ' Z',
  )
  .join(' ');
