import test from 'node:test';
import assert from 'node:assert/strict';
import { filterFaq, excerptFor } from '../src/lib/faq-search.mjs';
const records = [
  { question: 'Miksi kontakteja ei näy?', answer: 'Toistimet lähettävät ADVERT-paketteja.' },
  { question: 'Voinko lisätä toistimen?', answer: 'Yhteisö rakentaa verkkoa Seinäjoella.' },
];
test('answers are searchable, including case and Finnish accents', () => {
  assert.deepEqual(filterFaq(records, 'ADVERT'), [true, false]);
  assert.deepEqual(filterFaq(records, 'seinajoella'), [false, true]);
});
test('multiple terms can match across question and answer', () => {
  assert.deepEqual(filterFaq(records, 'kontakteja ADVERT'), [true, false]);
  assert.deepEqual(filterFaq(records, 'kontakteja seinajoella'), [false, false]);
});
test('blank input restores all questions and unmatched input returns none', () => {
  assert.deepEqual(filterFaq(records, '   '), [true, true]);
  assert.deepEqual(filterFaq(records, 'unfindable'), [false, false]);
});
test('excerpt finds answer text without generating HTML', () => {
  assert.match(excerptFor('Radio <script>example</script> Seinäjoki', 'seinajoki'), /Seinäjoki/);
  assert.equal(excerptFor('No match here', 'contacts'), '');
});
