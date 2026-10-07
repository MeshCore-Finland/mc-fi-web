/** @param {unknown} value */
export function normalizeNodeId(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{6}$/i.test(value)) return null;
  return value.toUpperCase();
}
