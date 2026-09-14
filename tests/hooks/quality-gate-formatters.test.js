#!/usr/bin/env node
'use strict';

/**
 * Tests for the formatter-specific branches of scripts/hooks/quality-gate.js.
 *
 * Uses fixture project roots with fake formatter binaries, so no real
 * formatter needs to be installed. POSIX-only: the fake binaries are shell
 * scripts, so the whole file is skipped on Windows.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

if (process.platform === 'win32') {
  console.log('quality-gate formatter tests skipped on Windows (needs POSIX shell)');
  process.exit(0);
}

const qualityGate = require('../../scripts/hooks/quality-gate');
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

function withEnv(vars, fn) {
  const prev = {};
  for (const key of Object.keys(vars)) {
    prev[key] = process.env[key];
    if (vars[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = vars[key];
    }
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(vars)) {
      if (prev[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prev[key];
      }
    }
  }
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

/**
 * Writes a fake executable that appends its argv (one per line) to a log
 * file, optionally prints stdoutText, and exits with exitCode.
 */
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

/** Fixture project root with a package.json marker and optional formatter config. */
function makeProject(formatter) {
  const root = createTempDir('qg-format-proj-');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'qg-fixture' }));
  if (formatter === 'biome') {
    fs.writeFileSync(path.join(root, 'biome.json'), '{}');
  } else if (formatter === 'prettier') {
    fs.writeFileSync(path.join(root, '.prettierrc'), '{}');
  }
  const binDir = path.join(root, 'node_modules', '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  return { root, binDir };
}

