# Harness portability

ECC is designed to work across multiple AI coding tools (harnesses). The same skills, rules, and workflow patterns work in Claude Code, Cursor, Codex, OpenCode, and others — with harness-specific adapters handling the differences.

---

## The portability model

ECC separates the **reusable workflow layer** from the **harness-specific execution surface**:

```
Reusable layer (shared across all harnesses)
──────────────────────────────────────────────
skills/*/SKILL.md      → workflow knowledge modules
rules/                 → always-on standards
hooks/                 → scripts (where hooks are supported)
mcp-configs/           → tool integrations
agents/*.md            → agent definitions
AGENTS.md              → universal cross-tool context file

Harness adapters (thin, per-tool)
──────────────────────────────────────────────
Claude Code    → plugin.json, hooks/hooks.json (native)
Cursor         → .cursor/ (rules, hooks adapter, agents)
Codex          → .codex/ (AGENTS.md supplement, config.toml)
OpenCode       → .opencode/ (plugin events, config)
GitHub Copilot → .github/copilot-instructions.md
Zed            → .zed/ (settings, rules)
```

The goal: keep durable workflow knowledge in one place, adapt at the edge.

---

## What travels unchanged

`SKILL.md` is the most portable unit in ECC. A well-written skill:

- Uses YAML frontmatter with `name`, `description`, and `origin`
- Describes when to use it in plain language
- Lists required tools generically (not harness-specific commands)
- Keeps examples repo-relative or generic
- Separates harness-specific sections with clear labels

The same `tdd-workflow/SKILL.md` works in Claude Code, Codex, Cursor, and OpenCode because it's mostly instructions and workflow shape — not harness-specific commands.

---

## Harness comparison

| Feature | Claude Code | Cursor | Codex | OpenCode | GitHub Copilot |
|---------|------------|--------|-------|----------|----------------|
| **Agents** | 61 native | Shared via AGENTS.md | Shared via AGENTS.md | 12 translated | N/A |
| **Skills** | 246 | Shared | 32 (native format) | 37 | Via instructions |
| **Hook events** | 8 types | 15 types | None (instruction-based) | 11 types | None |
| **Rules** | 34 (common + lang) | 34 (YAML frontmatter) | Instruction-based | 13 instructions | 1 always-on file |
| **MCP servers** | 14 | Shared `.mcp.json` | 7 (auto-merged TOML) | Full | N/A |
| **Hook execution** | Native | DRY adapter → shared scripts | N/A | Plugin events | N/A |
| **Context file** | CLAUDE.md + AGENTS.md | AGENTS.md | AGENTS.md | AGENTS.md | copilot-instructions.md |

---

## Claude Code (primary target)

Claude Code is ECC's primary harness. Full support for all components.

Install: [Quickstart](../getting-started/quickstart.md)

---

## Cursor

ECC provides a translated Cursor surface under `.cursor/`. Cursor has 15+ hook event types — more than Claude Code. ECC uses a DRY adapter pattern so Cursor hooks reuse the same `scripts/hooks/*.js` files without duplication.

```
Cursor stdin JSON → .cursor/hooks/adapter.js → scripts/hooks/*.js (shared)
```

Key Cursor hooks:
- `beforeShellExecution` — blocks dev servers outside tmux, git push review
- `afterFileEdit` — auto-format + TypeScript check + console.log warning
- `beforeSubmitPrompt` — detects secrets in prompts
- `beforeTabFileRead` — blocks Tab from reading `.env`, `.key`, `.pem` files

Cursor rules use YAML frontmatter with `globs` and `alwaysApply`:

```yaml
---
description: "TypeScript coding style"
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---
```

Install:

```bash
# macOS / Linux
./install.sh --target cursor typescript

# Windows PowerShell
.\install.ps1 --target cursor typescript
```

---

## Codex

ECC provides first-class Codex support for both the macOS app and CLI.

Key files:
- `.codex/config.toml` — approvals, sandbox, MCP servers, profiles
- `AGENTS.md` (root) — universal context, auto-detected
- `.codex/AGENTS.md` — Codex-specific supplement
- `.agents/skills/` — SKILL.md + `agents/openai.yaml` per skill

Codex does not yet provide native hook execution parity. ECC compensates with `AGENTS.md`, sandbox permissions, and `model_instructions_file` overrides.

Multi-agent support: enable with `features.multi_agent = true` in `.codex/config.toml`. ECC ships three roles: `explorer` (read-only), `reviewer` (correctness), `docs_researcher` (documentation).

Install:

```bash
# Sync ECC assets to ~/.codex
npm install && bash scripts/sync-ecc-to-codex.sh

# Or copy manually
cp .codex/config.toml ~/.codex/config.toml
```

---

## OpenCode

ECC provides full OpenCode support including plugin events.

OpenCode has 20+ plugin event types — more than Claude Code. ECC maps them:

| Claude Code hook | OpenCode plugin event |
|-----------------|----------------------|
| `PreToolUse` | `tool.execute.before` |
| `PostToolUse` | `tool.execute.after` |
| `Stop` | `session.idle` |
| `SessionStart` | `session.created` |

Install:

```bash
# Option A: run OpenCode directly in the ECC repo
opencode

# Option B: install as npm package
npm install ecc-universal
```

Then add to `opencode.json`:

```json
{
  "plugin": ["ecc-universal"]
}
```

---

## GitHub Copilot

ECC provides a Copilot instruction and prompt layer:

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Always-loaded rules (coding style, security, testing, git) |
| `.github/prompts/plan.prompt.md` | `/plan` workflow |
| `.github/prompts/tdd.prompt.md` | TDD red-green-improve cycle |
| `.github/prompts/code-review.prompt.md` | Quality and security review |
| `.github/prompts/security-review.prompt.md` | OWASP-aligned security analysis |
| `.vscode/settings.json` | Per-task instruction file overlays |

Limitations: Copilot has no hook system and no subagent API. Hook automations and agent delegation are unavailable. The instruction layer still brings ECC's coding philosophy into every session.

---

## Zed

ECC provides a conservative `.zed/` adapter for project-local settings, flattened rules, agents, commands, and skills.

Install:

```bash
./install.sh --profile minimal --target zed
```

---

## Using ECC on a custom API endpoint

ECC does not hardcode transport settings. It works with any compatible endpoint:

```bash
export ANTHROPIC_BASE_URL=https://your-gateway.example.com
export ANTHROPIC_AUTH_TOKEN=your-token
claude
```

If your gateway remaps model names, configure that in Claude Code's model settings, not in ECC.

---

## See also

- [Architecture: Cross-harness](../architecture/cross-harness.md) — deeper architectural detail
- [Guide: Multi-harness setup](../guides/multi-harness-setup.md) — step-by-step for each harness
