# Commands and agents

All ECC slash commands and agents at a glance.

---

## Using commands

**Plugin install** (namespaced):

```
/ecc:plan "Add user authentication"
/ecc:code-review
```

**Manual install** (short form):

```
/plan "Add user authentication"
/code-review
```

Use `/plugin list ecc@ecc` to see all available commands and agents in your current install.

---

## Core workflow commands

| Command | Description | Agent invoked |
|---------|-------------|--------------|
| `/ecc:plan` | Create a phased implementation plan for a feature | `planner` |
| `/code-review` | Quality, security, and correctness review | `code-reviewer` |
| `/build-fix` | Diagnose and fix build errors | `build-error-resolver` |
| `/refactor-clean` | Remove dead code and simplify | `refactor-cleaner` |
| `/security-scan` | Run AgentShield security audit | `security-reviewer` |
| `/quality-gate` | Run build, test, lint, typecheck, security gate | — |
| `/update-docs` | Sync documentation after code changes | `doc-updater` |
| `/update-codemaps` | Update code maps and dependency graphs | — |
| `/test-coverage` | Analyze test coverage | — |

---

## Language-specific commands

| Command | Language | Agent |
|---------|---------|-------|
| `/go-review` | Go code review | `go-reviewer` |
| `/go-test` | Go TDD workflow | — |
| `/go-build` | Fix Go build errors | `go-build-resolver` |
| `/python-review` | Python code review (PEP 8, type hints, security) | `python-reviewer` |

---

## Session and learning commands

| Command | Description |
|---------|-------------|
| `/sessions` | Browse session history |
| `/instinct-status` | View learned instincts with confidence scores |
| `/instinct-import <file>` | Import instincts from a file |
| `/instinct-export` | Export your instincts for sharing |
| `/evolve` | Cluster related instincts into a skill |
| `/prune` | Delete expired low-confidence instincts (30-day TTL) |
| `/learn` | Extract patterns from the current session |
| `/learn-eval` | Extract patterns with evaluation before saving |
| `/checkpoint` | Save verification state at a milestone |
| `/skill-create` | Generate skills from the current repo's git history |

---

## Loop and orchestration commands

| Command | Description |
|---------|-------------|
| `/loop-start` | Start a controlled agentic loop execution pattern |
| `/loop-status` | Inspect active loop status and checkpoints |
| `/model-route` | Route the current task to the appropriate model by complexity |
| `/harness-audit` | Audit harness reliability, eval readiness, and risk posture |
| `/pm2` | Auto-generate PM2 service lifecycle commands |

---

## Multi-agent commands

> **Note:** `multi-*` commands require the `ccg-workflow` runtime. Initialize with `npx ccg-workflow` before use.

| Command | Description |
|---------|-------------|
| `/multi-plan` | Multi-agent collaborative task decomposition |
| `/multi-execute` | Orchestrated multi-agent workflow execution |
| `/multi-backend` | Backend-focused multi-service orchestration |
| `/multi-frontend` | Frontend-focused multi-service orchestration |
| `/multi-workflow` | General multi-service development workflow |

---

## Setup commands

| Command | Description |
|---------|-------------|
| `/setup-pm` | Configure preferred package manager |

---

## Legacy command shims (opt-in only)

These commands are retired. Their workflows have moved to skills. The shims live in `legacy-command-shims/` and are not installed by default.

| Legacy command | Replacement |
|---------------|-------------|
| `/tdd` | `tdd-workflow` skill |
| `/e2e` | `e2e-testing` skill |
| `/eval` | `eval-harness` skill |
| `/verify` | `verification-loop` skill |
| `/orchestrate` | `dmux-workflows` or `multi-workflow` command |

---

## All agents (61 total)

### Core workflow agents

| Agent | Description | Model |
|-------|-------------|-------|
| `planner` | Feature implementation planning | opus |
| `architect` | System design and architecture decisions | opus |
| `tdd-guide` | Test-driven development enforcement | sonnet |
| `code-reviewer` | Quality and security review | opus |
| `security-reviewer` | Vulnerability analysis, OWASP Top 10 | opus |
| `refactor-cleaner` | Dead code removal and simplification | sonnet |
| `doc-updater` | Documentation sync after code changes | sonnet |
| `build-error-resolver` | Build failure diagnosis and fix | sonnet |
| `e2e-runner` | Playwright E2E test execution | sonnet |
| `docs-lookup` | Documentation and API reference lookup | haiku |
| `loop-operator` | Autonomous loop execution | sonnet |
| `harness-optimizer` | Harness configuration tuning | sonnet |
| `chief-of-staff` | Communication triage and draft generation | sonnet |

### Language and framework reviewers

| Agent | Language / Framework | Model |
|-------|---------------------|-------|
| `typescript-reviewer` | TypeScript / JavaScript | opus |
| `python-reviewer` | Python | sonnet |
| `go-reviewer` | Go | sonnet |
| `go-build-resolver` | Go build errors | sonnet |
| `rust-reviewer` | Rust | opus |
| `rust-build-resolver` | Rust build errors | sonnet |
| `cpp-reviewer` | C++ | opus |
| `cpp-build-resolver` | C++ build errors | sonnet |
| `fsharp-reviewer` | F# functional code | opus |
| `java-reviewer` | Java / Spring Boot | opus |
| `java-build-resolver` | Java / Maven / Gradle | sonnet |
| `kotlin-reviewer` | Kotlin / Android / KMP | opus |
| `kotlin-build-resolver` | Kotlin / Gradle | sonnet |
| `pytorch-build-resolver` | PyTorch / CUDA training errors | sonnet |
| `mle-reviewer` | Production ML pipeline review | opus |
| `database-reviewer` | Database / Supabase queries | opus |
| `harmonyos-app-resolver` | HarmonyOS / ArkTS development | sonnet |

---

## Invoke agents by name

For agents without a dedicated command, mention the agent by name in your request:

```
Using the fsharp-reviewer agent, review the changes in src/Parser.fs.

Using the mle-reviewer agent, check the data pipeline in pipelines/training.py for quality issues.
```
