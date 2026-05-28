# Write an agent

Add a new specialized subagent to ECC.

An agent handles a specific bounded task with limited tool access. Write an agent when you need a specialist — a focused executor, not a knowledge module. For domain knowledge, write a [skill](write-a-skill.md) instead.

---

## Prerequisites

- ECC repo cloned and `npm install` run
- A clear, bounded task in mind (not "general assistant" — something specific like "Kotlin code reviewer" or "database migration generator")
- Familiarity with [Concepts: Agents](../concepts/agents.md)

---

## 1. Name your agent

Use lowercase with hyphens. Name it by what it does, not what it is.

| ❌ | ✅ |
|---|---|
| `kotlin-agent` | `kotlin-reviewer` |
| `database-helper` | `database-reviewer` |
| `build-agent` | `rust-build-resolver` |

Convention for common types:
- `*-reviewer` — code review agents
- `*-build-resolver` — build error diagnosis agents
- `*-runner` — task execution agents

---

## 2. Create the agent file

```bash
cd ECC
touch agents/your-agent-name.md
```

---

## 3. Write the agent file

Template:

```markdown
---
name: your-agent-name
description: One sentence describing what this agent does and when to invoke it.
tools: ["Read", "Grep", "Glob"]
model: sonnet
---

You are a [role description]. You specialize in [domain].

## Your task

[Precise description of what the agent should do when invoked.]

## Process

1. [Step one]
2. [Step two]
3. [Step three]

## Output format

[Exactly how the agent should format its response. Be specific.]

## What you must not do

- [Boundary 1]
- [Boundary 2]
```

---

## 4. Choose the right tools

Grant only the tools the agent needs. Less is better — it reduces scope and cost.

| Task type | Tools needed |
|-----------|-------------|
| Code review | `Read`, `Grep`, `Glob` |
| Build error resolution | `Read`, `Grep`, `Glob`, `Bash` |
| Documentation update | `Read`, `Write`, `Grep`, `Glob` |
| Security audit | `Read`, `Grep`, `Glob` |
| Test runner | `Bash`, `Read` |

Available tools: `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `WebFetch`, `Task`.

> **Warning:** Do not grant `Write` or `Edit` to review agents. A reviewer that can edit files is a bug risk, not a feature.

---

## 5. Choose the right model

| Task | Model | Reason |
|------|-------|--------|
| Code review, security audit, architecture | `opus` | Deep analysis |
| Build fixes, test writing, refactoring | `sonnet` | Good quality, lower cost |
| File lookup, pattern search, simple tasks | `haiku` | Fast and cheap |

Match the model to the task. An exploration agent on `opus` is expensive and slow; a security reviewer on `haiku` is inadequate.

---

## 6. Write an effective description

The `description` field is how Claude Code decides whether to route a task to this agent. It must clearly describe:
1. What the agent does
2. When to invoke it

```yaml
# ✅ Good
description: Reviews Kotlin code for correctness, Android/KMP idioms, coroutine safety, and Gradle configuration issues

# ❌ Bad — too vague
description: Helps with Kotlin development
```

---

## 7. Test the agent locally

Copy the agent to your user agents directory:

```bash
cp agents/your-agent-name.md ~/.claude/agents/
```

Restart Claude Code and invoke the agent by name: "Using the your-agent-name agent, [task description]."

Verify:
- The agent uses only the tools you granted
- The agent stays within its defined scope
- The output format matches what you specified
- The agent exits cleanly when its task is done

---

## 8. Check for quality

Before submitting:

- [ ] `name` is unique and follows the naming convention
- [ ] `description` is specific enough to route correctly
- [ ] `tools` list is minimal — no unnecessary tools
- [ ] `model` is appropriate for the task complexity
- [ ] The agent has a clear output format specified
- [ ] The agent has explicit "what you must not do" boundaries
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] The agent handles the case where it can't complete the task (returns an error, doesn't hallucinate)

---

## 9. Run tests and submit

```bash
node tests/run-all.js
git checkout -b feat/agent-your-agent-name
git add agents/your-agent-name.md
git commit -m "feat: add your-agent-name agent"
git push -u origin feat/agent-your-agent-name
```

---

## Agent vs. skill: which to write?

| Use an agent when... | Use a skill when... |
|---------------------|---------------------|
| The task is a bounded execution (review this code, fix this build error) | You're encoding domain knowledge (patterns, idioms, checklists) |
| The task needs a specialist focus | The knowledge should be active across many tasks |
| The task should be isolated from the main context | The knowledge should be injected into the main context |
| You want to scope tool access tightly | Tool access isn't the concern |

Most ECC contributions are skills. Agents are for specialized, bounded task execution.

---

## See also

- [Concepts: Agents](../concepts/agents.md) — how agents work in depth
- [Guide: Write a skill](write-a-skill.md) — for domain knowledge vs. task execution
- [Reference: Commands and agents](../reference/commands.md) — full agent list
