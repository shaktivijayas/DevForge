# DevForge

[![npm version](https://img.shields.io/npm/v/devforge?color=cyan&style=flat-square)](https://www.npmjs.com/package/devforge)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square)](https://www.typescriptlang.org)

> 🔧 **The Developer's CLI Toolkit** — scaffold projects, monitor GitHub stats, scan for secrets, and stay focused — all from your terminal.

[GIF]

---

## ✨ Features

| Command | Description |
|---------|-------------|
| `devforge scaffold` | Interactive project scaffolder for 6 popular stacks |
| `devforge pulse` | Real-time GitHub profile & repo stats dashboard |
| `devforge guard` | Security scanner — find secrets before you push |
| `devforge task` | Terminal todo manager + Pomodoro timer |

---

## 📦 Installation

```bash
npm install -g devforge
```

Or run without installing:

```bash
npx devforge --help
```

---

## 🚀 Commands

### `devforge scaffold`

Interactive project scaffolder — answer a few questions and get a complete, ready-to-run project structure.

**Supported templates:**
- ⚡ **Next.js 14** + Tailwind CSS + TypeScript
- 🐍 **FastAPI** + PostgreSQL + Docker
- 🍃 **MERN Stack** (MongoDB + Express + React + Node)
- 🚀 **Express** + TypeScript + PostgreSQL
- 🌶️ **Python Flask** + SQLAlchemy
- ⚛️ **React + Vite** + TypeScript + Tailwind

```bash
devforge scaffold
```

**What it does:**
1. Shows an ASCII art header in gradient cyan→purple
2. Prompts for project name, template, Docker, git, and dependency install
3. Creates the full folder structure with all config files
4. Optionally runs `git init` + initial commit
5. Optionally runs `npm install` or reminds you to `pip install`

[SCREENSHOT — scaffold]

---

### `devforge pulse`

A beautiful real-time GitHub stats dashboard rendered directly in your terminal using **blessed** and **blessed-contrib**.

```bash
devforge pulse
```

**Dashboard panels:**
- 👤 Profile — name, bio, location
- 📊 Stats — followers, following, repos, total stars, open-to-work badge
- 📁 Recent repos table — name, stars, forks, language, last updated
- ⭐ Stars bar chart — visual comparison across repos
- 🏆 Top repos by stars list

**Keyboard shortcuts:**
- `R` — refresh all data from GitHub API
- `Q` / `Esc` — quit

Your GitHub username is saved locally and reused on next run.

[SCREENSHOT — pulse]

---

### `devforge guard`

Security scanner that checks your project for hardcoded secrets, missing gitignore entries, and other bad practices before you push.

```bash
devforge guard
```

**What it scans for:**

| Pattern | Severity |
|---------|----------|
| AWS Access Keys (`AKIA...`) | 🔴 Critical |
| OpenAI API Keys (`sk-...`) | 🔴 Critical |
| GitHub Tokens (`ghp_`, `ghs_`) | 🔴 Critical |
| Private PEM keys | 🔴 Critical |
| PostgreSQL URLs with passwords | 🔴 Critical |
| JWT secrets | 🔴 Critical |
| Stripe secret keys | 🔴 Critical |
| Generic password assignments | 🟡 Warning |
| Generic API key assignments | 🟡 Warning |

**Repository checks:**
- ✅ `.gitignore` exists and covers `.env`, `node_modules`, etc.
- ✅ `.env` files not accidentally tracked by git
- ✅ No files over 50MB
- ✅ Lock file present

Offers to auto-generate a best-practice `.gitignore` at the end.

[SCREENSHOT — guard]

---

### `devforge task`

A persistent terminal-based todo manager with a built-in **Pomodoro timer** — focus sessions with ASCII countdown, progress bars, and encouraging messages.

```bash
# Add a task
devforge task add "Implement auth middleware" --project myapp --priority high

# List all tasks
devforge task list

# Mark complete
devforge task done <id>

# Start 25-minute Pomodoro
devforge task pomodoro <id>

# Productivity statistics
devforge task stats
```

**Task list output:**

```
┌──────────┬────────────────────────────────┬────────────┬──────────┬─────────┬─────┬────────────┐
│ ID       │ Task                           │ Project    │ Priority │ Status  │ 🍅  │ Created    │
├──────────┼────────────────────────────────┼────────────┼──────────┼─────────┼─────┼────────────┤
│ 3c62f19b │ Implement auth middleware      │ myapp      │ high     │ pending │ 2   │ 5m ago     │
└──────────┴────────────────────────────────┴────────────┴──────────┴─────────┴─────┴────────────┘
```

**Pomodoro timer features:**
- Big ASCII countdown using figlet
- Progress bar filling up in real time
- Encouraging messages at 20, 15, 10, and 5 minutes remaining
- Terminal bell on completion
- Optional 5-minute break countdown
- Pomodoro count tracked per task

[SCREENSHOT — pomodoro]

---

## 🛠️ Development

```bash
git clone https://github.com/shaktivijayas/DevForge.git
cd DevForge
npm install
npm run dev -- scaffold     # run scaffold command in dev mode
npm run dev -- task list    # run task list
npm run build               # compile TypeScript → dist/
```

**Project structure:**

```
src/
  index.ts              Main entry point (commander setup)
  commands/
    scaffold.ts         devforge scaffold
    pulse.ts            devforge pulse
    guard.ts            devforge guard
    task.ts             devforge task
  utils/
    display.ts          Shared UI: banners, boxes, spinners
    github.ts           GitHub API client
    storage.ts          conf-backed persistence
    patterns.ts         Secret regex patterns
  templates/
    nextjs.ts           Next.js file structure
    fastapi.ts          FastAPI file structure
    mern.ts             MERN stack file structure
    express.ts          Express file structure
    flask.ts            Flask file structure
    vite.ts             Vite + React file structure
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

Please follow the existing code style — strict TypeScript, no `any`, colorful output via chalk/gradient-string.

**Ideas for contributions:**
- New scaffold templates (Django, NestJS, Go Fiber, SvelteKit...)
- GitHub Actions integration for `guard`
- Task export to CSV / Markdown
- `pulse` support for organizations

---

## 📄 License

MIT © [shaktivijayas](https://github.com/shaktivijayas)

---

<p align="center">Built with ❤️ and too much coffee using <a href="https://claude.ai/code">Claude Code</a></p>
