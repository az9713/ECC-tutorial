# Write a skill

Add new domain knowledge to ECC as a reusable skill.

A skill is a `SKILL.md` file that encodes workflow steps, patterns, or domain expertise. A good skill saves every future session from having to explain the same context.

---

## Prerequisites

- ECC repo cloned and `npm install` run
- A clear domain in mind: one skill = one focused topic
- Familiarity with [Concepts: Skills](../concepts/skills.md)

---

## 1. Name your skill

Use lowercase kebab-case. Be specific. The name appears in skill lists and is used for routing.

| ❌ Too generic | ✅ Specific |
|--------------|-----------|
| `backend` | `django-patterns` |
| `testing` | `golang-testing` |
| `deployment` | `kubernetes-health-checks` |

---

## 2. Create the skill directory and file

```bash
cd ECC
mkdir -p skills/your-skill-name
touch skills/your-skill-name/SKILL.md
```

---

## 3. Write the SKILL.md

Use this template:

```markdown
---
name: your-skill-name
description: One sentence describing the domain and when this skill should activate.
origin: ECC
---

# Skill Title

Brief overview: what this skill covers and why it exists.

## When to activate

List the specific situations where this skill should be active. Be precise — vague descriptions cause activation in the wrong contexts.

- When working with [technology/framework X]
- When implementing [pattern Y]
- When the task involves [scenario Z]

## Core patterns

[The main content of the skill. Include:]
- Step-by-step workflows
- Decision criteria ("use X when Y, use Z when W")
- Code examples in fenced blocks
- Common pitfalls to avoid

## [Additional sections as needed]

Organize into sections by task type. Keep each section focused.

## Quick reference

[Optional: a table or checklist for fast lookup during implementation]
```

---

## 4. Write effective frontmatter

The `description` field is the most important field. It controls when Claude Code activates the skill.

```yaml
# ✅ Good: specific, includes domain terms
description: Django ORM patterns — select_related, prefetch_related, custom managers, query optimization

# ❌ Bad: too vague
description: Database patterns and optimization tips
```

Test your description by asking: "If Claude Code sees this one sentence, will it know to activate this skill when working with Django ORM queries?" If the answer is "not reliably", rewrite it.

---

## 5. Test the skill locally

Copy the skill to your user skills directory:

```bash
mkdir -p ~/.claude/skills/ecc
cp -r skills/your-skill-name ~/.claude/skills/ecc/
```

Restart Claude Code and work on a task in the skill's domain. Verify:
- The skill's patterns appear in Claude Code's responses
- The skill doesn't activate for unrelated tasks

---

## 6. Check for quality

Before submitting, confirm:

- [ ] `name` in frontmatter matches the directory name
- [ ] `description` is one sentence, includes key domain terms
- [ ] Content has at least one concrete workflow (not just general advice)
- [ ] Code examples are in fenced blocks with a language tag
- [ ] No "TBD" or "coming soon" sections — every section is complete
- [ ] The skill is focused on one domain (not trying to cover three topics)
- [ ] No hardcoded secrets, API keys, or personal credentials in examples

---

## 7. Run the tests

```bash
node tests/run-all.js
```

All tests must pass before submitting a PR.

---

## 8. Submit a PR

```bash
git checkout -b feat/skill-your-skill-name
git add skills/your-skill-name/
git commit -m "feat: add your-skill-name skill"
git push -u origin feat/skill-your-skill-name
```

PR description should include:
- What the skill covers
- When it activates
- Why it belongs in the curated ECC collection (vs. a personal skill)

---

## Skill content guidelines

**Write for activation, not comprehensiveness.** A skill that tries to cover all of Django will be long, vague, and activate when it shouldn't. A skill that covers `Django ORM query optimization` will be short, specific, and useful.

**Lead with the workflow, not the theory.** "Here's how to do X" before "here's why X works."

**Include the anti-patterns.** What to avoid is as valuable as what to do.

**Use real code examples.** Abstract patterns are harder to apply than concrete examples.

**State the conditions.** "Use `select_related` for ForeignKey, `prefetch_related` for ManyToMany" is better than "use the right query method for the relationship type."

---

## Skill placement policy

Where a skill lives depends on who maintains it:

| Location | For |
|----------|-----|
| `skills/` in the ECC repo | Curated, maintained by ECC contributors |
| `~/.claude/skills/ecc/` | Your personal installed ECC skills |
| `~/.claude/skills/` | Personal skills not part of ECC |

If you're contributing to ECC, put it in `skills/`. If it's personal or org-specific, put it in `~/.claude/skills/`.

See [Skill placement policy](../SKILL-PLACEMENT-POLICY.md) for full details.

---

## See also

- [Concepts: Skills](../concepts/skills.md) — how skills work
- [Skill development guide](../SKILL-DEVELOPMENT-GUIDE.md) — comprehensive writing guide with examples gallery
- [Guide: Write an agent](write-an-agent.md) — for task executors vs. knowledge modules
