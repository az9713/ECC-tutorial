# Environment variables

Every environment variable recognized by ECC. Set these in `~/.claude/settings.json` under `"env"`, or export in your shell.

Recommended way to persist:

```json
{
  "env": {
    "ECC_HOOK_PROFILE": "standard",
    "MAX_THINKING_TOKENS": "10000"
  }
}
```

---

## Hook runtime controls

### `ECC_HOOK_PROFILE`

| | |
|-|-|
| **Type** | enum |
| **Values** | `minimal`, `standard`, `strict` |
| **Default** | `standard` |
| **Description** | Controls which hook group runs. `minimal` = safety-critical only. `standard` = all stable hooks. `strict` = all hooks including experimental. |

```bash
export ECC_HOOK_PROFILE=minimal
```

---

### `ECC_DISABLED_HOOKS`

| | |
|-|-|
| **Type** | comma-separated string |
| **Default** | _(empty — all hooks run)_ |
| **Description** | Comma-separated list of hook IDs to skip. Does not affect other hooks in the same profile. |

```bash
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"
```

Hook IDs are defined in `hooks/hooks.json` — each hook has an `"id"` field.

---

### `ECC_GOVERNANCE_CAPTURE`

| | |
|-|-|
| **Type** | flag |
| **Values** | `1` (enabled) or unset (disabled) |
| **Default** | unset (disabled) |
| **Description** | Enables governance event logging — secrets, policy violations, approval requests. Logs written to `~/.claude/homunculus/governance/`. |

```bash
export ECC_GOVERNANCE_CAPTURE=1
```

---

## Session context controls

### `ECC_SESSION_START_MAX_CHARS`

| | |
|-|-|
| **Type** | integer |
| **Default** | `8000` |
| **Description** | Maximum characters injected into context at session start by the SessionStart hook. Reduce for API-cost setups or local models with small context windows. |

```bash
export ECC_SESSION_START_MAX_CHARS=4000
```

---

### `ECC_SESSION_START_CONTEXT`

| | |
|-|-|
| **Type** | enum |
| **Values** | `on`, `off` |
| **Default** | `on` |
| **Description** | Disable SessionStart context injection entirely. Use for local-model setups or when you don't use ECC's memory features. |

```bash
export ECC_SESSION_START_CONTEXT=off
```

---

### `ECC_CONTEXT_MONITOR_COST_WARNINGS`

| | |
|-|-|
| **Type** | enum |
| **Values** | `on`, `off` |
| **Default** | `on` |
| **Description** | Suppress agent-facing API-rate cost estimate warnings from ECC's context monitor. Keeps context exhaustion, scope, and loop warnings active. Use when on a subscription where per-request cost estimates aren't meaningful. |

```bash
export ECC_CONTEXT_MONITOR_COST_WARNINGS=off
```

Windows PowerShell (permanent):

```powershell
[Environment]::SetEnvironmentVariable('ECC_CONTEXT_MONITOR_COST_WARNINGS', 'off', 'User')
```

---

## Model controls (Claude Code settings, used by ECC)

### `MAX_THINKING_TOKENS`

| | |
|-|-|
| **Type** | integer |
| **Default** | `31999` |
| **Recommended** | `10000` |
| **Description** | Maximum tokens reserved for extended thinking per request. Reducing from 31,999 to 10,000 cuts hidden thinking cost ~70% with minimal quality loss for most tasks. Set to `0` to disable extended thinking. |

```json
{ "env": { "MAX_THINKING_TOKENS": "10000" } }
```

---

### `CLAUDE_CODE_SUBAGENT_MODEL`

| | |
|-|-|
| **Type** | string |
| **Default** | inherits main model |
| **Recommended** | `haiku` |
| **Description** | Model used for subagents spawned via the Task tool. Haiku is ~80% cheaper and sufficient for file reading, search, and exploration. |

```json
{ "env": { "CLAUDE_CODE_SUBAGENT_MODEL": "haiku" } }
```

---

### `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`

| | |
|-|-|
| **Type** | flag |
| **Values** | `1` (enabled) or unset |
| **Default** | unset |
| **Description** | Enables the experimental Agent Teams feature, which spawns multiple independent context windows. Each teammate consumes tokens independently — use only for tasks where parallelism is clearly beneficial. |

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

---

## Install/sync controls

### `CLAUDE_PACKAGE_MANAGER`

| | |
|-|-|
| **Type** | enum |
| **Values** | `npm`, `pnpm`, `yarn`, `bun` |
| **Default** | auto-detected |
| **Description** | Forces ECC's install scripts and hooks to use the specified package manager instead of auto-detecting from lock files. |

```bash
export CLAUDE_PACKAGE_MANAGER=pnpm
```

---

### `ECC_DISABLED_MCPS`

| | |
|-|-|
| **Type** | comma-separated string |
| **Default** | _(empty)_ |
| **Description** | Comma-separated list of MCP server names that ECC's install/sync scripts should skip or remove. This is NOT a live Claude Code toggle — it only affects `install.sh`, `npx ecc-install`, and `sync-ecc-to-codex.sh`. To disable live MCP servers, use `/mcp` inside Claude Code. |

```bash
export ECC_DISABLED_MCPS="github,context7,exa,playwright,sequential-thinking,memory"
```

---

### `CLAUDE_PLUGIN_ROOT`

| | |
|-|-|
| **Type** | path string |
| **Default** | auto-resolved |
| **Description** | Override the auto-resolved ECC plugin root path. Set this if your Claude Code install has an unusual layout and hooks can't find `scripts/lib/utils.js`. |

```bash
export CLAUDE_PLUGIN_ROOT=/path/to/your/.claude/plugins/ecc
```

---

## Quick reference table

| Variable | Default | Purpose |
|----------|---------|---------|
| `ECC_HOOK_PROFILE` | `standard` | Hook strictness level |
| `ECC_DISABLED_HOOKS` | _(empty)_ | Comma-separated hook IDs to skip |
| `ECC_GOVERNANCE_CAPTURE` | unset | Enable governance event logging |
| `ECC_SESSION_START_MAX_CHARS` | `8000` | SessionStart context injection limit |
| `ECC_SESSION_START_CONTEXT` | `on` | Enable/disable SessionStart injection |
| `ECC_CONTEXT_MONITOR_COST_WARNINGS` | `on` | Show/hide API cost estimates |
| `MAX_THINKING_TOKENS` | `31999` | Extended thinking token budget |
| `CLAUDE_CODE_SUBAGENT_MODEL` | _(inherits)_ | Model for Task subagents |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | unset | Enable Agent Teams (experimental) |
| `CLAUDE_PACKAGE_MANAGER` | auto | Force package manager choice |
| `ECC_DISABLED_MCPS` | _(empty)_ | MCPs to skip during install/sync |
| `CLAUDE_PLUGIN_ROOT` | auto | Override plugin root path |
