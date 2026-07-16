# Why "Supply-Chain Watch" kept failing — a full explanation

**Repo:** az9713/ECC-tutorial · **Investigated:** 2026-07-16 · **Status:** ✅ Fixed and verified

This document assumes no prior git/GitHub knowledge. Every git/GitHub concept is explained
where it first matters, not just listed in a glossary — so you understand *why* each piece
existed, not just *what* it's called.

---

## 1. The cast of characters (background you need first)

- **git** is the tool that tracks versions of your code on your own computer. **GitHub** is a
  website that hosts a copy of that history so other people (and robots) can see it, propose
  changes to it, and run automated checks against it.
- A **repository** ("repo") is one project's full history — every file, every past version.
  `az9713/ECC-tutorial` is this repo's address on GitHub.
- A **commit** is one saved snapshot of changes, with a message describing it. Commits are
  identified by a hash like `097d74f`.
- The **main branch** is the "official" line of history — what the project actually ships.
  People don't usually edit it directly; they propose changes and merge them in.
- A **branch** is a parallel line of history you create to try a change without touching
  `main` until it's ready.
- A **pull request (PR)** is GitHub's proposal mechanism: "here's a branch with some commits,
  please review and merge it into `main`." A PR can have automated checks attached to it, and
  reviewers, and a merge button.
- **Merging** a PR replays its commits onto `main`, making the change official.
- **GitHub Actions** is GitHub's built-in robot: it runs scripts ("workflows") automatically in
  response to events — someone opening a PR, pushing a commit, or just the clock ticking. Each
  workflow is one YAML file in `.github/workflows/`. A workflow contains **jobs** (things that
  run in parallel, each on a fresh virtual machine), and each job contains **steps** (commands
  run in order).
- A workflow's `on:` section says what triggers it — `pull_request` (runs on every PR),
  `push`, or `schedule` (runs on a timer, using cron syntax, with nobody around to watch it).
- **Branch protection rules** are settings on `main` saying "a PR can't merge until checks
  X, Y, Z pass." These are called **required status checks**. Any *other* check can fail and
  GitHub will still let the PR merge — this distinction turns out to be the crux of what
  happened here.
- **Dependabot** is a GitHub robot that watches your dependency files, notices when a newer
  version of a library exists, and opens a PR bumping the version for you.
- A **lockfile** (`package-lock.json` for npm, `yarn.lock` for Yarn) is a file that pins the
  *exact* version of every dependency and sub-dependency, so two people (or two machines)
  installing "the same project" get byte-for-byte the same packages. `package.json` says "I
  want commander ^15", which could match many versions; the lockfile says "I got commander
  15.0.0 specifically." Both files are supposed to always agree.
- `npm install` and `npm ci` both install dependencies, but differently:
  - `npm install` will *update the lockfile* to match `package.json` if they've drifted apart.
    It's forgiving.
  - `npm ci` ("clean install") is strict: it refuses to run at all if `package.json` and the
    lockfile disagree. It's designed for automated environments (like CI) precisely so a
    silent mismatch can never sneak through unnoticed.

With that vocabulary, here's what actually happened.

---

## 2. What "Supply-Chain Watch" is and why it exists

`.github/workflows/supply-chain-watch.yml` is a security **watchdog**, not a test suite. Its
`on:` trigger is `schedule: cron: '17 */6 * * *'` — it runs automatically every 6 hours,
forever, whether or not anyone is looking. Each run:

1. Installs dependencies with `npm ci --ignore-scripts` (the strict installer, and
   `--ignore-scripts` means "don't let any package run arbitrary code during install" — a
   common trick malicious packages use).
2. Runs `npm audit signatures` (checks that packages are cryptographically signed by the real
   npm registry — catches tampering) and `npm audit --audit-level=high` (fails if any
   dependency has a *high or critical* severity known vulnerability).
3. Runs a custom script, `scripts/ci/scan-supply-chain-iocs.js`, that checks the repo's
   dependency tree against a hard-coded list of **known-malicious package versions** — real
   packages that were compromised in actual 2025 npm supply-chain attacks (this is IOC =
   "indicator of compromise" scanning, the same concept security teams use for malware).
4. Uploads a JSON report as a build **artifact** (a downloadable file attached to the run).

It exists because someone (you, or whoever set this repo up) deliberately hardened it against
the wave of npm supply-chain attacks — where attackers compromise a popular package and every
project that installs it gets infected. This workflow has been present since the repo's first
substantial commit (`c5ee573`, 2026-05-28), alongside a whole `scripts/ci/` and `tests/ci/`
toolkit. It is a real, intentional piece of security infrastructure.

---

## 3. The issues found

There were three layered issues — a visible symptom, its direct cause, and a systemic gap that
let the direct cause slip through unnoticed. All three matter for a full picture.

### Issue A (the symptom): the watchdog failed every single run for three weeks

