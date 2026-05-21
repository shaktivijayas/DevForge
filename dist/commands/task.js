"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTask = runTask;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const inquirer_1 = __importDefault(require("inquirer"));
const figlet_1 = __importDefault(require("figlet"));
const gradient_string_1 = __importDefault(require("gradient-string"));
const display_1 = require("../utils/display");
const storage_1 = require("../utils/storage");
const crypto_1 = require("crypto");
// ── Helpers ───────────────────────────────────────────────────────────────────
function priorityColor(p) {
    if (p === 'high')
        return chalk_1.default.red(p);
    if (p === 'medium')
        return chalk_1.default.yellow(p);
    return chalk_1.default.green(p);
}
function statusColor(s) {
    if (s === 'done')
        return chalk_1.default.green(s);
    if (s === 'in-progress')
        return chalk_1.default.cyan(s);
    return chalk_1.default.dim(s);
}
function formatAge(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)
        return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)
        return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// ── Add task ──────────────────────────────────────────────────────────────────
function cmdAdd(title, opts) {
    (0, display_1.showSmallHeader)('Task Manager — Add');
    if (!title.trim()) {
        (0, display_1.printError)('Task title cannot be empty.');
        return;
    }
    const task = {
        id: (0, crypto_1.randomUUID)().slice(0, 8),
        title: title.trim(),
        project: opts.project?.trim() || 'general',
        priority: opts.priority || 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        pomodoroCount: 0,
    };
    (0, storage_1.saveTask)(task);
    (0, display_1.printSuccess)(`Task added! ID: ${chalk_1.default.cyan(task.id)}`);
    console.log(chalk_1.default.dim(`  "${task.title}" [${task.project}] — ${task.priority} priority`));
}
// ── List tasks ────────────────────────────────────────────────────────────────
function cmdList() {
    (0, display_1.showSmallHeader)('Task Manager — All Tasks');
    const tasks = (0, storage_1.getTasks)();
    if (tasks.length === 0) {
        (0, display_1.printWarning)('No tasks yet. Add one with: devforge task add "task name"');
        return;
    }
    const table = new cli_table3_1.default({
        head: [
            chalk_1.default.white.bold('ID'),
            chalk_1.default.white.bold('Task'),
            chalk_1.default.white.bold('Project'),
            chalk_1.default.white.bold('Priority'),
            chalk_1.default.white.bold('Status'),
            chalk_1.default.white.bold('🍅'),
            chalk_1.default.white.bold('Created'),
        ],
        colWidths: [10, 32, 16, 10, 12, 5, 12],
        style: { head: [], border: ['cyan'] },
        wordWrap: true,
    });
    for (const t of tasks) {
        table.push([
            chalk_1.default.cyan(t.id),
            t.title,
            chalk_1.default.dim(t.project),
            priorityColor(t.priority),
            statusColor(t.status),
            t.pomodoroCount > 0 ? chalk_1.default.red(String(t.pomodoroCount)) : chalk_1.default.dim('0'),
            chalk_1.default.dim(formatAge(t.createdAt)),
        ]);
    }
    console.log(table.toString());
    console.log(chalk_1.default.dim(`\n  ${tasks.length} task(s) total`));
}
// ── Mark done ─────────────────────────────────────────────────────────────────
function cmdDone(id) {
    (0, display_1.showSmallHeader)('Task Manager — Complete');
    const updated = (0, storage_1.updateTask)(id, {
        status: 'done',
        completedAt: new Date().toISOString(),
    });
    if (!updated) {
        (0, display_1.printError)(`Task "${id}" not found.`);
        return;
    }
    (0, display_1.successBox)(`✅ Task "${id}" marked as done!\n\n  Great work — keep it up! 🎉`);
}
// ── Pomodoro timer ────────────────────────────────────────────────────────────
function renderCountdown(secondsLeft, taskTitle, progress) {
    process.stdout.write('\x1b[2J\x1b[H'); // clear screen
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    // Big ASCII time
    const bigTime = figlet_1.default.textSync(timeStr, { font: 'Big' });
    console.log('\n' + gradient_string_1.default.cristal(bigTime));
    // Progress bar
    const barWidth = 40;
    const filled = Math.round((progress / 100) * barWidth);
    const bar = chalk_1.default.cyan('█'.repeat(filled)) + chalk_1.default.dim('░'.repeat(barWidth - filled));
    console.log(`\n  [${bar}] ${Math.round(progress)}%\n`);
    // Task name
    console.log(chalk_1.default.dim('  Focusing on: ') + chalk_1.default.white.bold(`"${taskTitle}"`));
    console.log(chalk_1.default.dim('\n  Press Ctrl+C to stop early'));
}
function encouragement(minsLeft) {
    if (minsLeft === 20)
        return "🔥 20 minutes left — you're on fire!";
    if (minsLeft === 15)
        return "💪 15 minutes left — stay focused!";
    if (minsLeft === 10)
        return "⚡ 10 minutes left — almost halfway!";
    if (minsLeft === 5)
        return "🚀 5 minutes left — final stretch!";
    return '';
}
async function runCountdown(totalSeconds, taskTitle, isBreak = false) {
    const label = isBreak ? 'Break' : 'Pomodoro';
    let secondsLeft = totalSeconds;
    return new Promise((resolve) => {
        let interval;
        const tick = () => {
            if (secondsLeft < 0) {
                clearInterval(interval);
                resolve();
                return;
            }
            const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
            renderCountdown(secondsLeft, isBreak ? `[${label}] Rest!` : taskTitle, progress);
            const minsLeft = Math.floor(secondsLeft / 60);
            const enc = encouragement(minsLeft);
            if (enc && secondsLeft % 60 === 0) {
                console.log('\n  ' + chalk_1.default.cyan(enc));
            }
            secondsLeft--;
        };
        tick();
        interval = setInterval(tick, 1000);
        // Ctrl+C cleanup
        process.once('SIGINT', () => {
            clearInterval(interval);
            console.log(chalk_1.default.yellow('\n\n  Pomodoro stopped early.'));
            resolve();
        });
    });
}
async function cmdPomodoro(id) {
    (0, display_1.showSmallHeader)('Task Manager — Pomodoro');
    const task = (0, storage_1.getTaskById)(id);
    if (!task) {
        (0, display_1.printError)(`Task "${id}" not found. Run "devforge task list" to see IDs.`);
        return;
    }
    console.log('\n  Starting 25-minute Pomodoro for:\n  ' +
        chalk_1.default.cyan.bold(`"${task.title}"`) +
        chalk_1.default.dim(` [${task.project}]`) +
        '\n');
    await sleep(1000);
    // ── 25-minute focus session ──────────────────────────────────
    await runCountdown(25 * 60, task.title);
    // Bell + celebration
    process.stdout.write('\x07');
    process.stdout.write('\x1b[2J\x1b[H');
    const doneText = figlet_1.default.textSync('DONE!', { font: 'Big' });
    console.log('\n' + gradient_string_1.default.rainbow(doneText));
    console.log(chalk_1.default.bold('\n  🎉 Pomodoro Complete!\n'));
    // Increment pomodoro count
    (0, storage_1.updateTask)(id, { pomodoroCount: task.pomodoroCount + 1, status: 'in-progress' });
    console.log(chalk_1.default.dim(`  Total pomodoros for this task: ${task.pomodoroCount + 1}`));
    const { takeBreak } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'takeBreak',
            message: chalk_1.default.cyan('Take a 5-minute break?'),
            default: true,
        },
    ]);
    if (takeBreak) {
        console.log(chalk_1.default.green('\n  Starting 5-minute break... relax! 😌\n'));
        await sleep(1000);
        await runCountdown(5 * 60, task.title, true);
        process.stdout.write('\x07');
        process.stdout.write('\x1b[2J\x1b[H');
        const breakDone = figlet_1.default.textSync('Break!', { font: 'Small' });
        console.log('\n' + gradient_string_1.default.pastel(breakDone));
        console.log(chalk_1.default.cyan('\n  Break over! Ready for another Pomodoro? 💪\n'));
    }
}
// ── Stats ─────────────────────────────────────────────────────────────────────
function cmdStats() {
    (0, display_1.showSmallHeader)('Task Manager — Productivity Stats');
    const tasks = (0, storage_1.getTasks)();
    if (tasks.length === 0) {
        (0, display_1.printWarning)('No tasks yet. Add one with: devforge task add "task name"');
        return;
    }
    const done = tasks.filter((t) => t.status === 'done');
    const pending = tasks.filter((t) => t.status !== 'done');
    const totalPomodoros = tasks.reduce((acc, t) => acc + t.pomodoroCount, 0);
    const focusHours = (totalPomodoros * 25) / 60;
    const projectMap = new Map();
    for (const t of tasks) {
        const count = projectMap.get(t.project) || 0;
        projectMap.set(t.project, count + t.pomodoroCount);
    }
    let topProject = 'N/A';
    let topCount = 0;
    for (const [proj, count] of projectMap) {
        if (count > topCount) {
            topCount = count;
            topProject = proj;
        }
    }
    const completionRate = tasks.length > 0 ? ((done.length / tasks.length) * 100).toFixed(1) : '0';
    (0, display_1.infoBox)('📊 Productivity Report', [
        `  ${chalk_1.default.white.bold('Total tasks:')}      ${tasks.length}`,
        `  ${chalk_1.default.green('Completed:')}        ${done.length}`,
        `  ${chalk_1.default.yellow('Pending:')}          ${pending.length}`,
        '',
        `  ${chalk_1.default.red('🍅 Pomodoros:')}      ${totalPomodoros}`,
        `  ${chalk_1.default.cyan('⏰ Focus time:')}     ${focusHours.toFixed(1)}h`,
        '',
        `  ${chalk_1.default.magenta('Top project:')}      ${topProject} (${topCount} 🍅)`,
        `  ${chalk_1.default.white('Completion rate:')}  ${completionRate}%`,
    ]);
}
// ── Task command entry point ──────────────────────────────────────────────────
async function runTask(args) {
    const subcommand = args[0];
    switch (subcommand) {
        case 'add': {
            const title = args[1] || '';
            const opts = {};
            for (let i = 2; i < args.length; i++) {
                if (args[i] === '--project' && args[i + 1])
                    opts.project = args[++i];
                if (args[i] === '--priority' && args[i + 1])
                    opts.priority = args[++i];
            }
            cmdAdd(title, opts);
            break;
        }
        case 'list':
            cmdList();
            break;
        case 'done': {
            const id = args[1];
            if (!id) {
                (0, display_1.printError)('Usage: devforge task done <id>');
                break;
            }
            cmdDone(id);
            break;
        }
        case 'pomodoro': {
            const id = args[1];
            if (!id) {
                (0, display_1.printError)('Usage: devforge task pomodoro <id>');
                break;
            }
            await cmdPomodoro(id);
            break;
        }
        case 'stats':
            cmdStats();
            break;
        default: {
            (0, display_1.showSmallHeader)('Task Manager');
            console.log(chalk_1.default.cyan('\n  Usage:\n'));
            const cmds = [
                ['devforge task add "title"', '--project <name> --priority high|medium|low'],
                ['devforge task list', 'Show all tasks in a table'],
                ['devforge task done <id>', 'Mark a task complete'],
                ['devforge task pomodoro <id>', 'Start 25-minute Pomodoro timer'],
                ['devforge task stats', 'Show productivity statistics'],
            ];
            for (const [cmd, desc] of cmds) {
                console.log(`  ${chalk_1.default.white(cmd.padEnd(38))} ${chalk_1.default.dim(desc)}`);
            }
            console.log('');
            break;
        }
    }
}
//# sourceMappingURL=task.js.map