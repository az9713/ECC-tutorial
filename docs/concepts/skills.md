# Skills

Skills are workflow knowledge modules — the primary workflow surface in ECC. They encode domain expertise, step-by-step processes, and decision trees. Skills activate based on context; you rarely invoke them manually.

---

## What problem skills solve

Without skills, every task starts from zero. Claude Code is a capable general reasoner, but it doesn't know that your team requires 80% test coverage, that Django models should use `select_related` to avoid N+1 queries, or that the right way to handle OAuth in your stack is to use the `python-social-auth` library.

Skills encode that accumulated knowledge. When you're working on a Django view, the `django-patterns` skill is active. When you write tests, the `tdd-workflow` skill enforces red-green-refactor. You get consistent, context-aware behavior without prompting.

---

## How skills work

Skills activate automatically when:
- The task matches the skill's domain (via the `description` field and context detection)
- A command references a skill explicitly
- An agent needs domain knowledge for its task
- You invoke a skill by name directly

Once active, the skill's content is injected into the session context. The skill might provide step-by-step workflow, code examples, decision criteria, or checklists.

---

## Skill format

Every skill is a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: tdd-workflow
description: Test-driven development workflow — write failing tests first, implement, then refactor
origin: ECC
---

# TDD Workflow

## When to activate

Activate when the task involves writing new code, fixing bugs, or refactoring. Always write the test before the implementation.

## The cycle

### 1. RED — write a failing test

Define the interface first. Write a test that expresses the desired behavior. Run it — it must fail.

### 2. GREEN — minimal implementation

Write the minimum code to make the test pass. Don't refactor yet.

### 3. IMPROVE — refactor

Clean up the implementation. Tests must still pass after refactoring.

## Coverage requirement

Aim for 80%+ coverage on new code. Run coverage:

```bash
npm run test:coverage
```

## What counts as a test

Unit tests for business logic. Integration tests for API routes. E2E tests for critical user flows.
```

Key frontmatter fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique skill identifier, kebab-case |
| `description` | Yes | Used for context-based activation matching |
| `origin` | Recommended | `ECC` for bundled skills; your org name for custom skills |

---

## The skill library

ECC ships 246 skills across six categories. A selection:

### Workflow and process

| Skill | What it encodes |
|-------|----------------|
| `tdd-workflow` | Red-green-refactor TDD methodology |
| `eval-harness` | Verification loop evaluation patterns |
| `verification-loop` | Build, test, lint, typecheck, security gate |
| `search-first` | Research-before-coding workflow |
| `strategic-compact` | Context management and compaction timing |
| `continuous-learning-v2` | Instinct-based session learning |
| `autonomous-loops` | Sequential pipelines, PR loops, DAG orchestration |

### Security

| Skill | What it encodes |
|-------|----------------|
| `security-review` | OWASP Top 10 checklist, vulnerability patterns |
| `security-scan` | AgentShield integration for config scanning |
| `plankton-code-quality` | Write-time quality enforcement |

### Framework patterns (backend)

| Skill | Framework |
|-------|-----------|
| `django-patterns` | Django models, views, ORM patterns |
| `django-tdd` | Django TDD with pytest-django |
| `django-security` | Django security best practices |
| `springboot-patterns` | Java Spring Boot architecture |
| `quarkus-patterns` | Java Quarkus patterns |
| `laravel-patterns` | PHP Laravel architecture |

### Framework patterns (frontend)

| Skill | Framework |
|-------|-----------|
| `frontend-patterns` | React, Next.js component patterns |
| `nextjs-turbopack` | Next.js 16+ with Turbopack |
| `frontend-slides` | HTML presentation builder |

### Language patterns

| Skill | Language |
|-------|---------|
| `golang-patterns` | Go idioms and best practices |
| `golang-testing` | Go testing, benchmarks, table-driven tests |
| `python-patterns` | Python idioms, type hints |
| `python-testing` | pytest patterns |
| `cpp-coding-standards` | C++ Core Guidelines |
| `perl-patterns` | Modern Perl 5.36+ |
| `swift-actor-persistence` | Thread-safe Swift with actors |
| `swift-concurrency-6-2` | Swift 6.2 Approachable Concurrency |

### Infrastructure and operations

| Skill | What it encodes |
|-------|----------------|
| `deployment-patterns` | CI/CD, Docker, health checks, rollbacks |
| `docker-patterns` | Docker Compose, networking, volumes |
| `database-migrations` | Migration patterns for Prisma, Drizzle, Django, Go |
| `api-design` | REST API design, pagination, error responses |
| `mle-workflow` | Production ML data contracts, evals, deployment |
| `mcp-server-patterns` | Build MCP servers with Node/TypeScript SDK |

---

## Skills vs. agents vs. commands

| Component | Activation | Best for |
|-----------|-----------|----------|
| **Skill** | Automatic, context-based | Encoding domain knowledge, workflow steps |
| **Agent** | Explicit delegation | Bounded tasks needing specialist focus |
| **Command** | User-triggered | On-demand workflow invocation |

Skills and agents are complementary. A skill gives the agent context-specific knowledge; the agent executes the bounded task.

---

## Skill placement

| Location | Use for |
|----------|---------|
| `skills/` in the ECC repo | Curated, production-quality skills shipped with ECC |
| `~/.claude/skills/ecc/` | Your installed ECC skills |
| `~/.claude/skills/` | Your personal skills |
| `.claude/skills/` | Project-local skills |

Skills generated by `/skill-create` or imported by `/instinct-import` go under `~/.claude/skills/`, not into the ECC repo. See [Skill placement policy](../SKILL-PLACEMENT-POLICY.md).

---

## Continuous learning: skills that improve over time

ECC's continuous-learning-v2 system creates skills from your own sessions:

1. The `pre:observe` hook captures tool use patterns during your session.
2. When you stop, patterns are evaluated and stored as instincts.
3. `/evolve` clusters related instincts into a new skill.
4. Next session, the derived skill is active.

Manage instincts:

```
/instinct-status        # view learned instincts with confidence scores
/instinct-import <file> # import from a teammate
/instinct-export        # export yours for sharing
/evolve                 # cluster into skills
/prune                  # delete low-confidence or expired instincts
```

---

## Common gotchas

**A skill isn't activating.** Check the `description` field in the skill's frontmatter. The description is used for matching. If it's vague or doesn't mention the language/framework, it won't activate in the right context.

**Two skills conflict.** When multiple skills are active, the more specific one takes precedence. If both `golang-patterns` and `frontend-patterns` seem active on a Go+HTMX project, clarify your context at the start of the session.

**A skill is too broad.** Skills work best when scoped to one domain. If a skill covers testing AND deployment AND security, it activates in the wrong contexts and pollutes focus. Split it.

---

## See also

- [Guide: Write a skill](../guides/write-a-skill.md)
- [Skill development guide](../SKILL-DEVELOPMENT-GUIDE.md)
- [Concepts: Agents](agents.md)
