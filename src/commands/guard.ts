import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { globSync } from 'glob';
import { showSmallHeader, successBox, infoBox, printSuccess, printWarning, printError } from '../utils/display';
import {
  SECRET_PATTERNS,
  GITIGNORE_REQUIRED,
  GITIGNORE_RECOMMENDED,
  maskSecret,
  SecretPattern,
} from '../utils/patterns';

interface ScanFinding {
  severity: 'critical' | 'warning' | 'info';
  file: string;
  line: number;
  pattern: SecretPattern;
  snippet: string;
}

interface CheckResult {
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.venv', 'venv', 'coverage'];
const SKIP_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.bin', '.lock'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function shouldSkipFile(filePath: string): boolean {
  const parts = filePath.split(path.sep);
  if (parts.some((p) => SKIP_DIRS.includes(p))) return true;
  const ext = path.extname(filePath).toLowerCase();
  return SKIP_EXTS.includes(ext);
}

function scanFileForSecrets(filePath: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return findings;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      for (const pattern of SECRET_PATTERNS) {
        const match = pattern.regex.exec(line);
        if (match) {
          findings.push({
            severity: pattern.severity,
            file: filePath,
            line: idx + 1,
            pattern,
            snippet: maskSecret(match[0]),
          });
          break; // one finding per line
        }
      }
    });
  } catch {
    // unreadable file — skip
  }
  return findings;
}

function checkGitignore(cwd: string): CheckResult[] {
  const results: CheckResult[] = [];
  const giPath = path.join(cwd, '.gitignore');

  if (!fs.existsSync(giPath)) {
    results.push({
      label: '.gitignore exists',
      status: 'fail',
      detail: 'No .gitignore found — secrets may be committed accidentally',
    });
    return results;
  }

  results.push({ label: '.gitignore exists', status: 'pass', detail: '.gitignore present' });

  const content = fs.readFileSync(giPath, 'utf-8');
  for (const entry of GITIGNORE_REQUIRED) {
    const found = content.split('\n').some((line) => {
      const trimmed = line.trim();
      return trimmed === entry || trimmed === `/${entry}` || trimmed === `${entry}/`;
    });
    results.push({
      label: `"${entry}" in .gitignore`,
      status: found ? 'pass' : 'warn',
      detail: found ? 'Properly ignored' : `"${entry}" is not in .gitignore`,
    });
  }

  return results;
}

function checkEnvFilesInGit(cwd: string): CheckResult[] {
  const results: CheckResult[] = [];
  const gitIndex = path.join(cwd, '.git', 'index');

  if (!fs.existsSync(gitIndex)) {
    results.push({
      label: 'Git repository check',
      status: 'warn',
      detail: 'Not a git repository — skipping git index check',
    });
    return results;
  }

  // Read the git index as binary and search for .env patterns
  const indexContent = fs.readFileSync(gitIndex);
  const envPatterns = ['.env', '.env.local', '.env.production'];
  for (const envFile of envPatterns) {
    const found = indexContent.indexOf(Buffer.from(envFile)) !== -1;
    results.push({
      label: `"${envFile}" not in git`,
      status: found ? 'fail' : 'pass',
      detail: found ? `CRITICAL: "${envFile}" appears to be tracked by git!` : 'Not tracked by git',
    });
  }

  return results;
}

function checkLargeFiles(cwd: string): CheckResult[] {
  const results: CheckResult[] = [];
  const MB50 = 50 * 1024 * 1024;

  try {
    const files = globSync('**/*', {
      cwd,
      nodir: true,
      ignore: SKIP_DIRS.map((d) => `**/${d}/**`),
    });

    const large = files.filter((f) => {
      try {
        return fs.statSync(path.join(cwd, f)).size > MB50;
      } catch {
        return false;
      }
    });

    if (large.length === 0) {
      results.push({ label: 'No files >50MB', status: 'pass', detail: 'All files within size limits' });
    } else {
      large.forEach((f) => {
        const size = (fs.statSync(path.join(cwd, f)).size / 1024 / 1024).toFixed(1);
        results.push({
          label: `Large file: ${f}`,
          status: 'warn',
          detail: `${f} is ${size}MB — consider git-lfs or removing from repo`,
        });
      });
    }
  } catch {
    results.push({ label: 'Large file check', status: 'warn', detail: 'Could not complete large file scan' });
  }

  return results;
}

function checkPackageLock(cwd: string): CheckResult[] {
  const hasLock = fs.existsSync(path.join(cwd, 'package-lock.json')) ||
    fs.existsSync(path.join(cwd, 'yarn.lock')) ||
    fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'));

  return [
    {
      label: 'Lock file present',
      status: hasLock ? 'pass' : 'warn',
      detail: hasLock ? 'Dependency lock file found' : 'No lock file — add package-lock.json or yarn.lock',
    },
  ];
}

