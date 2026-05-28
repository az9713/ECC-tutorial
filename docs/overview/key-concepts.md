# Key Concepts

Every term used in ECC documentation, defined precisely.

---

## Agent

A specialized subagent you delegate a bounded task to. Agents are Markdown files with YAML frontmatter specifying a name, description, allowed tools, and model. When you invoke an agent, Claude Code spins it up in a limited scope — it can only use the tools it was granted, and it returns a result without modifying your main session context.

Example: the `code-reviewer` agent runs a quality review and returns findings. It cannot edit files or run bash commands because it was not granted those tools.

See: [Concepts: Agents](../concepts/agents.md)

---

## Command

A slash command that invokes a workflow. Commands are the user-triggered entry point for ECC workflows. Example: `/ecc:plan "Add auth"` triggers the planning workflow; `/code-review` triggers the code review workflow.

Commands are maintained in `commands/` for backward compatibility. New workflow development lands in skills first; commands that invoke skills are lightweight wrappers.

See: [Reference: Commands and agents](../reference/commands.md)

---

## Continuous learning

A system that automatically extracts patterns from your coding sessions and stores them as instincts. Over time, the system learns what works in your codebase and injects those patterns into future sessions.

Two versions exist:
- **v1** (`continuous-learning/`) — legacy Stop-hook pattern extraction
- **v2** (`continuous-learning-v2/`) — instinct-based with confidence scoring, import/export, and evolution

See: [Concepts: Skills](../concepts/skills.md)

---

## Harness

An AI coding tool that ECC runs inside. Examples: Claude Code (primary), Cursor, Codex (OpenAI), OpenCode, Zed, GitHub Copilot.

ECC's workflow layer is designed to be harness-portable: skills and rules work across all supported harnesses; hooks run natively in Claude Code, Cursor, and OpenCode, but fall back to instruction-based enforcement in Codex.

See: [Concepts: Harness portability](../concepts/harness-portability.md)

---

## Hook

A script that fires automatically when a tool event occurs. Hooks are defined in `hooks/hooks.json` and executed by the harness. They can block tool execution (PreToolUse), react after it (PostToolUse), run when the session stops (Stop), or initialize when it starts (SessionStart).

Example hooks: TypeScript typecheck after every file edit, secret-pattern detection before bash commands, session state save on stop.

See: [Concepts: Hooks](../concepts/hooks.md)

---

## Instinct

A pattern learned from a session, stored with a confidence score. Instincts are the building blocks of the continuous-learning-v2 system. Individual instincts can be clustered into full skills with `/evolve`, exported for sharing with `/instinct-export`, or imported from others with `/instinct-import`.

---

## Legacy command shim

A retired slash command name kept under `legacy-command-shims/` for explicit opt-in. Examples: `/tdd`, `/e2e`, `/eval`, `/verify`. The underlying workflows have moved to skills. The shims are not installed by default.

---

## MCP server

A Model Context Protocol server that gives Claude Code (or other harnesses) additional tools — GitHub API, Supabase, Playwright, Exa search, Context7 docs lookup, etc. ECC ships pre-configured MCP definitions in `mcp-configs/mcp-servers.json` and `.mcp.json`.

> **Warning:** Each enabled MCP server adds tool descriptions to your context window. Keep under 10 active per project.

---

## Plugin

The packaged form of ECC for the Claude Code marketplace. Install with `/plugin install ecc@ecc`. The plugin auto-loads skills, agents, commands, and hooks. Rules are not distributable via plugins (upstream limitation) and must be copied manually.

Identifier: `ecc@ecc` (plugin install), `ecc-universal` (npm), `affaan-m/ECC` (GitHub source).

---

## Profile

A named install preset that controls which ECC components are installed. Three built-in profiles:

| Profile | What it includes |
|---------|-----------------|
| `minimal` | Rules, agents, commands, core skills — no hooks |
| `core` | Minimal + hooks-runtime |
| `full` | Everything |

See: [Reference: Install profiles](../reference/install-profiles.md)

---

## Rule

An always-on guideline that applies to every session. Rules are Markdown files in `rules/`, organized into `common/` (language-agnostic) and language-specific subdirectories (`typescript/`, `python/`, `golang/`, etc.). Unlike skills (context-activated) or commands (user-triggered), rules are always loaded.

Rules are not distributable via the plugin system. You copy them manually to `~/.claude/rules/ecc/` or `.claude/rules/ecc/`.

See: [Concepts: Rules](../concepts/rules.md)

---

## Session

One continuous Claude Code conversation. Sessions have a lifecycle: SessionStart (hook fires, memory loads), active use, Stop (hook fires, patterns extracted). Sessions can be browsed with `/sessions`.

---

## Skill

A workflow knowledge module that Claude Code loads based on context. Skills encode domain expertise, step-by-step processes, code patterns, and decision trees. They activate automatically when the task matches the skill's domain.

Skills are the primary workflow surface in ECC. They live in `skills/*/SKILL.md` and use YAML frontmatter for metadata.

See: [Concepts: Skills](../concepts/skills.md)

---

## Subagent

A child agent spawned during a session to handle a delegated task. Subagents run in a separate context and return results without consuming tokens from the main session. Used heavily in ECC for parallelizable work: reading multiple files, running tests, performing reviews.

---

## Token

The unit of measure for LLM input/output. Context windows, pricing, and performance are all denominated in tokens. ECC includes multiple features to minimize token consumption: context-aware compaction suggestions, subagent isolation, MCP count limits, and model routing (Haiku for exploration, Sonnet for implementation, Opus for complex reasoning).

See: [Guide: Token optimization](../guides/token-optimization.md)
