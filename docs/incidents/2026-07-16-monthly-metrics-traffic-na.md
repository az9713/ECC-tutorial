# Why "Views (14d)" and "Clones (14d)" always show n/a — and how to actually fix it

**Repo:** az9713/ECC-tutorial · **Tracking issue:** #6 (Monthly Metrics Snapshot)
**Investigated:** 2026-07-16 · **Status:** Code fix merged; full activation needs one manual, human-only step

This document assumes no prior git/GitHub background. Every concept is explained where it
first matters. It also assumes you've read
[the previous incident report](2026-07-16-supply-chain-watch-lockfile-drift.md) for the basic
vocabulary (repo, commit, branch, PR, workflow, job, step, secret) — this one goes further,
into the specific difference between two kinds of "access token" GitHub uses, because that
distinction is the entire root cause here.

---

## 1. What issue #6 actually is

Issue #6, "Monthly Metrics Snapshot," is not a bug report — it's a **persistent, self-updating
dashboard** that lives inside a GitHub Issue. A workflow (`.github/workflows/monthly-metrics.yml`)
runs automatically on the 1st of every month, and instead of creating a new issue each time, it
finds the *same* open issue (matched by title + a `metrics-snapshot` label) and edits its body,
appending or refreshing one table row per month. This is a legitimate, common pattern: using an
Issue as a lightweight, human-readable "always up to date" report page, rather than building a
dashboard website. It was never meant to be closed — it's meant to stay open and keep growing,
one row per month, forever.

Two columns in that table, **Views (14d)** and **Clones (14d)**, have shown `n/a` in both rows
that exist so far (2026-06 and 2026-07). That's the actual defect: not a crashing workflow, but
a silently-degraded one that's been quietly failing to collect two of its eleven data points
since the day it was created.

---

## 2. Two very different meanings of "access token"

To understand why this happened, you need to know GitHub uses (at least) two structurally
different kinds of credential, and this workflow's script only had access to one of them.

- **`GITHUB_TOKEN`** is a token GitHub automatically creates and injects into *every* workflow
  run, scoped only to that one run, and destroyed when the run ends. It doesn't belong to any
  human — its identity, visible in commit/PR activity, is the bot account
  `github-actions[bot]`. What it's allowed to do is controlled entirely by the `permissions:`
  block at the top of the workflow YAML (things like `contents: read`, `issues: write`). This
  is the "least privilege by design" token: narrowly scoped, short-lived, no human's real
  identity behind it.
- A **Personal Access Token (PAT)** is a credential a human deliberately creates from their own
  GitHub account (under Settings → Developer settings), representing *their own* real identity
  and *their own* real permissions on every repo they can access. It's long-lived (until
  revoked or expired) and, critically, it can only ever be created by a human clicking through
  GitHub's own website (or an already-authorized session) — no API call or piece of automation
  can mint one from nothing.

The repo's `permissions:` block for this workflow was `contents: read, issues: write` — pretty
minimal, matching the same "restrict the bot token tightly" philosophy seen in the
Supply-Chain Watch workflow. That looked like a plausible cause: "maybe it just needs a broader
permission." It isn't.

---

## 3. What actually happens, confirmed by testing it directly

Rather than guess, the workflow was dispatched manually on a disposable test branch (using
GitHub's `workflow_dispatch` trigger — a manual "run this right now" button every workflow with
that trigger has, independent of its normal schedule) with two temporary changes: the
permission was widened to `contents: write`, and the script's silent `catch { return null }`
was changed to log the *actual* error before swallowing it. The result, straight from the run
log:

```
DIAG traffic(views) failed: status=403 message=Resource not accessible by integration
DIAG traffic(clones) failed: status=403 message=Resource not accessible by integration
```