function generateGitignore(cwd: string): void {
  const all = [...new Set([...GITIGNORE_REQUIRED, ...GITIGNORE_RECOMMENDED])];
  const content =
    '# Generated by DevForge Guard\n\n' +
    '# Environment\n' +
    ['.env', '.env.local', '.env.production', '.env.development', '.env.test', '.env.staging']
      .map((e) => e)
      .join('\n') +
    '\n\n# Dependencies\nnode_modules/\n\n# Build output\ndist/\nbuild/\n.next/\n\n' +
    '# Python\n__pycache__/\n*.pyc\n.venv/\nvenv/\n\n# OS\n.DS_Store\nThumbs.db\n\n' +
    '# IDE\n.idea/\n.vscode/\n\n# Logs\n*.log\nnpm-debug.log*\n';

  void all; // all is already spread above for dedup
  fs.writeFileSync(path.join(cwd, '.gitignore'), content, 'utf-8');
  printSuccess('.gitignore generated with best practices!');
}

export async function runGuard(): Promise<void> {
  showSmallHeader('EnvGuard — Security Scanner');
  console.log(chalk.dim('  Scanning current directory for secrets and vulnerabilities...\n'));

  const cwd = process.cwd();

  // ── Collect all scannable files ──────────────────────────────
  let allFiles: string[] = [];
  try {
    allFiles = globSync('**/*', {
      cwd,
      nodir: true,
      ignore: SKIP_DIRS.map((d) => `**/${d}/**`),
      dot: true,
    }).filter((f) => !shouldSkipFile(f));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    printError(`Failed to glob files: ${msg}`);
    process.exit(1);
  }

  // ── Scan for secrets ─────────────────────────────────────────
  console.log(chalk.cyan('  🔍 Scanning files for secrets...'));
  const findings: ScanFinding[] = [];
  for (const relPath of allFiles) {
    const abs = path.join(cwd, relPath);
    findings.push(...scanFileForSecrets(abs));
  }

  // ── Run structural checks ────────────────────────────────────
  console.log(chalk.cyan('  📋 Running repository checks...\n'));
  const checks: CheckResult[] = [
    ...checkGitignore(cwd),
    ...checkEnvFilesInGit(cwd),
    ...checkLargeFiles(cwd),
    ...checkPackageLock(cwd),
  ];

  // ── Render checks table ──────────────────────────────────────
  const checksTable = new Table({
    head: [chalk.white.bold('Check'), chalk.white.bold('Status'), chalk.white.bold('Detail')],
    colWidths: [30, 10, 50],
    style: { head: [], border: ['cyan'] },
    wordWrap: true,
  });

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const c of checks) {
    if (c.status === 'pass') {
      checksTable.push([chalk.white(c.label), chalk.green('✅ Pass'), chalk.dim(c.detail)]);
      passCount++;
    } else if (c.status === 'warn') {
      checksTable.push([chalk.white(c.label), chalk.yellow('⚠️  Warn'), chalk.yellow(c.detail)]);
      warnCount++;
    } else {
      checksTable.push([chalk.white(c.label), chalk.red('❌ Fail'), chalk.red(c.detail)]);
      failCount++;
    }
  }

  console.log(checksTable.toString());

  // ── Render secrets findings ──────────────────────────────────
  if (findings.length > 0) {
    console.log('\n' + chalk.red.bold('  🚨 Secret Findings:\n'));

    const secretsTable = new Table({
      head: [
        chalk.white.bold('Severity'),
        chalk.white.bold('Pattern'),
        chalk.white.bold('File'),
        chalk.white.bold('Line'),
        chalk.white.bold('Snippet'),
        chalk.white.bold('Fix'),
      ],
      colWidths: [10, 22, 28, 6, 20, 38],
      style: { head: [], border: ['red'] },
      wordWrap: true,
    });

    for (const f of findings) {
      const relFile = path.relative(cwd, f.file);
      const sev =
        f.severity === 'critical' ? chalk.red.bold('CRITICAL') : chalk.yellow.bold('WARNING');
      secretsTable.push([
        sev,
        f.pattern.name,
        relFile,
        String(f.line),
        chalk.dim(f.snippet),
        chalk.dim(f.pattern.fix),
      ]);
      if (f.severity === 'critical') failCount++;
      else warnCount++;
    }

    console.log(secretsTable.toString());
  } else {
    printSuccess('No hardcoded secrets detected');
  }

  // ── Summary box ──────────────────────────────────────────────
  const summaryLines = [
    chalk.white.bold('Scan Summary'),
    '',
    `  ${chalk.green('✅ Passed:')}  ${passCount} checks`,
    `  ${chalk.yellow('⚠️  Warnings:')} ${warnCount}`,
    `  ${chalk.red('❌ Critical:')} ${failCount}`,
    '',
    findings.length > 0
      ? chalk.red('  Secrets detected — remediate before pushing!')
      : chalk.green('  No secrets found — looking clean! 🎉'),
  ];

  infoBox('🔒 EnvGuard Report', summaryLines);

  if (failCount > 0) {
    printError('Critical issues found. Fix them before pushing to GitHub.');
  } else if (warnCount > 0) {
    printWarning('Warnings found. Review before publishing.');
  } else {
    printSuccess('All checks passed! Safe to push. 🚀');
  }

  // ── Offer to generate .gitignore ─────────────────────────────
  console.log('');
  const { generateGi } = await inquirer.prompt<{ generateGi: boolean }>([
    {
      type: 'confirm',
      name: 'generateGi',
      message: chalk.cyan('Generate a .gitignore with best practices?'),
      default: !fs.existsSync(path.join(cwd, '.gitignore')),
    },
  ]);

  if (generateGi) {
    generateGitignore(cwd);
    successBox('✅ .gitignore created with best-practice patterns!');
  }
}
