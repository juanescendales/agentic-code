---
name: sessions-save
description: Save the current Claude Code session to the project's sessions directory for easy retrieval. Use when the user runs /sessions-save, is ending a session, or wants to preserve context before hitting token limits.
origin: essentials
---

# Sessions Save

Capture everything that happened in this session so the next one can pick up exactly where this left off.

## When to Activate

Only when user explicitly runs `/sessions-save`.

## Usage

```
/sessions-save    # saves a session for the current project
```

## Storage Layout

Each session is a directory, not a file:

```
<sessions_dir>/
  <YYYY-MM-DD-shortid>/
    session.md       ← main context (always present)
    plan.md          ← if a plan was created this session
    research.md      ← if research was done
    [other files]    ← any artifact generated during the session
```

## Process

### Step 0: Check configuration

```bash
! node scripts/sessions-config.js read
```

If the script exits with an error (no `.claude/sessions.yml`), tell the user:

```
No sessions config found. Run /sessions-setup first to initialize this project.
```

Then stop. Otherwise, read `{ project, sessions_dir }` from the output. Use these in all subsequent steps.

### Step 1: Gather context from the conversation

Before writing, collect:
- What was being built (goal and context)
- What was confirmed working (with evidence: test passed, ran in browser, etc.)
- What failed and the exact reason (so the next session doesn't retry it)
- What hasn't been tried yet (promising approaches still queued)
- Every file touched and its current status
- Decisions made and why
- Blockers and open questions
- The single most important next step

### Step 2: Create the session directory

```bash
! mkdir -p <sessions_dir>/<YYYY-MM-DD-shortid>
```

For `<shortid>`: use the last 8 chars of `$CLAUDE_SESSION_ID` if available, otherwise generate 8 random lowercase alphanumeric chars.

### Step 3: Write session.md

Create `<sessions_dir>/<session-dir>/session.md`:

```markdown
# Session: YYYY-MM-DD

**Date:** YYYY-MM-DD
**Started:** HH:MM
**Last Updated:** HH:MM
**Project:** <project from config>
**Branch:** <current git branch or unknown>
**Last Checkpoint:** none
**Topic:** <one-line summary of this session>

---

## What We Are Building

[1-3 paragraphs with enough context that someone with zero memory can understand the goal]

---

## What WORKED (with evidence)

- **<thing>** — confirmed by: <specific evidence>

If nothing confirmed: "Nothing confirmed working yet."

---

## What Did NOT Work (and why)

- **<approach>** — failed because: <exact reason>

If nothing failed: "No failed approaches."

---

## What Has NOT Been Tried Yet

- <approach / idea>

---

## Current State of Files

| File | Status | Notes |
| ---- | ------ | ----- |
| `path/to/file` | ✅ Complete / 🔄 In Progress / ❌ Broken / 🗒️ Not Started | notes |

---

## Decisions Made

- **<decision>** — reason: <why>

---

## Blockers & Open Questions

- <blocker or question>

---

## Exact Next Step

<The single most important thing to do when resuming. Be precise enough that resuming requires zero thinking about where to start.>

---

## Session Files

> Other files saved in this session directory:
> (list any plan.md, research.md, or other artifacts here — leave empty if none)

---

## Environment & Setup Notes

<Only if relevant: commands to run, env vars, services needed. Omit if standard.>
```

### Step 4: Move session artifacts

If any plans, research docs, or other files were generated during this session, move or copy them into the session directory. Update the `## Session Files` section in `session.md` with their names and a one-line description of each.

### Step 5: Write the active session link

```bash
! node scripts/session-link.js write <project> <sessions_dir>/<session-dir> $CLAUDE_SESSION_ID
```

This creates `.claude/session.json` in the current project directory so other skills know where the active session lives.

### Step 6: Create initial checkpoint

```bash
! node scripts/manage-checkpoints.js create session-saved $CLAUDE_SESSION_ID
```

Read the printed JSON (`{ name, sha, timestamp }`). Update `**Last Checkpoint:**` in `session.md` to:

```
**Last Checkpoint:** <sha> (session-saved @ HH:MM)
```

### Step 7: Show and confirm

Display the full `session.md` contents and ask:

```
Session saved to: <sessions_dir>/<session-dir>/

Does this look accurate? Anything to correct or add?
```

Wait for confirmation. Make edits if requested.

---

## Notes

- "What Did NOT Work" is the most critical section — prevents blindly retrying failed approaches
- Each session gets its own directory — never reuse or overwrite a previous session
- If saving mid-session, mark in-progress items clearly
- Any file can live in the session directory — plans, research, scratch notes, exports
