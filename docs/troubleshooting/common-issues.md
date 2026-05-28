# Common issues

Ordered by frequency. Find your symptom, apply the fix.

---

## I accidentally stacked install methods and things are broken

**Cause:** You ran `/plugin install ecc@ecc` and then `./install.sh --profile full` (or `npx ecc-install --profile full`). The full installer duplicates skills and hooks that the plugin already loaded.

**Fix:**

1. Remove the Claude Code plugin install (from Claude Code settings).
2. Run the ECC uninstall from the repo root:

```bash
node scripts/uninstall.js --dry-run   # preview
node scripts/uninstall.js             # apply
```

3. Delete any rule folders you copied manually:

```bash
# macOS / Linux
rm -rf ~/.claude/rules/ecc

# Windows PowerShell
Remove-Item -Recurse -Force "$HOME/.claude/rules/ecc"
```

4. Reinstall once using a single path. Plugin path is recommended for most users.

---

## I see "Duplicate hooks file detected" errors

**Cause:** A `"hooks"` field was declared in `.claude-plugin/plugin.json`. Claude Code v2.1+ auto-loads `hooks/hooks.json` from installed plugins — explicitly declaring it causes duplicate detection.

**Fix:**

If you are a user (not a contributor): update ECC to the latest version. This issue was fixed in the plugin manifests.

If you are a contributor: remove the `"hooks"` field from `.claude-plugin/plugin.json`. This is enforced by a regression test.

---

## Hooks aren't running

**Cause (plugin install):** The plugin wasn't fully loaded, or Claude Code version is below v2.1.

**Fix:**

1. Check your Claude Code version:

```bash
claude --version
```

Must be v2.1.0 or later. Update Claude Code if older.

2. Verify the plugin is installed:

```
/plugin list ecc@ecc
```

3. Restart Claude Code completely (not just a new session — fully quit and reopen).

**Cause (manual install):** Hooks weren't installed via the hooks-runtime installer — they were copied raw, which doesn't rewrite command paths.

**Fix:**

```bash
# macOS / Linux
bash ./install.sh --target claude --modules hooks-runtime

# Windows PowerShell
pwsh -File .\install.ps1 --target claude --modules hooks-runtime
```

Check the installation:

```bash
node scripts/ecc.js doctor
```

---

## Context window is shrinking — Claude runs out of context early

**Cause:** Too many MCP servers enabled. Each server adds tool descriptions to your context window, consuming 30–50% of available tokens before the conversation starts.

**Fix:**

1. Run `/mcp` inside Claude Code to see active servers.
2. Disable servers you don't use — Claude Code persists these in `~/.claude.json`.
3. Stay under 10 MCP servers and 80 active tools.

Also reduce SessionStart injection if it's large:

```bash
export ECC_SESSION_START_MAX_CHARS=4000
```

Or disable entirely for minimal setups:

```bash
export ECC_SESSION_START_CONTEXT=off
```

---

## Memory persistence isn't working — agent doesn't remember previous context

**Cause A:** Continuous learning hooks are disabled or not installed.

**Fix:** Check if the observe hook is active:

```bash
grep -r "pre:observe" ~/.claude/settings.json
node scripts/ecc.js list-installed
```

If hooks aren't installed, install the hooks-runtime module (see above).

**Cause B:** Corrupted or missing observations file.

**Fix:**

```bash
# Find your project hash
ls ~/.claude/homunculus/projects/

# Check recent observations
tail -20 ~/.claude/homunculus/projects/<project-hash>/observations.jsonl

# If the file is missing or corrupted, back it up and recreate
mv ~/.claude/homunculus/projects/<project-hash>/observations.jsonl \
   ~/.claude/homunculus/projects/<project-hash>/observations.jsonl.bak.$(date +%Y%m%d)
```

---

## Rules aren't applying

**Cause A:** Rules are in the wrong directory.

**Fix:** Rules must be in `~/.claude/rules/ecc/` (with the `ecc/` namespace). Check:

```bash
ls ~/.claude/rules/ecc/
# Should show: common/  typescript/  (etc.)
```

If the directory doesn't exist or is empty, re-run the copy commands:

```bash
mkdir -p ~/.claude/rules/ecc
cp -r /path/to/ECC/rules/common ~/.claude/rules/ecc/
```

**Cause B:** Language rules overwrote common rules (directory flattened).

**Fix:** You copied `rules/common/*` instead of `rules/common`. Delete and redo:

```bash
rm -rf ~/.claude/rules/ecc
mkdir -p ~/.claude/rules/ecc
cp -r rules/common ~/.claude/rules/ecc/
cp -r rules/typescript ~/.claude/rules/ecc/
```

**Cause C:** Rules loaded but session not restarted.

**Fix:** Rules load at session start. Start a new Claude Code session.

---

## `/plugin install ecc@ecc` fails to resolve

**Cause:** Your Claude Code build has trouble resolving the self-hosted marketplace entry.

**Fix:** Use the manual install path instead:

```bash
git clone https://github.com/affaan-m/ECC.git
cd ECC
npm install
./install.sh --profile core
```

Or add the plugin directly to `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "ecc": {
      "source": {
        "source": "github",
        "repo": "affaan-m/ECC"
      }
    }
  },
  "enabledPlugins": {
    "ecc@ecc": true
  }
}
```

---

## `multi-*` commands fail with missing dependency errors

**Cause:** `multi-*` commands require the `ccg-workflow` runtime which is not part of the base ECC install.

**Fix:**

```bash
npx ccg-workflow
```

This installs:
- `~/.claude/bin/codeagent-wrapper`
- `~/.claude/.ccg/prompts/*`

---

## TypeScript check fires on every edit and slows down work

**Cause:** The `post:edit:typecheck` hook runs after every Edit/Write tool call.

**Fix (temporary — disable for current session):**

```bash
export ECC_DISABLED_HOOKS="post:edit:typecheck"
```

**Fix (permanent — profile change):**

```bash
export ECC_HOOK_PROFILE=minimal
```

Re-enable when you want enforcement back by unsetting or resetting the variable.

---

## Secret detection false positives block legitimate commands

**Cause:** The secret detection hook matches patterns like `sk-`, `ghp_`, `AKIA` in bash commands. Test fixtures with placeholder values trigger this.

**Fix (session-level disable):**

```bash
export ECC_DISABLED_HOOKS="pre:bash:secret-check"
```

Re-enable after the session.

---

## ECC was wiped / Claude setup was reset

**Fix:** Do not reinstall from scratch immediately.

1. Check what's still installed:

```bash
node scripts/ecc.js list-installed
```

2. Run doctor and repair:

```bash
node scripts/ecc.js doctor
node scripts/ecc.js repair
```

This restores ECC-managed files recorded in the install-state without rebuilding your setup. If the problem is account/marketplace access for ECC Pro, handle that separately.

---

## Getting more help

- [GitHub Discussions](https://github.com/affaan-m/ECC/discussions) — Q&A, feature requests, show & tell
- [GitHub Issues](https://github.com/affaan-m/ECC/issues) — bug reports
- [Troubleshooting reference](../TROUBLESHOOTING.md) — additional issues and edge cases
