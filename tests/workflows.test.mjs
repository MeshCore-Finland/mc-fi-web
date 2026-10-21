import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';

const workflow = (name) =>
  parse(
    readFileSync(
      new URL(`../.github/workflows/${name}.yml`, import.meta.url),
      'utf8',
    ),
  );

test('PR validation covers every target, including temporary integration branches', () => {
  const checks = workflow('check');
  const event = checks.on.pull_request;
  for (const filter of [
    'branches',
    'branches-ignore',
    'paths',
    'paths-ignore',
  ]) {
    assert.equal(
      event[filter],
      undefined,
      `${filter} must not exclude PR validation`,
    );
  }
  for (const action of ['opened', 'synchronize', 'reopened', 'edited']) {
    assert.ok(
      event.types.includes(action),
      `${action} must trigger PR validation`,
    );
  }
  assert.ok(checks.jobs.build);
  assert.equal(
    checks.jobs.build.if,
    undefined,
    'PR edits must not skip required validation',
  );
  assert.equal(checks.jobs.links.needs, 'build');
  assert.equal(checks.jobs['external-links'].needs, 'build');
});

test('separate push builds run only on the production trunk', () => {
  assert.deepEqual(workflow('push-build').on.push.branches, ['main']);
});
