#!/usr/bin/env node
'use strict';

/**
 * Tests for scripts/hooks/session-start-bootstrap.js.
 *
 * The bootstrap resolves the ECC plugin root, then delegates to
 * scripts/hooks/run-with-flags.js. These tests drive it with a fixture plugin
 * root containing a stub runner, plus the unresolvable-root fallback path.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const bootstrapScript = path.join(
  __dirname,
  '..',
  '..',
  'scripts',
  'hooks',
  'session-start-bootstrap.js'
);

const STUB_RUNNER = `#!/usr/bin/env node
'use strict';
let data = '';
process.stdin.on('data', (chunk) => {
  data += chunk;
});
process.stdin.on('end', () => {
  const mode = process.env.STUB_MODE || 'echo';
  if (mode === 'fail') {
    process.stderr.write('stub failure\\n');
    process.exit(3);
  }
  if (mode === 'custom') {
    process.stdout.write('stub-says-hi');
    return;
  }
  process.stdout.write(data);
});
`;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

/** Creates a fixture plugin root containing a stub run-with-flags.js. */
function createFixtureRoot() {
  const root = createTempDir('session-bootstrap-root-');
  const runnerDir = path.join(root, 'scripts', 'hooks');
  fs.mkdirSync(runnerDir, { recursive: true });
  fs.writeFileSync(path.join(runnerDir, 'run-with-flags.js'), STUB_RUNNER);
  return root;
}

function runBootstrap(input, envOverrides = {}) {
  const homeDir = createTempDir('session-bootstrap-home-');
  try {
    const result = spawnSync('node', [bootstrapScript], {
      encoding: 'utf8',
      input,
      timeout: 15000,
      env: {
        ...process.env,
        HOME: homeDir,
        USERPROFILE: homeDir,
        ...envOverrides,
      },
    });
    return {
      code: result.status === null ? 1 : result.status,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
    };
  } finally {
    cleanup(homeDir);
  }
}

function runTests() {
  console.log('\n=== Testing session-start-bootstrap.js ===\n');
  let passed = 0;
  let failed = 0;
  const event = JSON.stringify({ hook_event_name: 'SessionStart' });

  if (
    test('delegates to the plugin runner and passes stdout through', () => {
      const fixtureRoot = createFixtureRoot();
      try {
        const result = runBootstrap(event, { CLAUDE_PLUGIN_ROOT: fixtureRoot });
        assert.strictEqual(result.code, 0, `expected exit 0, got ${result.code}: ${result.stderr}`);
        assert.strictEqual(result.stdout, event);
      } finally {
        cleanup(fixtureRoot);
      }
    })
  )
    passed++;
  else failed++;

  if (
    test('forwards the runner exit code on failure', () => {
      const fixtureRoot = createFixtureRoot();
      try {
        const result = runBootstrap(event, {
          CLAUDE_PLUGIN_ROOT: fixtureRoot,
          STUB_MODE: 'fail',
        });
        assert.strictEqual(result.code, 3, `expected exit 3, got ${result.code}`);
        assert.match(result.stderr, /stub failure/);
      } finally {
        cleanup(fixtureRoot);
      }
    })
  )
    passed++;
  else failed++;

  if (
    test('passes the runner custom output through instead of raw stdin', () => {
      const fixtureRoot = createFixtureRoot();
      try {
        const result = runBootstrap(event, {
          CLAUDE_PLUGIN_ROOT: fixtureRoot,
          STUB_MODE: 'custom',
        });
        assert.strictEqual(result.code, 0, `expected exit 0, got ${result.code}: ${result.stderr}`);
        assert.strictEqual(result.stdout, 'stub-says-hi');
      } finally {
        cleanup(fixtureRoot);
      }
    })
  )
    passed++;
  else failed++;

  if (
    test('warns and passes stdin through when the plugin root cannot be resolved', () => {
      const result = runBootstrap(event, {
        CLAUDE_PLUGIN_ROOT: path.join(os.tmpdir(), 'session-bootstrap-missing-root-xyz'),
      });
      assert.strictEqual(result.code, 0, `expected exit 0, got ${result.code}`);
      assert.strictEqual(result.stdout, event);
      assert.match(result.stderr, /could not resolve ECC plugin root/);
    })
  )
    passed++;
  else failed++;

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
