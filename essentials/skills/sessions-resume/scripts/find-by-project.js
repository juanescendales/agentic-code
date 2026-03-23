#!/usr/bin/env node
/**
 * sessions-resume/scripts/find-by-project.js
 *
 * Finds the most recent non-closed session directory for this project and
 * returns the path to session.md inside it.
 *
 * Storage layout (project-specific via sessions-config):
 *   <sessions_dir>/<YYYY-MM-DD-shortid>/session.md
 *
 * Usage:  node find-by-project.js
 * Exit 0: prints absolute path to session.md
 * Exit 1: prints error to stderr
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getSessionsDir() {
  try {
    const out = execSync(`node "${path.join(__dirname, 'sessions-config.js')}" read`, { encoding: 'utf8' }).trim();
    const { sessions_dir } = JSON.parse(out);
    return sessions_dir;
  } catch (e) {
    console.error('Failed to read sessions config: ' + e.message);
    console.error('Run /sessions-setup to initialize this project.');
    process.exit(1);
  }
}

function isClosed(sessionPath) {
  try {
    const content = fs.readFileSync(sessionPath, 'utf8');
    return /\*\*Status:\*\*\s*closed/i.test(content);
  } catch (_) { return false; }
}

const sessionsDir = getSessionsDir();

if (!fs.existsSync(sessionsDir)) {
  console.error('No sessions directory found at ' + sessionsDir);
  console.error('Run /sessions-save to create the first session for this project.');
  process.exit(1);
}

const result = fs.readdirSync(sessionsDir, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => {
    const sessionPath = path.join(sessionsDir, e.name, 'session.md');
    if (!fs.existsSync(sessionPath)) return null;
    if (isClosed(sessionPath)) return null;
    return { path: sessionPath, mtime: fs.statSync(sessionPath).mtime };
  })
  .filter(Boolean)
  .sort((a, b) => b.mtime - a.mtime)[0] || null;

if (!result) {
  console.error('No active sessions found for this project.');
  console.error('Run /sessions-save to start a session, or /sessions-resume to load a closed one.');
  process.exit(1);
}

console.log(result.path);
