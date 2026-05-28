# Agents

Agents are specialized subagents you delegate bounded tasks to. Each agent has a focused role, limited tool access, and a model tuned for its workload.

---

## What problem agents solve

Without agents, every task runs in your main session context. Reviewing 20 files, running a security audit, and diagnosing a build failure all accumulate in the same conversation. Context grows, costs rise, and the model's focus degrades.

Agents solve this by handling delegated work in an isolated context. The agent reads what it needs, does its job, and returns a result. Your main session only receives the conclusion — not the intermediate tool calls.

---

## How agents work

1. You invoke an agent (explicitly via `Task` tool delegation, or implicitly via a command like `/code-review`).
2. Claude Code spawns the agent in a child context with a scoped system prompt and limited tools.
3. The agent performs its task using only the tools it was granted.
4. The agent returns its result to your main session.
5. The child context is discarded.

The result: a `code-reviewer` that reads 15 files only adds one message to your context — the review — not the 15 `Read` tool calls.

---

## Agent format

Agents are Markdown files in `agents/` with YAML frontmatter:

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

You are a senior code reviewer with expertise in security, performance, and maintainability.

## Review process

1. Read the changed files
2. Check for security vulnerabilities (OWASP Top 10)
3. Identify performance issues
4. Flag style violations
5. Return structured findings

## Output format

Return findings as: [SEVERITY] file:line — description
```

Key fields:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique identifier used for delegation routing |
| `description` | string | Used by Claude Code for automatic routing decisions |
| `tools` | array | Exactly the tools this agent may use — no others |
| `model` | string | `opus`, `sonnet`, or `haiku` — choose based on task complexity |

---

## Available agents

ECC ships 61 agents across several categories:

### Core workflow

| Agent | Description | Model |
|-------|-------------|-------|
| `planner` | Feature implementation planning | opus |
| `architect` | System design decisions | opus |
| `tdd-guide` | Test-driven development enforcement | sonnet |
| `code-reviewer` | Quality and security review | opus |
| `security-reviewer` | Vulnerability analysis, OWASP Top 10 | opus |
| `refactor-cleaner` | Dead code cleanup | sonnet |
| `doc-updater` | Documentation sync after code changes | sonnet |
| `build-error-resolver` | Build failure diagnosis and fix | sonnet |
| `e2e-runner` | Playwright E2E test execution | sonnet |
| `docs-lookup` | Documentation and API reference lookup | haiku |

### Language reviewers

| Agent | Language / Framework |
|-------|---------------------|
| `typescript-reviewer` | TypeScript / JavaScript |
| `python-reviewer` | Python |
| `go-reviewer` | Go |
| `go-build-resolver` | Go build errors |
| `rust-reviewer` | Rust |
| `rust-build-resolver` | Rust build errors |
| `cpp-reviewer` | C++ |
| `cpp-build-resolver` | C++ build errors |
| `java-reviewer` | Java / Spring Boot |
| `java-build-resolver` | Java / Maven / Gradle |
| `kotlin-reviewer` | Kotlin / Android / KMP |
| `kotlin-build-resolver` | Kotlin / Gradle |
| `fsharp-reviewer` | F# functional code |
| `pytorch-build-resolver` | PyTorch / CUDA training errors |
| `mle-reviewer` | Production ML pipeline review |
| `database-reviewer` | Database / Supabase queries |
| `harmonyos-app-resolver` | HarmonyOS / ArkTS development |

### Operations and orchestration

| Agent | Description |
|-------|-------------|
| `chief-of-staff` | Communication triage and draft generation |
| `loop-operator` | Autonomous loop execution |
| `harness-optimizer` | Harness config tuning |

---

## Model selection for agents

| Task type | Recommended model | Reason |
|-----------|------------------|--------|
| Complex reasoning (architecture, security audit) | `opus` | Deep analysis needed |
| Day-to-day coding (review, test writing, build fix) | `sonnet` | Good quality, lower cost |
| Exploration (file reading, search, lookup) | `haiku` | Fast, cheap, sufficient |

---

## Interaction with other components

- **Commands** invoke agents as their execution backend (e.g., `/code-review` → `code-reviewer` agent)
- **Skills** can reference agents in their workflow steps
- **Rules** define when to delegate (see `rules/common/agents.md`)
- **Hooks** do not spawn agents — hooks run synchronously and must stay fast

---

## Common gotchas

**The agent isn't doing what I expected.** Check the agent's `description` field — that's what Claude Code uses for routing. A vague description leads to the wrong agent being selected.

**The agent can't find a file.** The agent's tools list controls what it can do. If `Read` is not in the list, the agent can't read files. Check the frontmatter.

**The agent is too slow.** If the model is `opus` but the task is simple (file lookup, pattern search), change it to `haiku`. Speed and cost improve dramatically.

**I need to invoke an agent that has no command.** Describe the task and mention the agent by name: "Using the fsharp-reviewer agent, review the changes in src/Parser.fs."

---

## See also

- [Concepts: Skills](skills.md) — the primary workflow surface (agents handle delegation, skills handle domain knowledge)
- [Guide: Write an agent](../guides/write-an-agent.md) — create a new agent
- [Reference: Commands and agents](../reference/commands.md) — full agent list with descriptions
