# Token optimization

Reduce costs and extend session quality without sacrificing capability.

Claude Code usage is measured in tokens — input context + output + thinking. ECC provides several mechanisms to minimize consumption. This guide covers settings, habits, and the tools ECC provides.

---

## Recommended settings

Add to `~/.claude/settings.json`:

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

| Setting | Default | Recommended | Effect |
|---------|---------|-------------|--------|
| `model` | opus | `sonnet` | ~60% cost reduction. Handles 80%+ of coding tasks. Switch to Opus only for complex reasoning. |
| `MAX_THINKING_TOKENS` | 31,999 | `10,000` | Extended thinking reserves tokens for internal reasoning. Reducing cuts hidden cost ~70%. Set to `0` to disable for trivial tasks. |
| `CLAUDE_CODE_SUBAGENT_MODEL` | inherits main | `haiku` | Subagents (Task tool) use this model. Haiku is ~80% cheaper and sufficient for file reading, search, and test execution. |

---

## Model selection

Match the model to the task:

| Model | Best for | Switch with |
|-------|----------|------------|
| Haiku | File reading, search, simple lookups, exploration | `CLAUDE_CODE_SUBAGENT_MODEL=haiku` |
| Sonnet | Day-to-day coding, reviews, test writing, implementation | `/model sonnet` (default) |
| Opus | Complex architecture, deep debugging, multi-step reasoning | `/model opus` |

Switch models mid-session:

```
/model sonnet     # for most work
/model opus       # for complex reasoning
/model haiku      # for quick tasks
```

---

## Context management

### Daily commands

| Command | When to use |
|---------|-------------|
| `/clear` | Between unrelated tasks. Stale context costs tokens on every message. |
| `/compact` | At logical task breakpoints — after planning, after debugging, before a context shift. |
| `/cost` | Check token spending for the current session. |

### Strategic compaction timing

The `strategic-compact` skill (in `skills/strategic-compact/`) suggests `/compact` at the right moments instead of waiting for auto-compaction at 95% context.

**Compact at:**
- After exploration, before implementation
- After completing a milestone
- After debugging, before continuing new work
- After a failed approach, before trying another

**Do not compact at:**
- Mid-implementation of related changes
- While an active issue is open
- During multi-file refactoring

---

## MCP server management

Each enabled MCP server adds tool definitions to your context window. With 14 servers, you can lose 30–50% of your effective context window to tool descriptions.

Rules:
- Keep under 10 MCP servers active per project
- Keep under 80 total tools active
- Use `/mcp` to disable servers you don't need — Claude Code persists these in `~/.claude.json`
- Prefer CLI tools when available (`gh` over GitHub MCP for simple queries)

The `memory` MCP server is included in ECC's default config but is not used by any skill, agent, or hook. Consider disabling it with `/mcp` if you don't use it directly.

---

## Subagent isolation

Instead of reading many files in your main session, delegate to a subagent (Task tool). The subagent reads 20 files but only returns a summary — your main context stays clean.

When Claude Code suggests reading a large number of files, consider: "Could I delegate this exploration to a subagent and receive only the conclusions?"

---

## Agent Teams cost warning

Agent Teams (experimental) spawns multiple context windows. Each teammate consumes tokens independently.

```bash
# Enable Agent Teams (experimental)
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Only use Agent Teams for tasks where parallelism provides clear value (multi-module work, parallel reviews). For simple sequential tasks, single-agent subagents are more token-efficient.

---

## Toggle extended thinking

Extended thinking can be toggled per-session:
- **Alt+T** (Windows/Linux) or **Option+T** (macOS) — toggle on/off
- **Ctrl+O** — show thinking output (verbose mode)

For simple, well-defined tasks, turn off extended thinking to save tokens. For architectural decisions and complex debugging, keep it on.

---

## Suppress API-rate cost estimate warnings

ECC's context monitor emits API-rate cost estimates from hook telemetry. These are not actual billing figures — they're local estimates. If you're on a Claude subscription and they're distracting:

```bash
export ECC_CONTEXT_MONITOR_COST_WARNINGS=off
```

Windows PowerShell (permanent):

```powershell
[Environment]::SetEnvironmentVariable('ECC_CONTEXT_MONITOR_COST_WARNINGS', 'off', 'User')
```

This does not suppress context exhaustion warnings, scope warnings, loop warnings, `/cost`, or cost telemetry files.

---

## Quick reference

```bash
# settings.json "env" block
MAX_THINKING_TOKENS=10000
CLAUDE_CODE_SUBAGENT_MODEL=haiku

# Session commands
/model sonnet          # default
/model opus            # complex reasoning only
/clear                 # between tasks
/compact               # at breakpoints
/cost                  # check spending
/mcp                   # manage MCP servers
```

---

> For more detail, see `docs/token-optimization.md` (the original standalone guide) and `rules/common/performance.md` (model selection rules).