**82 consecutive failures**, one every 6 hours, from **2026-06-26 04:42 UTC** through
**2026-07-16**. Before that, all 18 prior runs had succeeded. The weekly **"Scheduled
Maintenance"** workflow's Security Audit job — which also runs `npm ci` — was failing for the
same reason starting 2026-06-29.

Every failure died at the very first real step, `npm ci`, with:

```
npm error `npm ci` can only install packages when your package.json and
package-lock.json are in sync. Please update your lock file with `npm install`.
npm error Invalid: lock file's markdownlint-cli@0.48.0 does not satisfy markdownlint-cli@0.49.1
... (16 more mismatched package versions)
```

Because it failed at step 1 of 8, **none of the actual security scanning ever ran** — not the
signature check, not the vulnerability audit, not the malicious-package scan. The watchdog
wasn't *reporting* a security problem; it was simply unable to start its job at all, for three
weeks, silently.

### Issue B (the direct cause): `package.json` and `package-lock.json` disagreed

Dependabot opened **PR #12**, titled "bump the minor-and-patch group across 1 directory with 3
updates," which bumped three devDependency version ranges in `package.json`. The
auto-merge workflow (see Issue C) merged it on **2026-06-26 at 02:35 UTC**. Looking at exactly
which files that PR changed:

```
package.json
yarn.lock
```

**`package-lock.json` is not in that list.** Dependabot updated `package.json` and one
lockfile (`yarn.lock`), but never touched the other lockfile the repo also keeps
(`package-lock.json`). From that moment on, the two files disagreed, and anything running
strict `npm ci` against `main` — the two scheduled security workflows — broke immediately and
stayed broken, because nobody was watching a cron job's output the way people watch a PR.

### Issue C (the systemic gap): the break was actually caught immediately — and merged anyway

This is the part that explains *how* Issue B was even possible, and it's worth understanding
in git/GitHub terms because it's the real lesson here.

When Dependabot opened PR #12, GitHub Actions automatically ran the repo's normal `pull_request`
-triggered checks against it — including a **test matrix** job named "Test," which tries
installing and testing the project with four different package managers (`npm`, `yarn`, `pnpm`,
`bun`) across multiple OSes and Node versions. Fetching that PR's own CI results directly from
GitHub shows every single "Test (…, npm)" job **failed**, with the exact `npm ci`
lockfile-mismatch error shown above. The break was visible, in red, on the PR itself, before it
ever merged.

So why did it merge anyway? Two things combined:

1. This repo's branch protection settings only list **`Lint`** and **`Security Scan`** as
   *required* status checks on `main`. The big cross-package-manager "Test" matrix runs and
   reports its results, but GitHub doesn't block a merge on it — it's informational, not
   required (`required_status_checks.contexts` = `["Lint", "Security Scan"]`).
2. A workflow called `dependabot-auto-merge.yml` watches for PRs opened by the Dependabot bot,
   and for low-risk "minor" or "patch" version bumps (as opposed to major version bumps, which
   need a human), it runs `gh pr merge --auto --squash`. That `--auto` merge waits only for
   *required* checks to go green — Lint and Security Scan — and merges the instant they do,
   completely blind to the (failing, but non-required) Test matrix sitting right next to them.

