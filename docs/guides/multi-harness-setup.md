# Multi-harness setup

Set up ECC in Cursor, Codex, OpenCode, or Zed alongside (or instead of) Claude Code.

---

## Prerequisites

- ECC repo cloned: `git clone https://github.com/affaan-m/ECC.git`
- `npm install` run in the repo
- The target harness installed and working

---

## Cursor

ECC provides a full Cursor surface: hooks, rules (YAML frontmatter), agents, skills, commands, and MCP config.

### Install

```bash
# macOS / Linux — TypeScript stack example
./install.sh --target cursor typescript

# Multiple language packs
./install.sh --target cursor typescript python golang swift php

# Windows PowerShell
.\install.ps1 --target cursor typescript
.\install.ps1 --target cursor python golang swift php
```

### What's installed

| Component | Location | Count |
|-----------|----------|-------|
| Rules | `.cursor/rules/` | 34 (9 common + 25 language-specific) |
| Agents | `.cursor/agents/ecc-*.md` | 48 (prefixed to avoid collisions) |
| Hooks | `.cursor/hooks/` | 16 scripts |
| Skills | `.cursor/skills/` | Core skills |
| MCP config | `.cursor/mcp.json` | Shared |

### Hook architecture in Cursor

Cursor has 15+ hook event types. ECC reuses the same `scripts/hooks/*.js` files via an adapter:

```
Cursor event (stdin JSON) → .cursor/hooks/adapter.js → scripts/hooks/*.js (shared scripts)
```

Key Cursor hooks:
- `beforeShellExecution` — blocks dev servers outside tmux (exit 2), git push review
- `afterFileEdit` — auto-format + TypeScript check + console.log warning
- `beforeSubmitPrompt` — detects secrets in prompts (`sk-`, `ghp_`, `AKIA`)
- `beforeTabFileRead` — blocks Tab from reading `.env`, `.key`, `.pem` files

### Cursor rules format

Cursor rules use YAML frontmatter (different from Claude Code's plain Markdown rules):

```yaml
---
description: "TypeScript coding style extending common rules"
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: false
---
# content...
```

`alwaysApply: true` rules load in every context; `false` rules load based on file glob match.

---

## Codex (macOS app + CLI)

### Install

**Option A: Automatic sync**

```bash
npm install && bash scripts/sync-ecc-to-codex.sh
```

This merges ECC's MCP servers into `~/.codex/config.toml` using an add-only strategy (never removes your existing config).

Preview changes before applying:

```bash
bash scripts/sync-ecc-to-codex.sh --dry-run
```

Force-update ECC servers to latest config:

```bash
bash scripts/sync-ecc-to-codex.sh --update-mcp
```

**Option B: Manual**

```bash
cp .codex/config.toml ~/.codex/config.toml
```

Then run the Codex CLI in the ECC repo directory — `AGENTS.md` and `.codex/` are auto-detected.

### What's included

| Component | Location | Details |
|-----------|----------|---------|
| Config | `.codex/config.toml` | Approvals, sandbox, MCP servers, profiles |
| Universal context | `AGENTS.md` (root) | Auto-detected by Codex |
| Codex supplement | `.codex/AGENTS.md` | Codex-specific instructions |
| Skills | `.agents/skills/` | 32 skills with `SKILL.md` + `agents/openai.yaml` |
| Agent roles | `.codex/agents/` | `explorer`, `reviewer`, `docs_researcher` |

### Multi-agent setup

Enable multi-agent support in `.codex/config.toml`:

```toml
[features]
multi_agent = true

[agents.explorer]
description = "Read-only codebase evidence gathering before edits"
instruction_file = ".codex/agents/explorer.md"

[agents.reviewer]
description = "Correctness, security, and missing-test review"
instruction_file = ".codex/agents/reviewer.md"
```

### Codex limitations

Codex does not yet support native hook execution. ECC compensates with:
- `AGENTS.md` instructions for quality standards
- `model_instructions_file` overrides for task-specific instructions
- Sandbox/approval settings in `config.toml` for safety enforcement

---

## OpenCode

### Install

**Option A: Run directly in the ECC repo**

```bash
opencode
```

The `.opencode/` configuration is auto-detected.

**Option B: npm package**

```bash
npm install ecc-universal
```

Add to your `opencode.json`:

```json
{
  "plugin": ["ecc-universal"]
}
```

For the full ECC OpenCode setup (commands, agents, instructions), copy the bundled `.opencode/` config assets into your project and wire the `instructions`, `agent`, and `command` entries in `opencode.json`.

### Hook events

OpenCode's plugin event system maps to ECC's Claude Code hooks:

| Claude Code hook | OpenCode event |
|-----------------|---------------|
| `PreToolUse` | `tool.execute.before` |
| `PostToolUse` | `tool.execute.after` |
| `Stop` | `session.idle` |
| `SessionStart` | `session.created` |

OpenCode also provides additional events: `file.edited`, `file.watcher.updated`, `message.updated`, `lsp.client.diagnostics`.

### Reference docs

- Migration guide: `.opencode/MIGRATION.md`
- Plugin README: `.opencode/README.md`
- LLM docs: `llms.txt`

---

## Zed

### Install

```bash
# macOS / Linux
./install.sh --profile minimal --target zed

# Windows PowerShell
.\install.ps1 --profile minimal --target zed
```

The installer writes ECC-managed files under `.zed/`: settings, flattened rules, agents, commands, and skills. Keep API keys and BYOK credentials out of the repo — configure those through Zed's own settings UI.

---

## GitHub Copilot

No installation needed. The files are already in place:

- `.github/copilot-instructions.md` — always-loaded coding standards
- `.github/prompts/` — workflow prompts (`plan`, `tdd`, `code-review`, `security-review`, `build-fix`, `refactor`)
- `.vscode/settings.json` — per-task instruction overlays

To use workflow prompts in Copilot Chat:
1. Open the Copilot Chat panel in VS Code.
2. Click the **paperclip / attach** icon and select **Prompt...**
3. Select the prompt (e.g. `tdd`, `code-review`).

Copilot has no hook system and no subagent API. ECC's automated enforcements are unavailable; the instruction layer brings the coding philosophy.

---

## Custom API endpoint (any harness)

ECC works with custom or gateway Claude endpoints:

```bash
export ANTHROPIC_BASE_URL=https://your-gateway.example.com
export ANTHROPIC_AUTH_TOKEN=your-token
```

If your gateway remaps model names, configure that in the harness model settings, not in ECC.

---

## Troubleshooting

**Cursor agents not visible.** Cursor-native agent loading varies by Cursor build. If `.cursor/agents/ecc-*.md` files don't appear as selectable agents, they still work as explicit reference definitions when mentioned by name.

**Codex MCP config conflicts.** If you have a legacy `[mcp_servers.context7-mcp]` entry, run `--update-mcp` to migrate to the canonical `[mcp_servers.context7]` section name.

**OpenCode plugin not loading.** The `ecc-universal` npm package enables ECC's plugin hooks and events. It does not automatically add the full command/agent/instruction catalog — copy `.opencode/` assets manually for full setup.