Even with a **broader** permission than before, the exact same 403 came back. That rules out
"the permissions block is too narrow" as the cause. `github.com/az9713/ECC-tutorial/traffic/views`
and `.../traffic/clones` — the endpoints behind GitHub's repository Insights tab — are
categorically off-limits to `GITHUB_TOKEN`, no matter what `permissions:` you grant it. GitHub
restricts that specific data (who's viewing/cloning your repo) to tokens carrying a real
account's own push-level access — which an ephemeral, bot-identity Actions token structurally
can never have, by design, regardless of YAML configuration. (Confirmed independently: querying
the same two endpoints with an authenticated human account's own credentials returned real
non-zero numbers immediately — the data exists and is retrievable, just not by this token.)

This is why the workflow's own two runs both show `conclusion: success` in GitHub's UI, yet
both silently produced incomplete data: the original code caught every error and quietly wrote
`n/a`, so nothing ever looked broken from the outside.

The disposable diagnostic branch and its run were deleted after confirming this — it was purely
a controlled experiment, not part of the shipped fix.

---

## 4. The fix that was implemented (code side)

`.github/workflows/monthly-metrics.yml` now reads an optional repository secret,
`TRAFFIC_STATS_TOKEN`, and — only if it's set — uses it, instead of `GITHUB_TOKEN`, specifically
for the two traffic calls:

```js
async function getTraffic(metric) {
  const patToken = process.env.TRAFFIC_STATS_TOKEN;
  if (!patToken) return null;                 // unchanged behavior until the secret exists
  try {
    const route = metric === "clones"
      ? "GET /repos/{owner}/{repo}/traffic/clones"
      : "GET /repos/{owner}/{repo}/traffic/views";
    const resp = await github.request(route, {
      owner, repo,
      headers: { authorization: `Bearer ${patToken}` }   // real PAT, not GITHUB_TOKEN
    });
    return resp.data?.count ?? null;
  } catch {
    return null;
  }
}
```

A **repository secret** is a named, encrypted value stored in the repo's settings
(Settings → Secrets and variables → Actions) — workflows can reference it as
`${{ secrets.NAME }}`, but its value is never shown in logs or to anyone browsing the repo. This
is the standard, safe way to hand a workflow a credential that has to outlive a single run and
isn't the automatic `GITHUB_TOKEN`.

This change is **fully backward-compatible by construction**: if the secret doesn't exist yet,
`patToken` is empty, `getTraffic` returns `null` immediately (no API call, no error, no
behavior change at all), and the table still shows `n/a` exactly as it does today. Nothing
breaks by merging this before the secret exists.

---

## 5. The one step that genuinely requires a human, and why

The code fix alone does not make the numbers appear. Someone with push access to this repo
needs to:

1. Create a Personal Access Token from **their own** GitHub account — either a classic token
   with the `repo` scope, or a fine-grained token scoped just to this repository with
   `Contents: Read` + `Administration: Read`.
2. Add it as a repository secret named `TRAFFIC_STATS_TOKEN`
   (Settings → Secrets and variables → Actions → New repository secret, or
   `gh secret set TRAFFIC_STATS_TOKEN` from the command line).

This is deliberately not something automated on your behalf here, for two reasons worth
understanding rather than just accepting:

- **It's technically impossible to do otherwise.** No API call, script, or piece of automation
  can mint a PAT out of thin air — creating one is an action GitHub only allows a signed-in
  human to take, precisely because a PAT represents that human's real, full identity and
  access. This is the same reason `GITHUB_TOKEN` can't just be upgraded into one.
- **It's a meaningfully different class of credential to hand over.** A PAT, even narrowly
  scoped, is a standing, long-lived credential tied to a real account rather than a
  self-expiring per-run token. Minting one and wiring it into a repo's secrets is a
  security-relevant decision — which scope, which account, how long it lives, what happens if
  it leaks — that belongs to whoever owns the repo's security posture, not something to do
  silently as a side effect of "fixing a workflow."

Once that secret exists, **no further code change is needed** — the very next scheduled run (or
a manual `workflow_dispatch`) will pick it up and start reporting real numbers.

---

## 6. What's gained, and what's genuinely still open

**Gained:**
- The root cause is now understood and documented precisely (403, not a permissions
  misconfiguration), instead of being a mysterious, easy-to-misdiagnose "n/a."
- The workflow is strictly more capable than before and provably no worse: with no secret, it
  behaves identically to today; with the secret, two previously-broken columns start working.
- The fix required touching only the one workflow file — no change to branch protection, no
  change to what the default `GITHUB_TOKEN` can do elsewhere, keeping the "restrict the bot
  token tightly" philosophy intact everywhere else.

**Still open (needs a human, one time):**
- Views (14d) / Clones (14d) will keep showing `n/a` until someone with push access creates the
  PAT and the `TRAFFIC_STATS_TOKEN` secret, as described above. This document and the updated
  issue-body text both explain exactly what to do.
- The PAT, once created, is a standing credential — worth eventually revisiting its expiry and
  rotating it, the same as any long-lived secret.

---

## 7. The broader lesson

The Supply-Chain Watch incident and this one look superficially similar — both are "an
automation quietly stopped doing its job, and a `permissions:`-shaped setting looked like the
likely suspect" — but they resolve in opposite directions, which is the useful takeaway:

- Supply-Chain Watch broke because a *required-check gap in branch protection* let a bad state
  reach `main` unnoticed. The fix lived entirely within GitHub's automation: no new credential,
  no human step, just correcting what was already there.
- This one is broken because of a *hard boundary GitHub draws on purpose* between
  automation-issued tokens and human-owned credentials, for data GitHub considers sensitive
  enough that only an actual accountable person should be able to read it. No amount of YAML
  configuration crosses that boundary — the fix necessarily requires a human to hand the
  automation a piece of their own identity, deliberately and visibly, as a named secret.

Recognizing which kind of problem you're looking at — "a gap in our own configuration" versus
"a deliberate platform boundary" — is what separates chasing the wrong fix (broadening
`permissions:` forever, as the first diagnostic attempt here tried and disproved) from finding
the one that actually works.
