"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGuard = runGuard;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const inquirer_1 = __importDefault(require("inquirer"));
const glob_1 = require("glob");
const display_1 = require("../utils/display");
const patterns_1 = require("../utils/patterns");
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.venv', 'venv', 'coverage'];
const SKIP_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.bin', '.lock'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
function shouldSkipFile(filePath) {
    const parts = filePath.split(path_1.default.sep);
    if (parts.some((p) => SKIP_DIRS.includes(p)))
        return true;
    const ext = path_1.default.extname(filePath).toLowerCase();
    return SKIP_EXTS.includes(ext);
}
function scanFileForSecrets(filePath) {
    const findings = [];
    try {
        const stat = fs_1.default.statSync(filePath);
        if (stat.size > MAX_FILE_SIZE)
            return findings;
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            for (const pattern of patterns_1.SECRET_PATTERNS) {
                const match = pattern.regex.exec(line);
                if (match) {
                    findings.push({
                        severity: pattern.severity,
                        file: filePath,
                        line: idx + 1,
                        pattern,
                        snippet: (0, patterns_1.maskSecret)(match[0]),
                    });
                    break; // one finding per line
                }
            }
        });
    }
    catch {
        // unreadable file — skip
    }
    return findings;
}
function checkGitignore(cwd) {
    const results = [];
    const giPath = path_1.default.join(cwd, '.gitignore');
    if (!fs_1.default.existsSync(giPath)) {
        results.push({
            label: '.gitignore exists',
            status: 'fail',
            detail: 'No .gitignore found — secrets may be committed accidentally',
        });
        return results;
    }
    results.push({ label: '.gitignore exists', status: 'pass', detail: '.gitignore present' });
    const content = fs_1.default.readFileSync(giPath, 'utf-8');
    for (const entry of patterns_1.GITIGNORE_REQUIRED) {
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
function checkEnvFilesInGit(cwd) {
    const results = [];
    const gitIndex = path_1.default.join(cwd, '.git', 'index');
    if (!fs_1.default.existsSync(gitIndex)) {
        results.push({
            label: 'Git repository check',
            status: 'warn',
            detail: 'Not a git repository — skipping git index check',
        });
        return results;
    }
    // Read the git index as binary and search for .env patterns
    const indexContent = fs_1.default.readFileSync(gitIndex);
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
function checkLargeFiles(cwd) {
    const results = [];
    const MB50 = 50 * 1024 * 1024;
    try {
        const files = (0, glob_1.globSync)('**/*', {
            cwd,
            nodir: true,
            ignore: SKIP_DIRS.map((d) => `**/${d}/**`),
        });
        const large = files.filter((f) => {
            try {
                return fs_1.default.statSync(path_1.default.join(cwd, f)).size > MB50;
            }
            catch {
                return false;
            }
        });
        if (large.length === 0) {
            results.push({ label: 'No files >50MB', status: 'pass', detail: 'All files within size limits' });
        }
        else {
            large.forEach((f) => {
                const size = (fs_1.default.statSync(path_1.default.join(cwd, f)).size / 1024 / 1024).toFixed(1);
                results.push({
                    label: `Large file: ${f}`,
                    status: 'warn',
                    detail: `${f} is ${size}MB — consider git-lfs or removing from repo`,
                });
            });
        }
    }
    catch {
        results.push({ label: 'Large file check', status: 'warn', detail: 'Could not complete large file scan' });
    }
    return results;
}
function checkPackageLock(cwd) {
    const hasLock = fs_1.default.existsSync(path_1.default.join(cwd, 'package-lock.json')) ||
        fs_1.default.existsSync(path_1.default.join(cwd, 'yarn.lock')) ||
        fs_1.default.existsSync(path_1.default.join(cwd, 'pnpm-lock.yaml'));
    return [
        {
            label: 'Lock file present',
            status: hasLock ? 'pass' : 'warn',
            detail: hasLock ? 'Dependency lock file found' : 'No lock file — add package-lock.json or yarn.lock',
        },
    ];
}
function generateGitignore(cwd) {
    const all = [...new Set([...patterns_1.GITIGNORE_REQUIRED, ...patterns_1.GITIGNORE_RECOMMENDED])];
    const content = '# Generated by DevForge Guard\n\n' +
        '# Environment\n' +
        ['.env', '.env.local', '.env.production', '.env.development', '.env.test', '.env.staging']
            .map((e) => e)
            .join('\n') +
        '\n\n# Dependencies\nnode_modules/\n\n# Build output\ndist/\nbuild/\n.next/\n\n' +
        '# Python\n__pycache__/\n*.pyc\n.venv/\nvenv/\n\n# OS\n.DS_Store\nThumbs.db\n\n' +
        '# IDE\n.idea/\n.vscode/\n\n# Logs\n*.log\nnpm-debug.log*\n';
    void all; // all is already spread above for dedup
    fs_1.default.writeFileSync(path_1.default.join(cwd, '.gitignore'), content, 'utf-8');
    (0, display_1.printSuccess)('.gitignore generated with best practices!');
}
async function runGuard() {
    (0, display_1.showSmallHeader)('EnvGuard — Security Scanner');
    console.log(chalk_1.default.dim('  Scanning current directory for secrets and vulnerabilities...\n'));
    const cwd = process.cwd();
    // ── Collect all scannable files ──────────────────────────────
    let allFiles = [];
    try {
        allFiles = (0, glob_1.globSync)('**/*', {
            cwd,
            nodir: true,
            ignore: SKIP_DIRS.map((d) => `**/${d}/**`),
            dot: true,
        }).filter((f) => !shouldSkipFile(f));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        (0, display_1.printError)(`Failed to glob files: ${msg}`);
        process.exit(1);
    }
    // ── Scan for secrets ─────────────────────────────────────────
    console.log(chalk_1.default.cyan('  🔍 Scanning files for secrets...'));
    const findings = [];
    for (const relPath of allFiles) {
        const abs = path_1.default.join(cwd, relPath);
        findings.push(...scanFileForSecrets(abs));
    }
    // ── Run structural checks ────────────────────────────────────
    console.log(chalk_1.default.cyan('  📋 Running repository checks...\n'));
    const checks = [
        ...checkGitignore(cwd),
        ...checkEnvFilesInGit(cwd),
        ...checkLargeFiles(cwd),
        ...checkPackageLock(cwd),
    ];
    // ── Render checks table ──────────────────────────────────────
    const checksTable = new cli_table3_1.default({
        head: [chalk_1.default.white.bold('Check'), chalk_1.default.white.bold('Status'), chalk_1.default.white.bold('Detail')],
        colWidths: [30, 10, 50],
        style: { head: [], border: ['cyan'] },
        wordWrap: true,
    });
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;
    for (const c of checks) {
        if (c.status === 'pass') {
            checksTable.push([chalk_1.default.white(c.label), chalk_1.default.green('✅ Pass'), chalk_1.default.dim(c.detail)]);
            passCount++;
        }
        else if (c.status === 'warn') {
            checksTable.push([chalk_1.default.white(c.label), chalk_1.default.yellow('⚠️  Warn'), chalk_1.default.yellow(c.detail)]);
            warnCount++;
        }
        else {
            checksTable.push([chalk_1.default.white(c.label), chalk_1.default.red('❌ Fail'), chalk_1.default.red(c.detail)]);
            failCount++;
        }
    }
    console.log(checksTable.toString());
    // ── Render secrets findings ──────────────────────────────────
    if (findings.length > 0) {
        console.log('\n' + chalk_1.default.red.bold('  🚨 Secret Findings:\n'));
        const secretsTable = new cli_table3_1.default({
            head: [
                chalk_1.default.white.bold('Severity'),
                chalk_1.default.white.bold('Pattern'),
                chalk_1.default.white.bold('File'),
                chalk_1.default.white.bold('Line'),
                chalk_1.default.white.bold('Snippet'),
                chalk_1.default.white.bold('Fix'),
            ],
            colWidths: [10, 22, 28, 6, 20, 38],
            style: { head: [], border: ['red'] },
            wordWrap: true,
        });
        for (const f of findings) {
            const relFile = path_1.default.relative(cwd, f.file);
            const sev = f.severity === 'critical' ? chalk_1.default.red.bold('CRITICAL') : chalk_1.default.yellow.bold('WARNING');
            secretsTable.push([
                sev,
                f.pattern.name,
                relFile,
                String(f.line),
                chalk_1.default.dim(f.snippet),
                chalk_1.default.dim(f.pattern.fix),
            ]);
            if (f.severity === 'critical')
                failCount++;
            else
                warnCount++;
        }
        console.log(secretsTable.toString());
    }
    else {
        (0, display_1.printSuccess)('No hardcoded secrets detected');
    }
    // ── Summary box ──────────────────────────────────────────────
    const summaryLines = [
        chalk_1.default.white.bold('Scan Summary'),
        '',
        `  ${chalk_1.default.green('✅ Passed:')}  ${passCount} checks`,
        `  ${chalk_1.default.yellow('⚠️  Warnings:')} ${warnCount}`,
        `  ${chalk_1.default.red('❌ Critical:')} ${failCount}`,
        '',
        findings.length > 0
            ? chalk_1.default.red('  Secrets detected — remediate before pushing!')
            : chalk_1.default.green('  No secrets found — looking clean! 🎉'),
    ];
    (0, display_1.infoBox)('🔒 EnvGuard Report', summaryLines);
    if (failCount > 0) {
        (0, display_1.printError)('Critical issues found. Fix them before pushing to GitHub.');
    }
    else if (warnCount > 0) {
        (0, display_1.printWarning)('Warnings found. Review before publishing.');
    }
    else {
        (0, display_1.printSuccess)('All checks passed! Safe to push. 🚀');
    }
    // ── Offer to generate .gitignore ─────────────────────────────
    console.log('');
    const { generateGi } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'generateGi',
            message: chalk_1.default.cyan('Generate a .gitignore with best practices?'),
            default: !fs_1.default.existsSync(path_1.default.join(cwd, '.gitignore')),
        },
    ]);
    if (generateGi) {
        generateGitignore(cwd);
        (0, display_1.successBox)('✅ .gitignore created with best-practice patterns!');
    }
}
//# sourceMappingURL=guard.js.map