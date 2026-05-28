# What is ECC?

ECC is a complete agentic workflow system you install into your AI coding tool to make it significantly more capable, consistent, and safe.

---

## The problem it solves

Out of the box, AI coding tools like Claude Code are general-purpose. They have no inherent knowledge of your workflows, no memory across sessions, no automatic security checks, and no enforcement of coding standards. Every project starts from scratch.

ECC solves this by giving your AI tool a full operational layer:

- **Knowledge** — 246 skills encoding proven patterns for languages, frameworks, testing, architecture, and security.
- **Specialists** — 61 agents for delegation: a dedicated code reviewer, security auditor, TDD guide, build-error resolver, and more.
- **Automation** — Hooks that fire on tool events: auto-format after edits, check for secrets before shell commands, save session state when you stop.
- **Standards** — Always-on rules for code style, testing requirements, git workflow, and security that apply to every session.
- **Memory** — A continuous learning system that extracts patterns from your sessions and builds reusable instincts over time.

---

## Mental model

Think of ECC as the senior engineer that set up your AI tool's environment. Before ECC, your AI assistant was smart but had no context about how good software is built. After ECC:

```
Without ECC                          With ECC
────────────────────                 ────────────────────────────────────────
AI tool (raw)                        AI tool
  + your prompts                       + Skills (246 workflow modules)
                                       + Agents (61 specialists)
                                       + Hooks (event-driven automations)
                                       + Rules (always-on standards)
                                       + Commands (workflow shortcuts)
                                       + MCP configs (tool integrations)
                                       + Memory (continuous learning)
```

---

## How it's structured

ECC is a **Claude Code plugin** — a single installable package that brings all of the above into your AI tool at once. You install it once; it loads automatically in every subsequent session.

The key components:

| Component | What it is | Where it lives |
|-----------|-----------|----------------|
| **Skills** | Workflow knowledge modules that activate based on context | `skills/` |
| **Agents** | Specialized subagents you delegate tasks to | `agents/` |
| **Hooks** | Scripts that fire on tool events (edit, bash, stop, session start) | `hooks/`, `scripts/hooks/` |
| **Rules** | Always-on guidelines, organized by language | `rules/` |
| **Commands** | Slash commands that invoke workflows | `commands/` |
| **MCP configs** | Pre-configured integrations (GitHub, Supabase, Playwright, etc.) | `mcp-configs/` |

---

## A typical workflow with ECC

Here is what a feature implementation looks like with ECC installed:

1. **You start a session.** The `SessionStart` hook loads your project's memory context automatically.
2. **You ask ECC to plan a feature.** `/ecc:plan "Add OAuth"` delegates to the `planner` agent, which returns a phased implementation blueprint.
3. **You implement.** The `tdd-workflow` skill is active. The `code-reviewer` agent is available for review. Hooks run automatically after each file edit — TypeScript typechecks, format runs, console.log warnings appear.
4. **Before pushing.** `/security-scan` runs AgentShield — 102 static analysis rules against your hooks, agents, and settings files.
5. **When you stop.** The `Stop` hook captures patterns from the session into the continuous-learning system. Next session, those patterns are available as instincts.

---

## What ECC is not

- **Not a replacement for Claude Code.** ECC runs inside Claude Code (or Cursor, Codex, OpenCode). It enhances the harness; it does not replace it.
- **Not a model or AI system.** ECC is configuration, scripts, and workflow definitions — it does not touch the underlying LLM.
- **Not a rigid opinionated framework.** Every component is optional. Use the plugin install for everything, or copy only the rule folders you want. See [Install profiles](../reference/install-profiles.md).
- **Not locked to Claude Code.** Skills and rules are portable. The same `SKILL.md` files work in Codex, OpenCode, and Cursor. See [Harness portability](../concepts/harness-portability.md).

---

## Where to go next

- Build the mental model: [Key concepts](key-concepts.md)
- Get running now: [Quickstart](../getting-started/quickstart.md)
- Understand the components in depth: [Concepts](../concepts/agents.md)
