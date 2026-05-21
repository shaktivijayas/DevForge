import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import { execSync } from 'child_process';
import fse from 'fs-extra';
import { showBanner, showSmallHeader, successBox, errorBox, printStep, printSuccess } from '../utils/display';
import { createOraSpinner } from '../utils/display';
import { getNextjsFiles, TemplateFile } from '../templates/nextjs';
import { getFastapiFiles } from '../templates/fastapi';
import { getMernFiles } from '../templates/mern';
import { getExpressFiles } from '../templates/express';
import { getFlaskFiles } from '../templates/flask';
import { getViteFiles } from '../templates/vite';

type Template =
  | 'Next.js 14 + Tailwind + TypeScript'
  | 'FastAPI + PostgreSQL + Docker'
  | 'MERN Stack (MongoDB + Express + React + Node)'
  | 'Express + TypeScript + PostgreSQL'
  | 'Python Flask + SQLAlchemy'
  | 'React + Vite + TypeScript';

interface ScaffoldAnswers {
  projectName: string;
  template: Template;
  includeDocker: boolean;
  initGit: boolean;
  installDeps: boolean;
}

const DOCKER_FILES: TemplateFile[] = [
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

function getTemplateFiles(template: Template, projectName: string): TemplateFile[] {
  switch (template) {
    case 'Next.js 14 + Tailwind + TypeScript':
      return getNextjsFiles(projectName);
    case 'FastAPI + PostgreSQL + Docker':
      return getFastapiFiles(projectName);
    case 'MERN Stack (MongoDB + Express + React + Node)':
      return getMernFiles(projectName);
    case 'Express + TypeScript + PostgreSQL':
      return getExpressFiles(projectName);
    case 'Python Flask + SQLAlchemy':
      return getFlaskFiles(projectName);
    case 'React + Vite + TypeScript':
      return getViteFiles(projectName);
  }
}

function isNodeTemplate(template: Template): boolean {
  return ['Next.js 14 + Tailwind + TypeScript', 'MERN Stack (MongoDB + Express + React + Node)', 'Express + TypeScript + PostgreSQL', 'React + Vite + TypeScript'].includes(template);
}

function isPythonTemplate(template: Template): boolean {
  return ['FastAPI + PostgreSQL + Docker', 'Python Flask + SQLAlchemy'].includes(template);
}

function hasBuiltInDocker(template: Template): boolean {
  return template === 'FastAPI + PostgreSQL + Docker';
}

async function writeFiles(targetDir: string, files: TemplateFile[]): Promise<void> {
  for (const file of files) {
    const filePath = path.join(targetDir, file.path);
    await fse.ensureDir(path.dirname(filePath));
    await fse.writeFile(filePath, file.content, 'utf-8');
  }
}

export async function runScaffold(): Promise<void> {
  showBanner(true);
  showSmallHeader('Project Scaffolder');

  try {
    const answers = await inquirer.prompt<ScaffoldAnswers>([
      {
        type: 'input',
        name: 'projectName',
        message: chalk.cyan("What's your project name?"),
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) return 'Project name cannot be empty.';
          if (!/^[a-z0-9-_]+$/i.test(trimmed)) return 'Use only letters, numbers, hyphens, and underscores.';
          return true;
        },
        filter: (input: string) => input.trim().toLowerCase().replace(/\s+/g, '-'),
      },
      {
        type: 'list',
        name: 'template',
        message: chalk.cyan('Choose a template:'),
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
        message: chalk.cyan('Include Docker setup?'),
        default: true,
        when: (ans: Partial<ScaffoldAnswers>) => !hasBuiltInDocker(ans.template as Template),
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: chalk.cyan('Initialize git?'),
        default: true,
      },
      {
        type: 'confirm',
        name: 'installDeps',
        message: chalk.cyan('Install dependencies?'),
        default: true,
      },
    ]);

    const { projectName, template, includeDocker, initGit, installDeps } = answers;
    const targetDir = path.join(process.cwd(), projectName);

    if (await fse.pathExists(targetDir)) {
      errorBox(`Directory "${projectName}" already exists.\nPlease choose a different name or remove the existing directory.`);
      process.exit(1);
    }

    console.log('');
    const totalSteps = 3 + (initGit ? 1 : 0) + (installDeps ? 1 : 0);
    let step = 0;

    // Step 1: Create project structure
    step++;
    const spinner = createOraSpinner(`Creating project structure...`);
    spinner.start();

    await fse.ensureDir(targetDir);
    const files = getTemplateFiles(template, projectName);
    await writeFiles(targetDir, files);

    // Add Docker if needed and not already included
    if (includeDocker && !hasBuiltInDocker(template) && isNodeTemplate(template)) {
      await writeFiles(targetDir, DOCKER_FILES);
    }

    spinner.succeed(chalk.green('Project structure created'));
    printStep(step, totalSteps, 'Files written');

    // Step 2: Copy .env.example to .env if it exists
    step++;
    const envExample = path.join(targetDir, '.env.example');
    if (await fse.pathExists(envExample)) {
      await fse.copy(envExample, path.join(targetDir, '.env'));
      printSuccess('.env created from .env.example');
    }
    printStep(step, totalSteps, 'Environment configured');

    // Step 3: Git init
    if (initGit) {
      step++;
      const gitSpinner = createOraSpinner('Initializing git repository...');
      gitSpinner.start();
      try {
        execSync('git init', { cwd: targetDir, stdio: 'ignore' });
        execSync('git add .', { cwd: targetDir, stdio: 'ignore' });
        execSync('git commit -m "Initial commit — scaffolded by DevForge"', {
          cwd: targetDir,
          stdio: 'ignore',
        });
        gitSpinner.succeed(chalk.green('Git initialized with initial commit'));
        printStep(step, totalSteps, 'Git ready');
      } catch {
        gitSpinner.warn(chalk.yellow('Git init failed — skipped'));
      }
    }

    // Step 4: Install dependencies
    if (installDeps) {
      step++;
      const installSpinner = createOraSpinner('Installing dependencies (this may take a moment)...');
      installSpinner.start();
      try {
        if (isNodeTemplate(template)) {
          if (template === 'MERN Stack (MongoDB + Express + React + Node)') {
            execSync('npm install', { cwd: path.join(targetDir, 'server'), stdio: 'ignore' });
            execSync('npm install', { cwd: path.join(targetDir, 'client'), stdio: 'ignore' });
          } else {
            execSync('npm install', { cwd: targetDir, stdio: 'ignore' });
          }
          installSpinner.succeed(chalk.green('npm install completed'));
        } else if (isPythonTemplate(template)) {
          installSpinner.warn(chalk.yellow('Python detected — run: pip install -r requirements.txt'));
        }
        printStep(step, totalSteps, 'Dependencies installed');
      } catch {
        installSpinner.warn(chalk.yellow('Dependency install failed — run manually'));
      }
    }

    // Success box
    const nextSteps = isNodeTemplate(template)
      ? `→ cd ${projectName}\n  → ${template === 'Next.js 14 + Tailwind + TypeScript' ? 'npm run dev' : 'npm run dev'}`
      : `→ cd ${projectName}\n  → pip install -r requirements.txt\n  → python run.py`;

    successBox(
      `✅ Project "${projectName}" created successfully!\n\n  Template: ${template}\n\n  Next steps:\n  ${nextSteps}`
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).message?.includes('force closed')) {
      console.log(chalk.dim('\n  Scaffold cancelled.'));
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    errorBox(`Scaffold failed: ${msg}`);
    process.exit(1);
  }
}
