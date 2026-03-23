#!/usr/bin/env node
/**
 * validate-project-name.js (sanitize mode)
 *
 * Sanitizes and validates a project name for sessions-save:
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Strips characters not in [a-z0-9-]
 * - Collapses multiple consecutive hyphens into one
 * - Trims leading/trailing hyphens
 * - Must be at least 3 characters after sanitizing
 *
 * Usage:  node validate-project-name.js <name>
 * Exit 0: prints the sanitized name (may differ from input)
 * Exit 1: prints error to stderr if unsalvageable
 */

const raw = (process.argv[2] || '').trim();

if (!raw) {
  console.error('No project name provided.');
  console.error('Usage: /sessions-save <project-name>');
  console.error('Example: /sessions-save my-api');
  process.exit(1);
}

const sanitized = raw
  .toLowerCase()
  .replace(/[\s_]+/g, '-')       // spaces and underscores → hyphens
  .replace(/[^a-z0-9-]/g, '')    // strip invalid chars
  .replace(/-{2,}/g, '-')        // collapse multiple hyphens
  .replace(/^-+|-+$/g, '');      // trim leading/trailing hyphens

if (sanitized.length < 3) {
  console.error(`Cannot create a valid project name from: "${raw}"`);
  console.error('After sanitizing, the name is too short (minimum 3 characters).');
  console.error('Use only letters, numbers, and hyphens. Example: my-api');
  process.exit(1);
}

// Warn if the name was modified
if (sanitized !== raw) {
  process.stderr.write(`Note: project name sanitized from "${raw}" → "${sanitized}"\n`);
}

console.log(sanitized);
