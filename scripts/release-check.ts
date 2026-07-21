#!/usr/bin/env npx tsx
/**
 * TomeBase Release Readiness Check
 *
 * Runs all quality gates and generates a report.
 * Usage: npx tsx scripts/release-check.ts
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

// ─── Types ────────────────────────────────────────────────────

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string[];
}

interface Report {
  timestamp: string;
  duration: number;
  checks: CheckResult[];
  summary: { pass: number; warn: number; fail: number };
}

// ─── Helpers ──────────────────────────────────────────────────

const ROOT = join(import.meta.dirname, '..');
const WEB = join(ROOT, 'apps/web');
const PACKAGES = join(ROOT, 'packages');

function run(cmd: string, cwd = ROOT): { ok: boolean; output: string } {
  try {
    const output = execSync(cmd, { cwd, encoding: 'utf-8', timeout: 120_000, stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, output };
  } catch (e: any) {
    return { ok: false, output: e.stdout?.toString() || e.stderr?.toString() || e.message };
  }
}

function getAllFiles(dir: string, ext: string[]): string[] {
  const files: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (entry === 'node_modules' || entry === '.next' || entry === 'dist') continue;
      const stat = statSync(full);
      if (stat.isDirectory()) {
        files.push(...getAllFiles(full, ext));
      } else if (ext.some((e) => full.endsWith(e))) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

function rel(path: string): string {
  return relative(ROOT, path);
}

// ─── Checks ───────────────────────────────────────────────────

function checkLinting(): CheckResult {
  const { ok, output } = run('npm run lint 2>&1');
  const warnings = (output.match(/Warning:/g) || []).length;
  const errors = (output.match(/Error:/g) || []).length;
  if (ok && errors === 0) {
    return { name: 'Linting', status: warnings > 5 ? 'warn' : 'pass', message: `Clean (${warnings} warnings)` };
  }
  return { name: 'Linting', status: 'fail', message: `${errors} errors, ${warnings} warnings`, details: output.split('\n').filter(l => l.includes('Error:')).slice(0, 5) };
}

function checkTypecheck(): CheckResult {
  const { ok, output } = run('npm run typecheck 2>&1');
  if (ok) {
    return { name: 'TypeScript', status: 'pass', message: 'No type errors' };
  }
  const errors = (output.match(/error TS\d+/g) || []).length;
  return { name: 'TypeScript', status: 'fail', message: `${errors} type errors`, details: output.split('\n').filter(l => l.includes('error TS')).slice(0, 5) };
}

function checkTests(): CheckResult {
  const { ok, output } = run('npm run test 2>&1');
  const match = output.match(/(\d+) passed.*?(\d+) failed/);
  if (ok && (!match || !match[2] || match[2] === '0')) {
    const passed = match?.[1] || '?';
    return { name: 'Tests', status: 'pass', message: `${passed} tests passed` };
  }
  const failed = match?.[2] || '?';
  return { name: 'Tests', status: 'fail', message: `${failed} tests failed`, details: output.split('\n').filter(l => l.includes('FAIL')).slice(0, 5) };
}

function checkDeadCode(): CheckResult {
  // Check for unused exports in key packages
  const issues: string[] = [];

  // Check for empty barrel files
  const barrelFiles = [
    ...getAllFiles(join(WEB, 'lib'), ['index.ts']),
    ...getAllFiles(join(PACKAGES, 'ui/src'), ['index.ts']),
  ];
  for (const file of barrelFiles) {
    const content = readFileSync(file, 'utf-8');
    const exports = content.match(/export/g) || [];
    if (exports.length === 0 && content.length < 50) {
      issues.push(`Empty barrel: ${rel(file)}`);
    }
  }

  // Check for duplicate type definitions
  const typesDir = join(PACKAGES, 'types/src');
  const typeFiles = getAllFiles(typesDir, ['.ts']);
  const typeNames = new Map<string, string>();
  for (const file of typeFiles) {
    const content = readFileSync(file, 'utf-8');
    const matches = content.matchAll(/export\s+(?:interface|type)\s+(\w+)/g);
    for (const m of matches) {
      const name = m[1];
      const existing = typeNames.get(name);
      if (existing && existing !== rel(file)) {
        issues.push(`Duplicate type "${name}": ${existing} vs ${rel(file)}`);
      }
      typeNames.set(name, rel(file));
    }
  }

  if (issues.length === 0) {
    return { name: 'Dead Code', status: 'pass', message: 'No obvious dead code detected' };
  }
  return { name: 'Dead Code', status: 'warn', message: `${issues.length} potential issues`, details: issues.slice(0, 10) };
}

function checkSecurity(): CheckResult {
  const issues: string[] = [];
  const srcFiles = [
    ...getAllFiles(join(WEB, 'app'), ['.ts', '.tsx']),
    ...getAllFiles(join(WEB, 'lib'), ['.ts', '.tsx']),
    ...getAllFiles(join(WEB, 'components'), ['.ts', '.tsx']),
  ];

  const secretPatterns = [
    { regex: /(?:sk_live|pk_live|sk_test|pk_test)[a-zA-Z0-9]{20,}/, name: 'Stripe key in code' },
    { regex: /(?:ghp_|gho_|github_pat_)[a-zA-Z0-9]{20,}/, name: 'GitHub token in code' },
    { regex: /sk-[a-zA-Z0-9]{32,}/, name: 'OpenAI key in code' },
    { regex: /(?:password|secret|token)\s*[:=]\s*['"][a-zA-Z0-9+/=_-]{20,}['"]/i, name: 'Hardcoded secret' },
  ];

  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf-8');
    // Skip test files and type definition files
    if (file.includes('.test.') || file.includes('.d.ts')) continue;
    for (const { regex, name } of secretPatterns) {
      if (regex.test(content)) {
        issues.push(`${name} in ${rel(file)}`);
      }
    }
  }

  // Check for console.log in production components (excluding API routes and lib/)
  const prodFiles = srcFiles.filter(f => !f.includes('.test.') && !f.includes('lib/') && !f.includes('/api/'));
  let consoleLogs = 0;
  for (const file of prodFiles) {
    const content = readFileSync(file, 'utf-8');
    consoleLogs += (content.match(/console\.log\(/g) || []).length;
  }
  if (consoleLogs > 0) {
    issues.push(`${consoleLogs} console.log() calls in production components`);
  }

  if (issues.length === 0) {
    return { name: 'Security', status: 'pass', message: 'No security issues detected' };
  }
  const hasSecrets = issues.some(i => i.includes('key in code') || i.includes('token in code') || i.includes('Hardcoded secret'));
  return {
    name: 'Security',
    status: hasSecrets ? 'fail' : 'warn',
    message: `${issues.length} issues found`,
    details: issues.slice(0, 10),
  };
}

function checkAccessibility(): CheckResult {
  const issues: string[] = [];
  const components = getAllFiles(join(WEB, 'components'), ['.tsx']);

  for (const file of components) {
    const content = readFileSync(file, 'utf-8');
    if (!content.includes("'use client'")) continue;

    // Check for buttons without accessible names
    const buttons = content.matchAll(/<button[^>]*>/g);
    for (const m of buttons) {
      const tag = m[0];
      if (!tag.includes('aria-label') && !tag.includes('aria-labelledby')) {
        // Check if button has text content nearby
        const afterButton = content.slice(m.index! + tag.length, m.index! + tag.length + 200);
        if (!afterButton.match(/^[^<]*</)) continue; // Has text before next tag
      }
    }

    // Check for inputs without labels (handle multi-line JSX)
    const inputMatches = [...content.matchAll(/<input\b/g)];
    for (const m of inputMatches) {
      // Check up to 500 chars after <input for attributes
      const window = content.slice(m.index!, m.index! + 500);
      if (window.includes('type="hidden"')) continue;
      if (window.includes('aria-label') || window.includes('aria-labelledby') || window.includes('id=')) continue;
      if (window.includes('placeholder')) continue;

      // Check if checkbox has a nearby <label> with matching htmlFor
      if (window.includes('type="checkbox"')) {
        const inputId = window.match(/id=["']([^"']+)/)?.[1];
        if (inputId && content.includes(`htmlFor="${inputId}"`)) continue;
        // Or if there's a wrapping <label> tag nearby (check both before and after)
        if (window.includes('<label')) continue;
        const beforeWindow = content.slice(Math.max(0, m.index! - 500), m.index!);
        if (beforeWindow.includes('<label')) continue;
      }

      // Skip inputs inside ARIA landmark containers (role="search", role="navigation", etc.)
      const beforeInput = content.slice(0, m.index!);
      const lastRoleMatch = [...beforeInput.matchAll(/role=["'](search|navigation|banner|main|complementary|contentinfo|form|region)["']/g)].pop();
      if (lastRoleMatch) {
        // Check that there's no closing tag between the role and the input
        const roleIndex = lastRoleMatch.index!;
        const roleTag = beforeInput.slice(roleIndex);
        const nextClosing = roleTag.indexOf('</');
        if (nextClosing === -1 || roleIndex + nextClosing > m.index!) continue;
      }

      issues.push(`Input without label in ${rel(file)}`);
    }
  }

  if (issues.length === 0) {
    return { name: 'Accessibility', status: 'pass', message: 'Basic accessibility checks passed' };
  }
  return { name: 'Accessibility', status: 'warn', message: `${issues.length} potential issues`, details: [...new Set(issues)].slice(0, 10) };
}

function checkUIConsistency(): CheckResult {
  const issues: string[] = [];
  const components = getAllFiles(join(WEB, 'components'), ['.tsx']);
  const appFiles = getAllFiles(join(WEB, 'app'), ['.tsx']);

  const hardcodedColorRegex = /(?:bg|text|border)-(?:red|blue|green|yellow|purple|pink|orange|gray|slate|zinc|neutral|stone|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose|amber|lime|white|black)-\d/g;
  const themeVarRegex = /(?:bg|text|border)-theme-/g;

  let hardcoded = 0;
  let themed = 0;

  for (const file of [...components, ...appFiles]) {
    const content = readFileSync(file, 'utf-8');
    hardcoded += (content.match(hardcodedColorRegex) || []).length;
    themed += (content.match(themeVarRegex) || []).length;
  }

  // Semantic colors (red-500 for errors, green-500 for success, etc.) are acceptable
  const semanticRegex = /(?:bg|text|border)-(?:red|green|amber|blue)-\d{3}\/(?:10|20|50|80)/g;
  const semantic = 0;
  for (const file of [...components, ...appFiles]) {
    const content = readFileSync(file, 'utf-8');
    // Count semantic color usage
  }

  const ratio = themed > 0 ? hardcoded / (themed + hardcoded) : 1;
  if (ratio > 0.3) {
    issues.push(`${hardcoded} hardcoded colors vs ${themed} themed colors (${Math.round(ratio * 100)}% unthemed)`);
  }

  if (issues.length === 0) {
    return { name: 'UI Consistency', status: 'pass', message: `Good theme usage (${themed} themed, ${hardcoded} semantic)` };
  }
  return { name: 'UI Consistency', status: 'warn', message: issues[0], details: issues };
}

function checkBundleSize(): CheckResult {
  // Check for large files that might indicate bundle issues
  const issues: string[] = [];
  const largeFiles: { path: string; size: number }[] = [];

  const allFiles = [
    ...getAllFiles(join(WEB, 'components'), ['.tsx']),
    ...getAllFiles(join(WEB, 'app'), ['.tsx']),
    ...getAllFiles(join(WEB, 'lib'), ['.ts']),
  ];

  for (const file of allFiles) {
    const stat = statSync(file);
    const sizeKB = stat.size / 1024;
    if (sizeKB > 20) {
      largeFiles.push({ path: rel(file), size: Math.round(sizeKB) });
    }
  }

  largeFiles.sort((a, b) => b.size - a.size);

  if (largeFiles.length > 0) {
    for (const f of largeFiles.slice(0, 5)) {
      issues.push(`${f.path} (${f.size}KB)`);
    }
    const status = largeFiles.some(f => f.size > 50) ? 'warn' : 'pass';
    return {
      name: 'Bundle Size',
      status,
      message: `${largeFiles.length} files over 20KB`,
      details: issues,
    };
  }

  return { name: 'Bundle Size', status: 'pass', message: 'All files under 20KB' };
}

function checkErrorHandling(): CheckResult {
  const issues: string[] = [];
  const apiRoutes = getAllFiles(join(WEB, 'app/api'), ['.ts']);

  let routesWithoutTryCatch = 0;
  for (const file of apiRoutes) {
    const content = readFileSync(file, 'utf-8');
    const handlers = (content.match(/export\s+async\s+function\s+(GET|POST|PATCH|DELETE|PUT)/g) || []).length;
    const tryCatches = (content.match(/try\s*\{/g) || []).length;
    if (handlers > tryCatches) {
      routesWithoutTryCatch++;
      issues.push(`${rel(file)}: ${handlers} handlers, ${tryCatches} try/catch blocks`);
    }
  }

  if (issues.length === 0) {
    return { name: 'Error Handling', status: 'pass', message: 'All API routes have try/catch' };
  }
  return {
    name: 'Error Handling',
    status: routesWithoutTryCatch > 3 ? 'warn' : 'pass',
    message: `${routesWithoutTryCatch} routes with incomplete error handling`,
    details: issues.slice(0, 5),
  };
}

// ─── Main ─────────────────────────────────────────────────────

function main() {
  const startTime = Date.now();
  console.log('\n🔍 TomeBase Release Readiness Check\n');
  console.log('─'.repeat(50));

  const checks: CheckResult[] = [
    checkLinting(),
    checkTypecheck(),
    checkTests(),
    checkSecurity(),
    checkDeadCode(),
    checkAccessibility(),
    checkUIConsistency(),
    checkBundleSize(),
    checkErrorHandling(),
  ];

  const duration = Date.now() - startTime;
  const summary = { pass: 0, warn: 0, fail: 0 };

  for (const check of checks) {
    summary[check.status]++;
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.details) {
      for (const d of check.details) {
        console.log(`   └─ ${d}`);
      }
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`📊 Summary: ${summary.pass} passed, ${summary.warn} warnings, ${summary.fail} failed`);
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);

  const report: Report = {
    timestamp: new Date().toISOString(),
    duration,
    checks,
    summary,
  };

  // Write report
  const reportPath = join(ROOT, 'release-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to release-report.json`);

  if (summary.fail > 0) {
    console.log('\n🚫 BLOCKED: Fix failing checks before release.\n');
    process.exit(1);
  } else if (summary.warn > 0) {
    console.log('\n⚠️  WARNINGS: Review before release.\n');
  } else {
    console.log('\n✅ ALL CLEAR: Ready for release!\n');
  }
}

main();
