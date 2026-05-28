# Hooks

Hooks are event-driven automations that run automatically during your session. They are the enforcement layer of ECC — they apply standards without requiring you to think about them.

---

## What problem hooks solve

Standards that depend on human memory fail. You know you should run TypeScript typechecks after edits. You know you should check for secrets before pushing. But under deadline pressure, you forget. Hooks make these checks unconditional.

ECC hooks fire on every relevant event. TypeScript is checked after every file edit. Secret patterns are scanned before every bash command. Session state is saved when you stop. No manual step required.

---

## How hooks work

Hooks are defined in `hooks/hooks.json` as a list of matchers and commands. When Claude Code executes a tool, it checks if any hook's matcher matches the tool name. If it does, the hook script runs.

```json
{
  "matcher": "Edit|Write",
  "hooks": [{
    "type": "command",
    "command": "node scripts/hooks/run-with-flags.js post:edit:typecheck scripts/hooks/typecheck.js standard,strict"
  }],
  "id": "post:edit:typecheck"
}
```

Key concepts:
- **Matcher**: which tool event triggers this hook (`Bash`, `Edit`, `Write`, `*` for all)
- **Command**: the script to run when matched
- **Phase**: `PreToolUse` (before the tool runs, can block), `PostToolUse` (after), `Stop`, `SessionStart`
- **ID**: unique identifier used for disabling (`ECC_DISABLED_HOOKS`)

---

## Hook phases

| Phase | When it fires | Can block? | Use for |
|-------|--------------|-----------|---------|
| `PreToolUse` | Before the tool executes | Yes (exit code 2) | Validation, secret detection, safety checks |
| `PostToolUse` | After the tool executes | No | Format, typecheck, notification |
| `Stop` | When the session ends | No | Save state, extract patterns |
| `SessionStart` | When the session begins | No | Load memory, inject context |

---

## ECC's built-in hooks

### PreToolUse hooks

| ID | Matcher | What it does |
|----|---------|-------------|
| `pre:bash:dispatcher` | `Bash` | Consolidated preflight: tmux guard, git push review, GateGuard security checks |
| `pre:write:doc-file-warning` | `Write` | Warns about non-standard documentation file names |
| `pre:edit-write:suggest-compact` | `Edit\|Write` | Suggests `/compact` at logical intervals based on context usage |
| `pre:observe:continuous-learning` | `*` | Captures tool use for pattern learning (async, non-blocking) |
| `pre:governance-capture` | `Bash\|Write\|Edit\|MultiEdit` | Captures governance events (secrets, policy violations) — opt-in with `ECC_GOVERNANCE_CAPTURE=1` |

### PostToolUse hooks

| ID | Matcher | What it does |
|----|---------|-------------|
| `post:edit:typecheck` | `Edit\|Write` | TypeScript typecheck after file edits |
| `post:edit:format` | `Edit\|Write` | Auto-format after file edits |
| `post:bash:console-log` | `Edit\|Write` on `.ts/.tsx/.js/.jsx` | Warns about `console.log` in production code |

### SessionStart hooks

| ID | What it does |
|----|-------------|
| `session:start` | Loads project memory context, injects relevant instincts |

### Stop hooks

| ID | What it does |
|----|-------------|
| `session:stop` | Saves session state, evaluates patterns, updates continuous learning |

---

## Runtime controls

### Hook profiles

Control which hooks run via the `ECC_HOOK_PROFILE` environment variable:

| Profile | What runs |
|---------|----------|
| `minimal` | Safety-critical hooks only (secret detection, GateGuard) |
| `standard` | All hooks except experimental ones (default) |
| `strict` | All hooks including experimental |

```bash
export ECC_HOOK_PROFILE=minimal    # for local-model or low-resource setups
export ECC_HOOK_PROFILE=standard   # default
export ECC_HOOK_PROFILE=strict     # maximum enforcement
```

### Disabling specific hooks

