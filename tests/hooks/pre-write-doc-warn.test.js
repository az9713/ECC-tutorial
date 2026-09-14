#!/usr/bin/env node
'use strict';

/**
 * Tests for scripts/hooks/pre-write-doc-warn.js.
 *
 * This file is a backward-compatible shim that simply requires
 * ./doc-file-warning.js, so these tests assert that it behaves exactly like
 * the underlying hook: exit code 0 in all cases, a stderr warning for ad-hoc
 * doc filenames, and silence for standard filenames.
 */

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const shimScript = path.join(__dirname, '..', '..', 'scripts', 'hooks', 'pre-write-doc-warn.js');
const underlyingScript = path.join(__dirname, '..', '..', 'scripts', 'hooks', 'doc-file-warning.js');

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

function runScript(script, input) {
  const result = spawnSync('node', [script], {
    encoding: 'utf8',
    input: JSON.stringify(input),
    timeout: 10000,
  });
  return {
    code: result.status === null ? 1 : result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function runTests() {
  console.log('\n=== Testing pre-write-doc-warn.js (shim) ===\n');
  let passed = 0;
  let failed = 0;

  if (
    test('warns on stderr for an ad-hoc doc filename', () => {
      const input = { tool_input: { file_path: 'NOTES.md' } };
      const result = runScript(shimScript, input);
      assert.strictEqual(result.code, 0, `expected exit code 0, got ${result.code}`);
      assert.match(result.stderr, /Ad-hoc documentation filename detected/);
      assert.match(result.stderr, /NOTES\.md/);
    })
  )
    passed++;
  else failed++;

  if (
    test('stays silent for a standard doc filename', () => {
      const input = { tool_input: { file_path: 'README.md' } };
      const result = runScript(shimScript, input);
      assert.strictEqual(result.code, 0, `expected exit code 0, got ${result.code}`);
      assert.strictEqual(result.stderr, '', `expected no warning, got: ${result.stderr}`);
    })
  )
    passed++;
  else failed++;

  if (
    test('behaves identically to doc-file-warning.js', () => {
      for (const filePath of ['NOTES.md', 'README.md', 'docs/guide/setup.md']) {
        const input = { tool_input: { file_path: filePath } };
        const shim = runScript(shimScript, input);
        const direct = runScript(underlyingScript, input);
        assert.strictEqual(shim.code, direct.code, `exit code mismatch for ${filePath}`);
        assert.strictEqual(shim.stdout, direct.stdout, `stdout mismatch for ${filePath}`);
        assert.strictEqual(shim.stderr, direct.stderr, `stderr mismatch for ${filePath}`);
      }
    })
  )
    passed++;
  else failed++;

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
