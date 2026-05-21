"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GITIGNORE_RECOMMENDED = exports.GITIGNORE_REQUIRED = exports.SECRET_PATTERNS = void 0;
exports.maskSecret = maskSecret;
exports.SECRET_PATTERNS = [
    {
        name: 'AWS Access Key',
        regex: /AKIA[0-9A-Z]{16}/,
        severity: 'critical',
        fix: 'Remove from file, rotate key in AWS Console, add to .gitignore',
    },
    {
        name: 'OpenAI API Key',
        regex: /sk-[A-Za-z0-9]{48}/,
        severity: 'critical',
        fix: 'Remove from file, revoke key at platform.openai.com, add to .gitignore',
    },
    {
        name: 'GitHub Personal Access Token',
        regex: /gh[ps]_[A-Za-z0-9]{36}/,
        severity: 'critical',
        fix: 'Remove from file, revoke token at github.com/settings/tokens',
    },
    {
        name: 'Private Key (PEM)',
        regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
        severity: 'critical',
        fix: 'Never commit private keys. Use environment variables or key management services.',
    },
    {
        name: 'Database URL with Password',
        regex: /postgresql:\/\/[^:]+:[^@]+@/i,
        severity: 'critical',
        fix: 'Move to .env file and ensure .env is in .gitignore',
    },
    {
        name: 'Generic JWT Secret',
        regex: /jwt[_\-.]?secret[_\-.]?\s*[=:]\s*['"][^'"]{10,}['"]/i,
        severity: 'critical',
        fix: 'Move JWT secret to environment variable',
    },
    {
        name: 'Generic Secret Assignment',
        regex: /(?:secret|password|passwd|pwd)[_\-.]?\s*[=:]\s*['"][^'"]{8,}['"]/i,
        severity: 'warning',
        fix: 'Consider moving hardcoded credentials to environment variables',
    },
    {
        name: 'API Key Assignment',
        regex: /api[_\-.]?key\s*[=:]\s*['"][A-Za-z0-9_\-]{20,}['"]/i,
        severity: 'warning',
        fix: 'Move API key to environment variable',
    },
    {
        name: 'Stripe Secret Key',
        regex: /sk_live_[A-Za-z0-9]{24,}/,
        severity: 'critical',
        fix: 'Remove and rotate Stripe secret key at dashboard.stripe.com',
    },
    {
        name: 'Twilio Auth Token',
        regex: /[A-Fa-f0-9]{32}/,
        severity: 'warning',
        fix: 'Verify this is not a Twilio Auth Token or similar credential',
    },
];
exports.GITIGNORE_REQUIRED = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
    'node_modules',
    '__pycache__',
    '.DS_Store',
    '*.log',
];
exports.GITIGNORE_RECOMMENDED = [
    '.env.test',
    '.env.staging',
    'dist',
    'build',
    '.next',
    '__pycache__',
    '*.pyc',
    '.venv',
    'venv',
    '.idea',
    '.vscode',
];
function maskSecret(value) {
    if (value.length <= 8)
        return '****';
    const visible = 4;
    return value.slice(0, visible) + '****' + value.slice(-visible);
}
//# sourceMappingURL=patterns.js.map