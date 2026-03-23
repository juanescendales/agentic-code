---
name: sessions-resume
description: Resume a Claude Code session for this project. Loads the most recent active session and presents a structured briefing. Use when the user runs /sessions-resume or wants to continue work from a previous session.
origin: essentials
---

# Sessions Resume

Load a previous session and orient fully before doing any work.

## When to Activate

Only when user explicitly runs `/sessions-resume`.

## Usage

```
/sessions-resume    # loads the most recent active session for this project
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

Then stop. Otherwise read `{ project, sessions_dir }`.

### Step 1: Find the most recent active session

```bash
! node scripts/find-by-project.js
```

If the script **fails** (no active sessions), show available sessions — including closed ones — so the user knows what exists:

```bash
! node scripts/list.js
```

Then tell the user:

```
No active sessions found for this project.
Run /sessions-save to start a new session.
```

And stop.

### Step 2: Read session.md

Read the file at the path returned by Step 1. Do not summarize yet.

### Step 3: List other files in the session directory

The session directory is the parent of `session.md`. List what else is in it:

```bash
! ls <session-directory>
```

Collect any files other than `session.md`.

### Step 4: Calculate session age

Extract `**Date:**` from the file header. Calculate how many days ago relative to today.

- 0 days: "today"
- 1 day: "yesterday"
- 2–6 days: "N days ago"
- 7+ days: mark with ⚠️

### Step 5: Present the briefing

Respond with this exact format:

```
SESSION LOADED: <session directory path>
════════════════════════════════════════════════

PROJECT:  <project name>
SAVED:    <date> at <started time> (<age>)
UPDATED:  <last updated time>
LAST CHECKPOINT: <sha> (<name>) — or "none" if not set
⚠️ [only if 7+ days]: This session is N days old — verify file states before proceeding.

SESSION FILES:
  session.md        ← loaded
  <other files>     ← available (say "none" if empty)

ACTIVE SESSION DIR: <session_dir>
  → Any files you create this session (plan.md, research.md, etc.) save to this directory.

WHAT WE'RE BUILDING:
<2-3 sentence summary in your own words>

CURRENT STATE:
✅ Working: <count> items confirmed
🔄 In Progress: <list files in progress>
🗒️ Not Started: <list planned but untouched>

WHAT NOT TO RETRY:
<list every failed approach with its reason — this is the most important section>

OPEN QUESTIONS / BLOCKERS:
<list any blockers or unanswered questions>

NEXT STEP:
<exact next step if defined, or "No next step defined — review 'What Has NOT Been Tried Yet'">

════════════════════════════════════════════════
Ready to continue. What would you like to do?
```

### Step 5b: Write the active session link

```bash
! node scripts/session-link.js write <project> <session-directory> $CLAUDE_SESSION_ID
```

### Step 6: Wait

Do NOT start working automatically. Do NOT touch any files. Wait for the user to give direction.

---

## Edge Cases

- **Referenced files that no longer exist on disk**: flag them — "⚠️ `path/to/file` referenced but not found."
- **Multiple sessions same day**: the script returns the most recently modified one.
- **Empty or malformed session.md**: report it and suggest `/sessions-save` to create a new one.

---

## Notes

- Never modify session files when loading — they are read-only historical records
- "WHAT NOT TO RETRY" must always be shown, even if it says "None" — too important to skip
- Load other session files (plan.md, research.md) only if the user asks or if clearly needed for the next step
- The `ACTIVE SESSION DIR` line in the briefing is the mechanism for artifact routing — Claude will save files there throughout the session