```bash
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"
```

Use comma-separated hook IDs. Find IDs in `hooks/hooks.json` — each hook has an `"id"` field.

### Session context limits

```bash
export ECC_SESSION_START_MAX_CHARS=4000    # default: 8000
export ECC_SESSION_START_CONTEXT=off       # disable entirely for local-model setups
```

---

## How hooks are loaded (Claude Code v2.1+)

Claude Code v2.1+ automatically loads `hooks/hooks.json` from installed plugins. You do **not** need to declare hooks in `plugin.json`.

> **Warning:** Do not add a `"hooks"` field to `.claude-plugin/plugin.json`. This causes duplicate-hook detection errors. Claude Code auto-loads `hooks/hooks.json` by convention. See [Troubleshooting](../troubleshooting/common-issues.md#i-see-duplicate-hooks-file-detected-errors).

---

## Hook internals: the run-with-flags wrapper

Most ECC hooks run through `scripts/hooks/run-with-flags.js`. This wrapper:

1. Resolves the ECC plugin root path (handles all install locations)
2. Checks `ECC_HOOK_PROFILE` and `ECC_DISABLED_HOOKS` before executing
3. Passes stdin JSON to the hook script
4. Exits 0 on non-critical errors (hooks never block tool execution unexpectedly)

Hook scripts export a `run(rawInput)` function. The wrapper handles JSON parsing, gating, and error recovery.

---

## Writing custom hooks

Hooks are Node.js scripts. The pattern:

```javascript
// scripts/hooks/my-hook.js
function run(rawInput) {
  let input;
  try {
    input = JSON.parse(rawInput);
  } catch (e) {
    return; // exit 0 on parse error — never block
  }

  const { tool_name, tool_input } = input;
  if (tool_name !== 'Bash') return;

  // your logic here
  // to block: process.exit(2)
  // to warn: console.error('[MyHook] warning message')
  // to allow: return (exits 0)
}

module.exports = { run };
```

Register in `hooks/hooks.json`:

```json
{
  "matcher": "Bash",
  "hooks": [{
    "type": "command",
    "command": "node scripts/hooks/run-with-flags.js my:hook:id scripts/hooks/my-hook.js standard,strict"
  }],
  "id": "my:hook:id",
  "description": "Description of what this hook does"
}
```

Key rules:
- Always exit 0 on parse errors
- Keep PreToolUse hooks under 200ms — no network calls
- Use `async: true` in the JSON for PostToolUse hooks that need more time (max 30s)
- Log warnings to stderr with `[HookName]` prefix

---

## Interaction with Cursor

Cursor has 15+ hook event types (more than Claude Code's 8). ECC uses a DRY adapter pattern: `.cursor/hooks/adapter.js` transforms Cursor's stdin format to Claude Code's format, then calls the same `scripts/hooks/*.js` files. No duplicate code.

See [Guide: Multi-harness setup](../guides/multi-harness-setup.md) for Cursor-specific hook setup.

---

## Common gotchas

**TypeScript check fails on every edit.** The `post:edit:typecheck` hook runs on every edit, including mid-refactor edits. Set `ECC_DISABLED_HOOKS="post:edit:typecheck"` while doing large refactors, then re-enable.

**Hook slows down every tool call.** The `pre:observe:continuous-learning` hook is async (`"async": true`) and should not block. If it's slow, it may be writing to a full disk. Check `~/.claude/homunculus/`.

**Secret check false positives.** The secret detection hook matches patterns like `sk-`, `ghp_`, `AKIA`. If you're working with test fixtures that contain placeholder values, these will fire. Add the specific hook ID to `ECC_DISABLED_HOOKS` for that session.

---

## See also

- [Guide: Configure hooks](../guides/configure-hooks.md) — full tuning guide
- [Concepts: Rules](rules.md) — always-on guidelines (different from hooks)
- [Reference: Environment variables](../reference/env-vars.md) — all hook control vars