So the sequence was: Dependabot bumps versions → the lockfile silently desyncs → the Test
matrix correctly screams about it → nobody has to look, because Test isn't required → Lint and
Security Scan pass (they don't run `npm ci`) → the auto-merge bot merges the PR anyway → `main`
now has a broken lockfile → every future strict `npm ci` against `main` fails forever, with no
PR and no reviewer in the loop to notice.

---

## 4. The fix, step by step

The goal was the smallest, safest change that actually stops the failures — not a rewrite of
the repo's automation. Everything below happened outside the normal editor, using `git` and
GitHub's `gh` command-line tool, because the target was a *remote* GitHub repository, not a
local project folder.

1. **Cloned the repo** (`gh repo clone az9713/ECC-tutorial`) — downloaded a full local copy so
   changes could be made and tested before anything touched GitHub.
2. **Regenerated the lockfile**: `npm install --package-lock-only --ignore-scripts`. This
   specific flag combination tells npm "resolve `package.json` and rewrite
   `package-lock.json` to match it — but don't touch `node_modules`, don't run any package's
   install scripts, don't touch anything else." It's the narrowest possible way to fix a
   drifted lockfile.
3. **Verified the fix locally** before touching GitHub at all:
   - `npm ci --ignore-scripts --dry-run` → confirmed the two files now agree.
   - `npm audit --audit-level=high` → confirmed there's still no high/critical vulnerability
     (there is one *moderate* one, in `js-yaml`, which is below the workflow's failure
     threshold and not something this fix needed to address).
4. **Created a new branch** (`git checkout -b fix/sync-package-lock`) — rather than committing
   straight to `main`, which is exactly the discipline that was missing for Dependabot's own
   change. Committed just the one changed file, with a message explaining the "why" (Dependabot
   PR #12, three weeks of failures) so anyone reading `git log` later understands the
   reasoning without needing this document.
5. **Pushed the branch and opened a pull request** (`gh pr create`) — `#21` — with a
   description of the problem, cause, and verification steps, so it reads the same way a
   human-authored fix would for anyone reviewing it later.
6. **Attempted a direct merge and was correctly blocked**: `gh pr merge --squash` refused,
   because — as explained above — this repo's branch protection requires the `Lint` and
   `Security Scan` checks to pass first. This is the protection working as intended, just as
   it should have for PR #12's *Test* checks (had they been required).
7. **Enabled auto-merge instead** (`gh pr merge --auto --squash --delete-branch`) and waited:
   once Lint and Security Scan finished passing on the fix PR itself, GitHub merged it
   automatically and deleted the temporary branch. `gh pr view --json state` confirmed
   `MERGED`.
8. **Manually triggered the watchdog to prove the fix works**, using
   `gh workflow run supply-chain-watch.yml` — this uses the workflow's `workflow_dispatch`
   trigger, a manual "run it right now" button that supplements its normal 6-hour timer, useful
   exactly for verifying a fix without waiting for the clock. The run
   ([29485633645](https://github.com/az9713/ECC-tutorial/actions/runs/29485633645)) completed
   with conclusion `success`.

At no point was branch protection bypassed, no required check was skipped, and nothing was
force-pushed — the fix went through the exact same PR process any human contributor would use.

---

## 5. What's gained, and what's *not* fixed

**Gained:**
- The watchdog (and Scheduled Maintenance) are green again, immediately, with zero behavior
  change to the actual project code — only `package-lock.json` changed.
- Security monitoring is no longer blind. From now until the next scheduled run, dependencies
  are actually being checked against the IOC list and vulnerability advisories again.
- The fix is minimal and reversible: if it caused any unexpected problem, reverting it is a
  one-line lockfile change.

**Not fixed — this is the important part:**

This was a *symptom* fix, not a *systemic* fix. Issue C (the auto-merge/required-checks gap)
is still exactly as it was. Nothing stops the *next* Dependabot PR from doing precisely the
same thing: bumping `package.json` and `yarn.lock`, leaving `package-lock.json` behind, having
the Test matrix scream about it correctly, and having the auto-merge bot merge it anyway
because Test still isn't a required check. Branch protection rules and the auto-merge workflow
were deliberately left unchanged — that's a more consequential, judgment-call change (it
affects every future PR, not just this one file) that belongs to a maintainer decision, not
something to slip in silently while "just" fixing a lockfile. Two realistic options, not yet
implemented:
- Add the npm-flavored `Test` job (or a lighter dedicated "lockfiles in sync" check) to the
  list of required status checks on `main`, so a desynced lockfile can never merge again
  regardless of what Dependabot or auto-merge does.
- Or configure Dependabot / the auto-merge workflow to regenerate *all* lockfiles as part of
  its update, not just the one tied to the declared package manager.

---

## 6. Why *this* repo hit this problem and other repos likely haven't

This is the most instructive part, because the cause isn't "this repo is unlucky" — it's a
specific, identifiable design choice.

Look at `package.json`:

```json
"packageManager": "yarn@4.9.2+sha512...."
```

This field tells tools (and Corepack, Node's package-manager-version-pinning system) "this
project's *real*, canonical package manager is Yarn." Most repositories have exactly **one**
lockfile, matching their one package manager, and Dependabot's job is simple: update the
manifest and its one lockfile together, atomically, in the same commit. There's no room for
drift because there's nothing else to drift *from*.

This repo is unusual: it deliberately maintains **four** package-manager configurations side
by side — npm, Yarn, pnpm, and Bun — because its CI `Test` matrix installs and runs the test
suite under all four, to prove the project works regardless of which tool a downstream user
picks (visible directly in `reusable-test.yml`'s matrix and its per-package-manager setup
steps). That's a legitimate, deliberate engineering choice for a project that wants broad
compatibility guarantees. But it means the repo carries a *secondary* lockfile
(`package-lock.json`) that exists purely to support the "does it work with plain npm?" leg of
that test matrix and the security cron jobs — it isn't the lockfile Corepack/`packageManager`
treats as canonical.

Dependabot's npm-ecosystem updater only knows how to keep the *canonical* lockfile for a
directory in sync with `package.json`. Given the declared `packageManager: yarn`, it updated
`yarn.lock` correctly and had no mechanism to know it should *also* regenerate the unrelated,
secondary `package-lock.json` sitting alongside it. In a single-package-manager repo, this
category of bug is structurally impossible, because "the lockfile" and "the only lockfile"
are the same file. In this repo, they aren't — and that gap is precisely what let
`package-lock.json` silently rot for three weeks until this investigation caught it.

So: repos that don't test against multiple package managers simultaneously only ever have one
lockfile for Dependabot to keep in sync, and this specific failure mode simply has nowhere to
occur.
