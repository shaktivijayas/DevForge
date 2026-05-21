"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScaffold = runScaffold;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const fs_extra_1 = __importDefault(require("fs-extra"));
const display_1 = require("../utils/display");
const display_2 = require("../utils/display");
const nextjs_1 = require("../templates/nextjs");
const fastapi_1 = require("../templates/fastapi");
const mern_1 = require("../templates/mern");
const express_1 = require("../templates/express");
const flask_1 = require("../templates/flask");
const vite_1 = require("../templates/vite");
const DOCKER_FILES = [
    {
        path: 'Dockerfile',
        content: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
`,
    },
    {
        path: 'docker-compose.yml',
        content: `version: "3.9"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
`,
    },
    {
        path: '.dockerignore',
        content: `node_modules
dist
.env
.git
`,
    },
];
function getTemplateFiles(template, projectName) {
    switch (template) {
        case 'Next.js 14 + Tailwind + TypeScript':
            return (0, nextjs_1.getNextjsFiles)(projectName);
        case 'FastAPI + PostgreSQL + Docker':
            return (0, fastapi_1.getFastapiFiles)(projectName);
        case 'MERN Stack (MongoDB + Express + React + Node)':
            return (0, mern_1.getMernFiles)(projectName);
        case 'Express + TypeScript + PostgreSQL':
            return (0, express_1.getExpressFiles)(projectName);
        case 'Python Flask + SQLAlchemy':
            return (0, flask_1.getFlaskFiles)(projectName);
        case 'React + Vite + TypeScript':
            return (0, vite_1.getViteFiles)(projectName);
    }
}
function isNodeTemplate(template) {
    return ['Next.js 14 + Tailwind + TypeScript', 'MERN Stack (MongoDB + Express + React + Node)', 'Express + TypeScript + PostgreSQL', 'React + Vite + TypeScript'].includes(template);
}
function isPythonTemplate(template) {
    return ['FastAPI + PostgreSQL + Docker', 'Python Flask + SQLAlchemy'].includes(template);
}
function hasBuiltInDocker(template) {
    return template === 'FastAPI + PostgreSQL + Docker';
}
async function writeFiles(targetDir, files) {
    for (const file of files) {
        const filePath = path_1.default.join(targetDir, file.path);
        await fs_extra_1.default.ensureDir(path_1.default.dirname(filePath));
        await fs_extra_1.default.writeFile(filePath, file.content, 'utf-8');
    }
}
async function runScaffold() {
    (0, display_1.showBanner)(true);
    (0, display_1.showSmallHeader)('Project Scaffolder');
    try {
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: chalk_1.default.cyan("What's your project name?"),
                validate: (input) => {
                    const trimmed = input.trim();
                    if (!trimmed)
                        return 'Project name cannot be empty.';
                    if (!/^[a-z0-9-_]+$/i.test(trimmed))
                        return 'Use only letters, numbers, hyphens, and underscores.';
                    return true;
                },
                filter: (input) => input.trim().toLowerCase().replace(/\s+/g, '-'),
            },
            {
                type: 'list',
                name: 'template',
                message: chalk_1.default.cyan('Choose a template:'),
                choices: [
                    { name: '⚡ Next.js 14 + Tailwind + TypeScript', value: 'Next.js 14 + Tailwind + TypeScript' },
                    { name: '🐍 FastAPI + PostgreSQL + Docker', value: 'FastAPI + PostgreSQL + Docker' },
                    { name: '🍃 MERN Stack (MongoDB + Express + React + Node)', value: 'MERN Stack (MongoDB + Express + React + Node)' },
                    { name: '🚀 Express + TypeScript + PostgreSQL', value: 'Express + TypeScript + PostgreSQL' },
                    { name: '🌶️  Python Flask + SQLAlchemy', value: 'Python Flask + SQLAlchemy' },
                    { name: '⚛️  React + Vite + TypeScript', value: 'React + Vite + TypeScript' },
                ],
            },
            {
                type: 'confirm',
                name: 'includeDocker',
                message: chalk_1.default.cyan('Include Docker setup?'),
                default: true,
                when: (ans) => !hasBuiltInDocker(ans.template),
            },
            {
                type: 'confirm',
                name: 'initGit',
                message: chalk_1.default.cyan('Initialize git?'),
                default: true,
            },
            {
                type: 'confirm',
                name: 'installDeps',
                message: chalk_1.default.cyan('Install dependencies?'),
                default: true,
            },
        ]);
        const { projectName, template, includeDocker, initGit, installDeps } = answers;
        const targetDir = path_1.default.join(process.cwd(), projectName);
        if (await fs_extra_1.default.pathExists(targetDir)) {
            (0, display_1.errorBox)(`Directory "${projectName}" already exists.\nPlease choose a different name or remove the existing directory.`);
            process.exit(1);
        }
        console.log('');
        const totalSteps = 3 + (initGit ? 1 : 0) + (installDeps ? 1 : 0);
        let step = 0;
        // Step 1: Create project structure
        step++;
        const spinner = (0, display_2.createOraSpinner)(`Creating project structure...`);
        spinner.start();
        await fs_extra_1.default.ensureDir(targetDir);
        const files = getTemplateFiles(template, projectName);
        await writeFiles(targetDir, files);
        // Add Docker if needed and not already included
        if (includeDocker && !hasBuiltInDocker(template) && isNodeTemplate(template)) {
            await writeFiles(targetDir, DOCKER_FILES);
        }
        spinner.succeed(chalk_1.default.green('Project structure created'));
        (0, display_1.printStep)(step, totalSteps, 'Files written');
        // Step 2: Copy .env.example to .env if it exists
        step++;
        const envExample = path_1.default.join(targetDir, '.env.example');
        if (await fs_extra_1.default.pathExists(envExample)) {
            await fs_extra_1.default.copy(envExample, path_1.default.join(targetDir, '.env'));
            (0, display_1.printSuccess)('.env created from .env.example');
        }
        (0, display_1.printStep)(step, totalSteps, 'Environment configured');
        // Step 3: Git init
        if (initGit) {
            step++;
            const gitSpinner = (0, display_2.createOraSpinner)('Initializing git repository...');
            gitSpinner.start();
            try {
                (0, child_process_1.execSync)('git init', { cwd: targetDir, stdio: 'ignore' });
                (0, child_process_1.execSync)('git add .', { cwd: targetDir, stdio: 'ignore' });
                (0, child_process_1.execSync)('git commit -m "Initial commit — scaffolded by DevForge"', {
                    cwd: targetDir,
                    stdio: 'ignore',
                });
                gitSpinner.succeed(chalk_1.default.green('Git initialized with initial commit'));
                (0, display_1.printStep)(step, totalSteps, 'Git ready');
            }
            catch {
                gitSpinner.warn(chalk_1.default.yellow('Git init failed — skipped'));
            }
        }
        // Step 4: Install dependencies
        if (installDeps) {
            step++;
            const installSpinner = (0, display_2.createOraSpinner)('Installing dependencies (this may take a moment)...');
            installSpinner.start();
            try {
                if (isNodeTemplate(template)) {
                    if (template === 'MERN Stack (MongoDB + Express + React + Node)') {
                        (0, child_process_1.execSync)('npm install', { cwd: path_1.default.join(targetDir, 'server'), stdio: 'ignore' });
                        (0, child_process_1.execSync)('npm install', { cwd: path_1.default.join(targetDir, 'client'), stdio: 'ignore' });
                    }
                    else {
                        (0, child_process_1.execSync)('npm install', { cwd: targetDir, stdio: 'ignore' });
                    }
                    installSpinner.succeed(chalk_1.default.green('npm install completed'));
                }
                else if (isPythonTemplate(template)) {
                    installSpinner.warn(chalk_1.default.yellow('Python detected — run: pip install -r requirements.txt'));
                }
                (0, display_1.printStep)(step, totalSteps, 'Dependencies installed');
            }
            catch {
                installSpinner.warn(chalk_1.default.yellow('Dependency install failed — run manually'));
            }
        }
        // Success box
        const nextSteps = isNodeTemplate(template)
            ? `→ cd ${projectName}\n  → ${template === 'Next.js 14 + Tailwind + TypeScript' ? 'npm run dev' : 'npm run dev'}`
            : `→ cd ${projectName}\n  → pip install -r requirements.txt\n  → python run.py`;
        (0, display_1.successBox)(`✅ Project "${projectName}" created successfully!\n\n  Template: ${template}\n\n  Next steps:\n  ${nextSteps}`);
    }
    catch (err) {
        if (err.message?.includes('force closed')) {
            console.log(chalk_1.default.dim('\n  Scaffold cancelled.'));
            return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        (0, display_1.errorBox)(`Scaffold failed: ${msg}`);
        process.exit(1);
    }
}
//# sourceMappingURL=scaffold.js.map