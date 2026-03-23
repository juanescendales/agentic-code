---
name: sessions-update
description: Update the active session's session.md with the latest progress, or close the session when done. Use when the user runs /sessions-update or /sessions-update close.
origin: essentials
---

# Sessions Update

Refresh the active session's `session.md` with the latest state — or close it when work is done.

## When to Activate

Only when user explicitly runs `/sessions-update` or `/sessions-update close`.

## Usage

```
/sessions-update          # refresh session context with latest progress
/sessions-update close    # refresh then mark the session as closed
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

Then stop. Check whether `$ARGUMENTS` contains `close` — store this as `CLOSING=true`.

### Step 1: Resolve the active session directory

```bash
! node scripts/session-link.js read
```

If it fails (no `.claude/session.json`), tell the user:

```
No active session found in this project.
Run /sessions-resume to activate an existing session, or /sessions-save to start a new one.
```

Then stop.

### Step 2: Read the existing session.md

Read `<session_dir>/session.md`. This is the baseline — preserve sections the user may have edited manually.

Extract `**Last Checkpoint:**` from the header. If a SHA is present (e.g., `abc1234`), show what changed:

```bash
! git diff <sha> --stat
```

Show this as:

```
Changes since last checkpoint (<sha>):
<git diff output>
```

### Step 3: Re-gather context from the conversation

Focus on what changed since the session was last saved:
- New things confirmed working (add to "What WORKED")
- New failures (add to "What Did NOT Work")
- Files whose status changed (update "Current State of Files")
- New decisions made
- Updated blockers or resolved questions
- Revised next step

### Step 4: Overwrite session.md

Update the file in place:
- Update `**Last Updated:**` to the current time
- Merge new information into each section — do not discard existing entries
- Update `## Session Files` if new artifacts were added to the session directory

### Step 5: Create checkpoint

```bash
! node scripts/manage-checkpoints.js create session-updated $CLAUDE_SESSION_ID
```

Read the printed JSON. Update `**Last Checkpoint:**` in session.md:

```
**Last Checkpoint:** <sha> (session-updated @ HH:MM)
```

### Step 6: Close (only if CLOSING=true)

If `$ARGUMENTS` contains `close`:

**Step 6a:** Add `**Status:** closed` and `**Closed:**` to the session header, after `**Last Updated:**`:

```markdown
**Last Updated:** HH:MM
**Status:** closed
**Closed:** YYYY-MM-DD HH:MM
```

**Step 6b:** Clear the session link:

```bash
! node scripts/session-link.js clear
```

### Step 7: Confirm

If updating only:
```
Session updated: <session_dir>/session.md
Last Updated: <time>
Checkpoint: <sha> (session-updated)
```

If closing:
```
Session closed: <session_dir>
Last Updated: <time>
Checkpoint: <sha> (session-updated)
.claude/session.json removed.

To resume this session later: /sessions-resume
To start a new session:       /sessions-save
```
