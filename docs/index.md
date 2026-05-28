# ECC Documentation

ECC is a harness-native operator system for agentic work — production-ready agents, skills, hooks, rules, and MCP configs that work across Claude Code, Cursor, Codex, OpenCode, and other AI coding tools. Install it once, get a complete agentic workflow system built from 10+ months of intensive daily use.

---

> **New here?** Start with [What is ECC?](overview/what-is-this.md), then follow the [Quickstart](getting-started/quickstart.md) to get running in under 5 minutes.

---

## Documentation

| Section | What's inside |
|---------|--------------|
| [Overview: What is ECC?](overview/what-is-this.md) | Mental model, architecture, why ECC exists |
| [Key Concepts](overview/key-concepts.md) | Glossary — every term defined |
| [Prerequisites](getting-started/prerequisites.md) | What you need before installing |
| [Quickstart](getting-started/quickstart.md) | Install and run your first command in <5 min |
| [Onboarding](getting-started/onboarding.md) | Zero-to-hero walkthrough for complete newcomers |
| [Concepts: Agents](concepts/agents.md) | Specialized subagents — what they are and when to use them |
| [Concepts: Skills](concepts/skills.md) | The primary workflow surface — how skills activate and how to use them |
| [Concepts: Hooks](concepts/hooks.md) | Event-driven automations — hook system, runtime controls |
| [Concepts: Rules](concepts/rules.md) | Always-on guidelines — common + language-specific |
| [Concepts: Harness Portability](concepts/harness-portability.md) | How ECC works across Claude Code, Cursor, Codex, and OpenCode |
| [Guide: Install language rules](guides/install-rules.md) | Add TypeScript, Python, Go, or other language rule packs |
| [Guide: Write a skill](guides/write-a-skill.md) | Contribute a new skill to ECC |
| [Guide: Write an agent](guides/write-an-agent.md) | Contribute a new subagent to ECC |
| [Guide: Configure hooks](guides/configure-hooks.md) | Tune hook behavior, profiles, and per-hook disables |
| [Guide: Token optimization](guides/token-optimization.md) | Reduce costs and extend session quality |
| [Guide: Multi-harness setup](guides/multi-harness-setup.md) | Set up ECC in Cursor, Codex, OpenCode, or Zed |
| [Reference: Environment variables](reference/env-vars.md) | Every ECC env var — purpose, default, effect |
| [Reference: Commands and agents](reference/commands.md) | All slash commands and agents at a glance |
| [Reference: Install profiles](reference/install-profiles.md) | minimal, core, full — what each installs |
| [Troubleshooting](troubleshooting/common-issues.md) | Common failures and exact fixes |

---

## Existing architecture docs

| Doc | What's inside |
|-----|--------------|
| [Cross-harness architecture](architecture/cross-harness.md) | Portability model, harness adapter pattern |
| [Skill development guide](SKILL-DEVELOPMENT-GUIDE.md) | In-depth guide to writing production-quality skills |
| [Skill placement policy](SKILL-PLACEMENT-POLICY.md) | Where curated vs. generated skills live |
| [Hermes setup guide](HERMES-SETUP.md) | Operator shell setup for advanced users |
| [Selective install architecture](SELECTIVE-INSTALL-ARCHITECTURE.md) | Manifest-driven install pipeline internals |