function makeFile(root, name, content = 'x = 1\n') {
  const filePath = path.join(root, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

function runFor(filePath) {
  return qualityGate.run(JSON.stringify({ tool_input: { file_path: filePath } }));
}

function runTests() {
  console.log('\n=== Testing quality-gate.js formatter branches ===\n');
  let passed = 0;
  let failed = 0;

  const check = (name, fn) => {
    resolveFormatter.clearCaches();
    if (test(name, fn)) passed++;
    else failed++;
  };

  check('biome skips JS/TS files (handled by post-edit-format)', () => {
    const { root, binDir } = makeProject('biome');
    try {
      const { logPath } = makeFakeBin(binDir, 'biome');
      const filePath = makeFile(root, 'app.js');
      const input = JSON.stringify({ tool_input: { file_path: filePath } });
      assert.strictEqual(runFor(filePath), input);
      assert.strictEqual(readArgs(logPath), null, 'biome should not run for .js files');
    } finally {
      cleanup(root);
    }
  });

  check('biome checks JSON files', () => {
    const { root, binDir } = makeProject('biome');
    try {
      const { logPath } = makeFakeBin(binDir, 'biome');
      const filePath = makeFile(root, 'data.json', '{"a":1}\n');
      const input = JSON.stringify({ tool_input: { file_path: filePath } });
      assert.strictEqual(runFor(filePath), input);
      const args = readArgs(logPath);
      assert.ok(args, 'biome should run for .json files');
      assert.ok(args.includes('check'), `expected 'check' in args: ${args}`);
      assert.ok(args.includes(filePath), `expected file path in args: ${args}`);
      assert.ok(!args.includes('--write'), `should not pass --write by default: ${args}`);
    } finally {
      cleanup(root);
    }
  });

  check('biome appends --write when ECC_QUALITY_GATE_FIX=true', () => {
    const { root, binDir } = makeProject('biome');
    try {
      const { logPath } = makeFakeBin(binDir, 'biome');
      const filePath = makeFile(root, 'data.json', '{"a":1}\n');
      withEnv({ ECC_QUALITY_GATE_FIX: 'true' }, () => runFor(filePath));
      const args = readArgs(logPath);
      assert.ok(args && args.includes('--write'), `expected '--write' in args: ${args}`);
    } finally {
      cleanup(root);
    }
  });

  check('biome logs the failure in strict mode', () => {
    const { root, binDir } = makeProject('biome');
    try {
      makeFakeBin(binDir, 'biome', { exitCode: 1 });
      const filePath = makeFile(root, 'data.json', '{"a":1}\n');
      const stderr = captureStderr(() =>
        withEnv({ ECC_QUALITY_GATE_STRICT: 'true' }, () => runFor(filePath))
      );
      assert.match(stderr, /Biome check failed/);
    } finally {
      cleanup(root);
    }
  });

  check('prettier checks JS files with --check by default', () => {
    const { root, binDir } = makeProject('prettier');
    try {
      const { logPath } = makeFakeBin(binDir, 'prettier');
      const filePath = makeFile(root, 'app.js');
      const input = JSON.stringify({ tool_input: { file_path: filePath } });
      assert.strictEqual(runFor(filePath), input);
      const args = readArgs(logPath);
      assert.ok(args, 'prettier should run for .js files');
      assert.ok(args.includes('--check'), `expected '--check' in args: ${args}`);
      assert.ok(args.includes(filePath), `expected file path in args: ${args}`);
    } finally {
      cleanup(root);
    }
  });

  check('prettier uses --write when ECC_QUALITY_GATE_FIX=true', () => {
    const { root, binDir } = makeProject('prettier');
    try {
      const { logPath } = makeFakeBin(binDir, 'prettier');
      const filePath = makeFile(root, 'app.js');
      withEnv({ ECC_QUALITY_GATE_FIX: 'true' }, () => runFor(filePath));
      const args = readArgs(logPath);
      assert.ok(args && args.includes('--write'), `expected '--write' in args: ${args}`);
      assert.ok(!args.includes('--check'), `should not pass --check in fix mode: ${args}`);
    } finally {
      cleanup(root);
    }
  });

  check('prettier logs the failure in strict mode', () => {
    const { root, binDir } = makeProject('prettier');
    try {
      makeFakeBin(binDir, 'prettier', { exitCode: 1 });
      const filePath = makeFile(root, 'app.js');
      const stderr = captureStderr(() =>
        withEnv({ ECC_QUALITY_GATE_STRICT: 'true' }, () => runFor(filePath))
      );
      assert.match(stderr, /Prettier check failed/);
    } finally {
      cleanup(root);
    }
  });

  check('gofmt -w runs for Go files when fix is enabled', () => {
    const binDir = createTempDir('qg-gofmt-bin-');
    const projectDir = createTempDir('qg-gofmt-proj-');
    try {
      const { logPath } = makeFakeBin(binDir, 'gofmt');
      const filePath = makeFile(projectDir, 'main.go', 'package main\n');
      const input = JSON.stringify({ tool_input: { file_path: filePath } });
      withEnv(
        { ECC_QUALITY_GATE_FIX: 'true', PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
        () => assert.strictEqual(runFor(filePath), input)
      );
      const args = readArgs(logPath);
      assert.ok(args && args.includes('-w'), `expected '-w' in args: ${args}`);
      assert.ok(args.includes(filePath), `expected file path in args: ${args}`);
    } finally {
      cleanup(binDir);
      cleanup(projectDir);
    }
  });

  check('gofmt -l output is reported in strict mode', () => {
    const binDir = createTempDir('qg-gofmt-bin-');
    const projectDir = createTempDir('qg-gofmt-proj-');
    try {
      const filePath = makeFile(projectDir, 'main.go', 'package main\n');
      // Fake gofmt -l prints the file, meaning "needs formatting".
      const fake = `#!/bin/sh\nif [ "$1" = "-l" ]; then printf '%s\\n' "$2"; fi\nexit 0\n`;
      const gofmt = path.join(binDir, 'gofmt');
      fs.writeFileSync(gofmt, fake);
      fs.chmodSync(gofmt, 0o755);
      const stderr = captureStderr(() =>
        withEnv(
          { ECC_QUALITY_GATE_STRICT: 'true', PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
          () => runFor(filePath)
        )
      );
      assert.match(stderr, /gofmt check failed/);
    } finally {
      cleanup(binDir);
      cleanup(projectDir);
    }
  });

  check('gofmt hard failure is reported in strict mode', () => {
    const binDir = createTempDir('qg-gofmt-bin-');
    const projectDir = createTempDir('qg-gofmt-proj-');
    try {
      makeFakeBin(binDir, 'gofmt', { exitCode: 1 });
      const filePath = makeFile(projectDir, 'main.go', 'package main\n');
      const stderr = captureStderr(() =>
        withEnv(
          {
            ECC_QUALITY_GATE_FIX: 'true',
            ECC_QUALITY_GATE_STRICT: 'true',
            PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
          },
          () => runFor(filePath)
        )
      );
      assert.match(stderr, /gofmt failed/);
    } finally {
      cleanup(binDir);
      cleanup(projectDir);
    }
  });

  check('ruff check failure is reported in strict mode', () => {
    const binDir = createTempDir('qg-ruff-bin-');
    const projectDir = createTempDir('qg-ruff-proj-');
    try {
      const { logPath } = makeFakeBin(binDir, 'ruff', { exitCode: 1 });
      const filePath = makeFile(projectDir, 'main.py', 'x = 1\n');
      const stderr = captureStderr(() =>
        withEnv(
          { ECC_QUALITY_GATE_STRICT: 'true', PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
          () => runFor(filePath)
        )
      );
      assert.match(stderr, /Ruff check failed/);
      const args = readArgs(logPath);
      assert.ok(args && args.includes('--check'), `expected '--check' in args: ${args}`);
    } finally {
      cleanup(binDir);
      cleanup(projectDir);
    }
  });

  check('ruff format runs without --check when fix is enabled', () => {
    const binDir = createTempDir('qg-ruff-bin-');
    const projectDir = createTempDir('qg-ruff-proj-');
    try {
      const { logPath } = makeFakeBin(binDir, 'ruff');
      const filePath = makeFile(projectDir, 'main.py', 'x = 1\n');
      withEnv(
        { ECC_QUALITY_GATE_FIX: 'true', PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
        () => runFor(filePath)
      );
      const args = readArgs(logPath);
      assert.ok(args && args[0] === 'format', `expected 'format' first in args: ${args}`);
      assert.ok(!args.includes('--check'), `should not pass --check in fix mode: ${args}`);
    } finally {
      cleanup(binDir);
      cleanup(projectDir);
    }
  });

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
