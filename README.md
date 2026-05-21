<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=DevForge&fontSize=60&fontColor=fff&animation=twinkling&fontAlignY=38&desc=Developer%27s%20CLI%20Swiss%20Army%20Knife%20%7C%20Scaffold%20%7C%20GitHub%20%7C%20Security%20%7C%20Pomodoro&descSize=15&descColor=fff&descAlignY=60" />

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://npmjs.com)
[![Commander](https://img.shields.io/badge/Commander-CLI%20Framework-gray?style=for-the-badge)](https://github.com/tj/commander.js)
[![blessed](https://img.shields.io/badge/blessed-Terminal%20UI-1C3C3C?style=for-the-badge)](https://github.com/chjj/blessed)

![License](https://img.shields.io/badge/License-MIT-00d4ff?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-Welcome-7c3aed?style=flat-square)
![Node](https://img.shields.io/badge/Node-%3E%3D18-brightgreen?style=flat-square)

</div>

---

## 🔧 What is DevForge?

**DevForge** is a production-ready developer CLI toolkit — one command, four powerful subcommands. Scaffold full-stack projects in seconds, monitor your GitHub profile in a real-time terminal dashboard, scan your codebase for secrets before you push, and run focused Pomodoro work sessions — all without leaving your terminal.

> One CLI to scaffold, monitor, secure, and focus. Built for developers who live in the terminal.

---

## ✨ Features

- ⚡ **Project Scaffolder** — 6 production-ready templates (Next.js, FastAPI, MERN, Express, Flask, Vite) with Docker, git, and dependency setup
- 📊 **GitHub Dashboard** — Real-time blessed TUI showing profile stats, repo table, and stars bar chart — press R to refresh
- 🔒 **Security Scanner** — Regex-based secret detection (AWS, OpenAI, GitHub tokens, private keys, DB URLs, JWTs) + gitignore auditor
- 🍅 **Pomodoro Timer** — Figlet ASCII countdown with progress bar, encouraging messages, bell on completion, and 5-minute break mode
- 💾 **Persistent Storage** — Tasks and GitHub username saved locally via `conf` — survives restarts
- 🎨 **Beautiful Output** — Gradient banners, boxen boxes, color-coded tables, ora spinners throughout every command

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Language** | TypeScript (strict mode) |
| **CLI Framework** | Commander.js |
| **Terminal UI** | blessed, blessed-contrib |
| **Prompts** | Inquirer.js |
| **Styling** | chalk, gradient-string, figlet, boxen |
| **HTTP** | axios (GitHub REST API v3) |
| **Storage** | conf (JSON persistence) |
| **File System** | fs-extra, glob |
| **Spinners** | ora, nanospinner |
| **Tables** | cli-table3 |

---

## 🏗️ Architecture

```
devforge
  ├── scaffold ──► inquirer prompts
  │                    │
  │               template engine ──► fs-extra write ──► git init ──► npm install
  │
  ├── pulse ──► GitHub API (axios)
  │                    │
  │               blessed grid ──► profile panel ──► repo table ──► stars chart
  │                    │
  │               R: refresh  ·  Q: quit
  │
  ├── guard ──► glob scan (all files)
  │                    │
  │               regex patterns ──► cli-table3 report ──► gitignore audit
  │                    │
  │               offer auto-generate .gitignore
  │
  └── task
        ├── add      ──► conf JSON storage
        ├── list     ──► color-coded cli-table3
        ├── done     ──► update status + timestamp
        ├── pomodoro ──► figlet countdown ──► terminal bell ──► 5-min break
        └── stats    ──► aggregated productivity report
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Install globally

```bash
npm install -g devforge
```

### Or run without installing

```bash
npx devforge --help
```

### Clone and run locally

```bash
git clone https://github.com/shaktivijayas/DevForge.git
cd DevForge
npm install
npm run dev -- --help
```

---

## 📋 Commands

### `devforge scaffold`

Interactive project scaffolder. Prompts for name, template, Docker, git init, and dependency install — then writes the complete project structure.

```bash
devforge scaffold
```

**Supported templates:**

| Template | Stack |
|:---|:---|
| ⚡ Next.js 14 | App Router + Tailwind CSS + TypeScript |
| 🐍 FastAPI | PostgreSQL + Docker + Alembic |
| 🍃 MERN Stack | MongoDB + Express + React + Node |
| 🚀 Express | TypeScript + PostgreSQL + JWT + Helmet |
| 🌶️ Flask | SQLAlchemy + Flask-Migrate + JWT |
| ⚛️ React + Vite | TypeScript + Tailwind CSS |

---

### `devforge pulse`

Real-time GitHub stats dashboard rendered in the terminal using **blessed** and **blessed-contrib**.

```bash
devforge pulse
```

**Dashboard layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ GitPulse — @username                              12:34:56   │
├──────────────────┬──────────────────────────────────────────────┤
│  👤 Profile      │  📁 Recent Repositories                      │
│  📊 Stats        │  ⭐ Stars Bar Chart                          │
│  🏆 Top Repos    │                                              │
├──────────────────┴──────────────────────────────────────────────┤
│  Press Q to quit | R to refresh | Last updated: 12:34:56        │
└─────────────────────────────────────────────────────────────────┘
```

- `R` — refresh all GitHub data live
- `Q` / `Esc` — quit with goodbye message

GitHub username is saved locally and reused on the next run.

---

### `devforge guard`

Scans the current project directory for hardcoded secrets, missing gitignore entries, and risky files before you push.

```bash
devforge guard
```

**Secret patterns detected:**

| Pattern | Severity |
|:---|:---|
| AWS Access Keys (`AKIA...`) | 🔴 Critical |
| OpenAI API Keys (`sk-...`) | 🔴 Critical |
| GitHub Tokens (`ghp_`, `ghs_`) | 🔴 Critical |
| Private PEM keys | 🔴 Critical |
| PostgreSQL URLs with passwords | 🔴 Critical |
| Stripe secret keys (`sk_live_...`) | 🔴 Critical |
| JWT secret assignments | 🔴 Critical |
| Generic password assignments | 🟡 Warning |
| Generic API key assignments | 🟡 Warning |

**Repository checks:** `.gitignore` completeness · `.env` git-tracking · files >50MB · lock file presence

Offers to auto-generate a best-practice `.gitignore` at the end.

---

### `devforge task`

Persistent terminal todo manager with a built-in Pomodoro timer. All tasks saved to local conf storage.

```bash
# Add a task
devforge task add "Implement auth middleware" --project myapp --priority high

# List all tasks (color-coded by priority)
devforge task list

# Mark complete
devforge task done <id>

# Start 25-minute Pomodoro with live ASCII countdown
devforge task pomodoro <id>

# Productivity stats
devforge task stats
```

**Pomodoro timer features:**
- Figlet ASCII clock counting down in real time
- Progress bar filling from 0% → 100%
- Encouraging messages at 20, 15, 10, and 5 minutes remaining
- Terminal bell on completion
- Optional 5-minute break countdown
- Pomodoro count tracked and displayed per task

---

## 📁 Project Structure

```
DevForge/
├── src/
│   ├── index.ts                 # Main entry — commander setup
│   ├── commands/
│   │   ├── scaffold.ts          # devforge scaffold
│   │   ├── pulse.ts             # devforge pulse
│   │   ├── guard.ts             # devforge guard
│   │   └── task.ts              # devforge task
│   ├── utils/
│   │   ├── display.ts           # Banners, boxes, spinners, icons
│   │   ├── github.ts            # GitHub REST API client (axios)
│   │   ├── storage.ts           # conf-backed task + username persistence
│   │   └── patterns.ts          # Secret regex patterns
│   └── templates/
│       ├── nextjs.ts            # Next.js 14 file structure
│       ├── fastapi.ts           # FastAPI file structure
│       ├── mern.ts              # MERN stack file structure
│       ├── express.ts           # Express + TypeScript file structure
│       ├── flask.ts             # Flask + SQLAlchemy file structure
│       └── vite.ts              # React + Vite file structure
├── dist/                        # Compiled output (auto-generated)
├── package.json
└── tsconfig.json
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

**Ideas for contributions:**
- New scaffold templates (Django, NestJS, Go Fiber, SvelteKit, T3 Stack...)
- GitHub Actions workflow generator in `guard`
- Task export to CSV or Markdown
- `pulse` support for GitHub organizations
- Notification sound customization for Pomodoro

---

## 👨‍💻 Author

**Shakti Vijay A S** — [GitHub](https://github.com/shaktivijayas) · [LinkedIn](https://www.linkedin.com/in/shaktidev/)

<div align="center">
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer&animation=twinkling" />
</div>
