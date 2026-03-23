#!/usr/bin/env node
/**
 * sessions/scripts/list.js
 *
 * Lists Claude Code sessions for the current project.
 * Sessions directory is resolved from .claude/sessions.yml via sessions-config.js.
 *
 * Storage layout:
 *   <sessions_dir>/<YYYY-MM-DD-shortid>/session.md
 *
 * Usage:
 *   node list.js      # list all sessions for this project
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getConfig() {
  try {
    const out = execSync(`node "${path.join(__dirname, 'sessions-config.js')}" read`, { encoding: 'utf8' }).trim();
    return JSON.parse(out);
  } catch (e) {
    console.error('Failed to read sessions config: ' + e.message);
    console.error('Run /sessions-setup to initialize this project.');
    process.exit(1);
  }
}

function col(str, n) {
  return (str || '-').slice(0, n).padEnd(n);
}

function parseField(content, field) {
  const m = content.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : '-';
}

function isClosed(content) {
  return /\*\*Status:\*\*\s*closed/i.test(content);
}

const { project, sessions_dir } = getConfig();

if (!fs.existsSync(sessions_dir)) {
  console.log(`No sessions found for project: ${project}`);
  console.log('Run /sessions-save to create the first session.');
  process.exit(0);
}

const sessions = fs.readdirSync(sessions_dir, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => {
    const sessionFile = path.join(sessions_dir, e.name, 'session.md');
    if (!fs.existsSync(sessionFile)) return null;
    let branch = '-', topic = '-', date = '-', status = 'open';
    try {
      const c = fs.readFileSync(sessionFile, 'utf8');
      branch = parseField(c, 'Branch');
      topic  = parseField(c, 'Topic');
      date   = parseField(c, 'Date');
      if (isClosed(c)) status = 'closed';
    } catch (_) {}
    const mtime = fs.statSync(sessionFile).mtime;
    const files = fs.readdirSync(path.join(sessions_dir, e.name)).filter(f => f !== 'session.md');
    return { id: e.name, branch, topic, date, mtime, extraFiles: files.length, status };
  })
  .filter(Boolean)
  .sort((a, b) => b.mtime - a.mtime);

if (sessions.length === 0) {
  console.log(`No sessions found for project: ${project}`);
  console.log('Run /sessions-save to start a session.');
  process.exit(0);
}

console.log(`Project: ${project} — ${sessions.length} session(s)\n`);
console.log('Date        Time   Branch           Files  Status  Topic');
console.log('─'.repeat(72));
sessions.forEach(s => {
  const time   = s.mtime.toTimeString().slice(0, 5);
  const extras = s.extraFiles > 0 ? `+${s.extraFiles}`.padEnd(6) : '-'.padEnd(6);
  const status = s.status === 'closed' ? 'closed' : 'open  ';
  console.log(`${s.date} ${time}  ${col(s.branch, 16)} ${extras} ${status}  ${s.topic.slice(0, 25)}`);
});
