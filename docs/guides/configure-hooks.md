# Configure hooks

Tune ECC's hook system — change strictness, disable individual hooks, adjust session context limits.

---

## Prerequisites

- ECC installed (plugin or manual)
- Familiarity with [Concepts: Hooks](../concepts/hooks.md)

---

## Hook profiles

The quickest way to tune hooks is to change the profile. Set via environment variable:

```bash
export ECC_HOOK_PROFILE=minimal    # safety-critical hooks only
export ECC_HOOK_PROFILE=standard   # default — all stable hooks
export ECC_HOOK_PROFILE=strict     # all hooks including experimental
```

Persist in `~/.claude/settings.json`:

```json
{
  "env": {
    "ECC_HOOK_PROFILE": "standard"
  }
}
```

Windows PowerShell (permanent):

```powershell
[Environment]::SetEnvironmentVariable('ECC_HOOK_PROFILE', 'standard', 'User')
```

**When to use `minimal`:** Local model setups, low-resource machines, or when you only want the safety hooks (secret detection, GateGuard) without formatting/typecheck overhead.

**When to use `strict`:** Production or security-sensitive work where you want maximum enforcement.

---

## Disable specific hooks

Disable individual hooks by ID without changing the profile:

```bash
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"
```

Multiple hook IDs are comma-separated. Find all hook IDs in `hooks/hooks.json` — each hook has an `"id"` field.

Common hooks to disable temporarily:

| Hook ID | Why you'd disable it |
|---------|---------------------|
| `post:edit:typecheck` | During large multi-file refactors |
| `pre:bash:tmux-reminder` | On machines without tmux |
| `pre:bash:git-push-review` | When doing rapid iterative pushes |
| `pre:observe:continuous-learning` | On shared or low-storage machines |
| `pre:edit-write:suggest-compact` | When you prefer to manage compaction manually |

---

## Adjust session context injection

The `SessionStart` hook injects project memory context. Control the injection size:

```bash
# Reduce injected context (default: 8000 chars)
export ECC_SESSION_START_MAX_CHARS=4000

# Disable injection entirely for local-model or minimal setups
export ECC_SESSION_START_CONTEXT=off
```

When to reduce: high-cost API setups, local models with small context windows, or when session start is slow.

---

## Suppress cost estimate warnings

The context monitor emits API-rate cost estimates. Suppress these without affecting context/scope/loop warnings:

```bash
export ECC_CONTEXT_MONITOR_COST_WARNINGS=off
```

Windows PowerShell:

```powershell
[Environment]::SetEnvironmentVariable('ECC_CONTEXT_MONITOR_COST_WARNINGS', 'off', 'User')
```

Use this if you're on a Claude subscription and the cost estimates don't reflect your actual bill.

---

## Persist settings in settings.json

Put all ECC env vars in `~/.claude/settings.json` under the `env` key so they persist across sessions:

```json
{
  "model": "sonnet",
  "env": {
    "ECC_HOOK_PROFILE": "standard",
    "ECC_DISABLED_HOOKS": "",
    "ECC_SESSION_START_MAX_CHARS": "8000",
    "ECC_CONTEXT_MONITOR_COST_WARNINGS": "off"
  }
}
```

---

## Install hooks (manual install path only)

If you used the manual install path and haven't installed hooks:

```bash
# macOS / Linux
bash ./install.sh --target claude --modules hooks-runtime

# Windows PowerShell
pwsh -File .\install.ps1 --target claude --modules hooks-runtime
```

This writes resolved hook paths to `~/.claude/hooks/hooks.json`. Do not copy `hooks/hooks.json` directly — command paths must be rewritten for your system.

> **Warning:** If you installed via `/plugin install ecc@ecc`, do not also run the hooks installer. Claude Code v2.1+ auto-loads plugin hooks. Duplicating them causes double execution.

---

## Enable governance capture (optional)

Governance capture records policy violations (secrets, approval requests) to a local log. Opt-in:

```bash
export ECC_GOVERNANCE_CAPTURE=1
```

Logs are written to `~/.claude/homunculus/governance/`. Review them periodically.

---

## Disable ECC-managed MCPs during install (not a runtime toggle)

`ECC_DISABLED_MCPS` controls which MCP servers ECC's install/sync scripts skip. It is not a live Claude Code toggle.

```bash
export ECC_DISABLED_MCPS="github,context7,exa,playwright,sequential-thinking,memory"
```

To disable live Claude Code MCP servers, use the `/mcp` command inside Claude Code. Claude Code persists those runtime disables in `~/.claude.json`.

---

## Verification

After changing hook configuration, verify hooks are working:

```bash
# List installed hooks
node scripts/ecc.js list-installed

# Check for configuration issues
node scripts/ecc.js doctor
```

Expected output for a healthy install:

```
✓ Hooks: 20+ active hooks loaded
✓ Profile: standard
✓ No disabled hooks
✓ Session context: 8000 chars
```

---

## Troubleshooting hooks

See [Troubleshooting: Hook issues](../troubleshooting/common-issues.md#hooks-arent-running).
