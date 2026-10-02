/** Accent-insensitive, case-insensitive AND matching across the complete Q&A. */
export function normalize(value) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}
export function filterFaq(records, query) {
  const terms = normalize(query).split(' ').filter(Boolean);
  return records.map(({ question, answer }) => {
    const text = normalize(question + ' ' + answer);
    return terms.every(term => text.includes(term));
  });
}
export function excerptFor(answer, query, length = 150) {
  const clean = answer.replace(/\s+/g, ' ').trim();
  const terms = normalize(query).split(' ').filter(Boolean);
  // Build an index map so decomposed Unicode does not shift the excerpt offset.
  const chars = [...clean];
  let text = ''; const positions = [];
  chars.forEach((char, index) => {
    const normalized = normalize(char);
    for (const c of normalized) { text += c; positions.push(index); }
    if (/\s/.test(char)) { text += ' '; positions.push(index); }
  });
  const hits = terms.map(term => text.indexOf(term)).filter(index => index >= 0);
  if (!hits.length) return '';
  const start = Math.max(0, positions[Math.min(...hits)] - 35);
  const snippet = chars.slice(start, start + length).join('');
  return (start ? '…' : '') + snippet + (start + length < chars.length ? '…' : '');
}
