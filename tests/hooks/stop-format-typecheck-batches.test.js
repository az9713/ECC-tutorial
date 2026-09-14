#!/usr/bin/env node
'use strict';

/**
 * Tests for the batch-execution branches of scripts/hooks/stop-format-typecheck.js
 * (formatBatch and typecheckBatch), using fixture project roots with fake
 * formatter binaries. POSIX-only: the fake binaries are shell scripts.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

if (process.platform === 'win32') {
  console.log('stop-format-typecheck batch tests skipped on Windows (needs POSIX shell)');
  process.exit(0);
}

const stopFormat = require('../../scripts/hooks/stop-format-typecheck');
const resolveFormatter = require('../../scripts/lib/resolve-formatter');

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

function withSessionId(sessionId, fn) {
  const prev = process.env.CLAUDE_SESSION_ID;
  process.env.CLAUDE_SESSION_ID = sessionId;
  try {
    return fn();
  } finally {
    if (prev === undefined) {
      delete process.env.CLAUDE_SESSION_ID;
    } else {
      process.env.CLAUDE_SESSION_ID = prev;
    }
  }
}

function accumFileFor(sessionId) {
  return path.join(os.tmpdir(), `ecc-edited-${sessionId}.txt`);
}

function writeAccumulator(sessionId, filePaths) {
  fs.writeFileSync(accumFileFor(sessionId), `${filePaths.join('\n')}\n`);
}

function makeFakeBin(dir, name, { exitCode = 0, stdoutText = '' } = {}) {
  const binPath = path.join(dir, name);
  const logPath = path.join(dir, `${name}.args.log`);
  const script =
    '#!/bin/sh\n' +
    `printf '%s\\n' "$@" >> ${JSON.stringify(logPath)}\n` +
    `printf '%s' ${JSON.stringify(stdoutText)}\n` +
    `exit ${exitCode}\n`;
  fs.writeFileSync(binPath, script);
  fs.chmodSync(binPath, 0o755);
  return { binPath, logPath };
}

function readArgs(logPath) {
  if (!fs.existsSync(logPath)) return null;
  return fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
}

function captureStderr(fn) {
  const chunks = [];
  const original = process.stderr.write;
  process.stderr.write = chunk => {
    chunks.push(String(chunk));
    return true;
  };
  try {
    fn();
  } finally {
    process.stderr.write = original;
  }
  return chunks.join('');
}

function makeProject({ biome = false, tsconfig = false } = {}) {
  const root = createTempDir('sft-proj-');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'sft-fixture' }));
  if (biome) {
    fs.writeFileSync(path.join(root, 'biome.json'), '{}');
    const binDir = path.join(root, 'node_modules', '.bin');
    fs.mkdirSync(binDir, { recursive: true });
  }
  if (tsconfig) {
    fs.writeFileSync(
      path.join(root, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { strict: true } })
    );
  }
  return root;
}

function runTests() {
  console.log('\n=== Testing stop-format-typecheck.js batch execution ===\n');
  let passed = 0;
  let failed = 0;

  const check = (name, fn) => {
    resolveFormatter.clearCaches();
    if (test(name, fn)) passed++;
    else failed++;
  };

  check('formatBatch runs biome check --write on accumulated files', () => {
    const root = makeProject({ biome: true });
    try {
      const binDir = path.join(root, 'node_modules', '.bin');
      const { logPath } = makeFakeBin(binDir, 'biome');
      const filePath = path.join(root, 'app.js');
      fs.writeFileSync(filePath, 'const x = 1;\n');
      const sessionId = `sft-format-${Date.now()}`;
      withSessionId(sessionId, () => {
        writeAccumulator(sessionId, [filePath]);
        const result = stopFormat.run('{}');
        assert.strictEqual(result, '{}');
      });
      const args = readArgs(logPath);
      assert.ok(args, 'biome should have been invoked');
      assert.deepStrictEqual(args.slice(0, 2), ['check', '--write']);
      assert.ok(args.includes(filePath), `expected file path in args: ${args}`);
      assert.ok(!fs.existsSync(accumFileFor(sessionId)), 'accumulator should be cleared');
    } finally {
      cleanup(root);
    }
  });

  check('typecheckBatch reports tsc errors for the edited files', () => {
    const root = makeProject({ tsconfig: true });
    const binDir = createTempDir('sft-npx-bin-');
    try {
      const filePath = path.join(root, 'app.ts');
      fs.writeFileSync(filePath, 'const x: string = 1;\n');
      // Fake npx that fails like tsc with an error mentioning the edited file.
      const npxPath = path.join(binDir, 'npx');
      fs.writeFileSync(
        npxPath,
        `#!/bin/sh\nprintf '%s\\n' ${JSON.stringify(`${filePath}(1,1): error TS2322: fake type error`)}\nexit 1\n`
      );
      fs.chmodSync(npxPath, 0o755);
      const sessionId = `sft-typecheck-${Date.now()}`;
      const prevPath = process.env.PATH;
      process.env.PATH = `${binDir}${path.delimiter}${prevPath}`;
      try {
        const stderr = captureStderr(() =>
          withSessionId(sessionId, () => {
            writeAccumulator(sessionId, [filePath]);
            const result = stopFormat.run('{}');
            assert.strictEqual(result, '{}');
          })
        );
        assert.match(stderr, /TypeScript errors in app\.ts/);
        assert.match(stderr, /fake type error/);
      } finally {
        process.env.PATH = prevPath;
      }
    } finally {
      cleanup(root);
      cleanup(binDir);
    }
  });

  check('typecheck is skipped when no tsconfig exists', () => {
    const root = makeProject();
    try {
      const filePath = path.join(root, 'app.ts');
      fs.writeFileSync(filePath, 'const x: string = 1;\n');
      const sessionId = `sft-notsconfig-${Date.now()}`;
      const stderr = captureStderr(() =>
        withSessionId(sessionId, () => {
          writeAccumulator(sessionId, [filePath]);
          const result = stopFormat.run('{}');
          assert.strictEqual(result, '{}');
        })
      );
      assert.strictEqual(stderr, '', `expected no output, got: ${stderr}`);
    } finally {
      cleanup(root);
    }
  });

  check('run is a no-op when the accumulator file is missing', () => {
    const sessionId = `sft-missing-${Date.now()}`;
    const stderr = captureStderr(() =>
      withSessionId(sessionId, () => {
        assert.strictEqual(stopFormat.run('{}'), '{}');
      })
    );
    assert.strictEqual(stderr, '', `expected no output, got: ${stderr}`);
  });

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
