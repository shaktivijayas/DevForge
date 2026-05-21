import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { showSmallHeader, successBox, infoBox, errorBox, printSuccess, printWarning, printError } from '../utils/display';
import {
  getTasks,
  saveTask,
  updateTask,
  getTaskById,
  Task,
} from '../utils/storage';
import { randomUUID } from 'crypto';

type Priority = 'high' | 'medium' | 'low';

interface AddOptions {
  project?: string;
  priority?: Priority;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function priorityColor(p: Priority): string {
  if (p === 'high') return chalk.red(p);
  if (p === 'medium') return chalk.yellow(p);
  return chalk.green(p);
}

function statusColor(s: Task['status']): string {
  if (s === 'done') return chalk.green(s);
  if (s === 'in-progress') return chalk.cyan(s);
  return chalk.dim(s);
}

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Add task ──────────────────────────────────────────────────────────────────

function cmdAdd(title: string, opts: AddOptions): void {
  showSmallHeader('Task Manager — Add');

  if (!title.trim()) {
    printError('Task title cannot be empty.');
    return;
  }

  const task: Task = {
    id: randomUUID().slice(0, 8),
    title: title.trim(),
    project: opts.project?.trim() || 'general',
    priority: opts.priority || 'medium',
    status: 'pending',
    createdAt: new Date().toISOString(),
    pomodoroCount: 0,
  };

  saveTask(task);
  printSuccess(`Task added! ID: ${chalk.cyan(task.id)}`);
  console.log(chalk.dim(`  "${task.title}" [${task.project}] — ${task.priority} priority`));
}

// ── List tasks ────────────────────────────────────────────────────────────────

function cmdList(): void {
  showSmallHeader('Task Manager — All Tasks');

  const tasks = getTasks();
  if (tasks.length === 0) {
    printWarning('No tasks yet. Add one with: devforge task add "task name"');
    return;
  }

  const table = new Table({
    head: [
      chalk.white.bold('ID'),
      chalk.white.bold('Task'),
      chalk.white.bold('Project'),
      chalk.white.bold('Priority'),
      chalk.white.bold('Status'),
      chalk.white.bold('🍅'),
      chalk.white.bold('Created'),
    ],
    colWidths: [10, 32, 16, 10, 12, 5, 12],
    style: { head: [], border: ['cyan'] },
    wordWrap: true,
  });

  for (const t of tasks) {
    table.push([
      chalk.cyan(t.id),
      t.title,
      chalk.dim(t.project),
      priorityColor(t.priority),
      statusColor(t.status),
      t.pomodoroCount > 0 ? chalk.red(String(t.pomodoroCount)) : chalk.dim('0'),
      chalk.dim(formatAge(t.createdAt)),
    ]);
  }

  console.log(table.toString());
  console.log(chalk.dim(`\n  ${tasks.length} task(s) total`));
}

// ── Mark done ─────────────────────────────────────────────────────────────────

function cmdDone(id: string): void {
  showSmallHeader('Task Manager — Complete');

  const updated = updateTask(id, {
    status: 'done',
    completedAt: new Date().toISOString(),
  });

  if (!updated) {
    printError(`Task "${id}" not found.`);
    return;
  }

  successBox(`✅ Task "${id}" marked as done!\n\n  Great work — keep it up! 🎉`);
}

// ── Pomodoro timer ────────────────────────────────────────────────────────────

function renderCountdown(secondsLeft: number, taskTitle: string, progress: number): void {
  process.stdout.write('\x1b[2J\x1b[H'); // clear screen

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Big ASCII time
  const bigTime = figlet.textSync(timeStr, { font: 'Big' });
  console.log('\n' + gradient.cristal(bigTime));

  // Progress bar
  const barWidth = 40;
  const filled = Math.round((progress / 100) * barWidth);
  const bar = chalk.cyan('█'.repeat(filled)) + chalk.dim('░'.repeat(barWidth - filled));
  console.log(`\n  [${bar}] ${Math.round(progress)}%\n`);

  // Task name
  console.log(chalk.dim('  Focusing on: ') + chalk.white.bold(`"${taskTitle}"`));
  console.log(chalk.dim('\n  Press Ctrl+C to stop early'));
}

function encouragement(minsLeft: number): string {
  if (minsLeft === 20) return "🔥 20 minutes left — you're on fire!";
  if (minsLeft === 15) return "💪 15 minutes left — stay focused!";
  if (minsLeft === 10) return "⚡ 10 minutes left — almost halfway!";
  if (minsLeft === 5) return "🚀 5 minutes left — final stretch!";
  return '';
}

async function runCountdown(
  totalSeconds: number,
  taskTitle: string,
  isBreak = false
): Promise<void> {
  const label = isBreak ? 'Break' : 'Pomodoro';
  let secondsLeft = totalSeconds;

  return new Promise((resolve) => {
    let interval: NodeJS.Timeout;

    const tick = (): void => {
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
        console.log('\n  ' + chalk.cyan(enc));
      }

      secondsLeft--;
    };

    tick();
    interval = setInterval(tick, 1000);

    // Ctrl+C cleanup
    process.once('SIGINT', () => {
      clearInterval(interval);
      console.log(chalk.yellow('\n\n  Pomodoro stopped early.'));
      resolve();
    });
  });
}

async function cmdPomodoro(id: string): Promise<void> {
  showSmallHeader('Task Manager — Pomodoro');

  const task = getTaskById(id);
  if (!task) {
    printError(`Task "${id}" not found. Run "devforge task list" to see IDs.`);
    return;
  }

  console.log(
    '\n  Starting 25-minute Pomodoro for:\n  ' +
      chalk.cyan.bold(`"${task.title}"`) +
      chalk.dim(` [${task.project}]`) +
      '\n'
  );

  await sleep(1000);

  // ── 25-minute focus session ──────────────────────────────────
  await runCountdown(25 * 60, task.title);

  // Bell + celebration
  process.stdout.write('\x07');
  process.stdout.write('\x1b[2J\x1b[H');

  const doneText = figlet.textSync('DONE!', { font: 'Big' });
  console.log('\n' + gradient.rainbow(doneText));
  console.log(chalk.bold('\n  🎉 Pomodoro Complete!\n'));

  // Increment pomodoro count
  updateTask(id, { pomodoroCount: task.pomodoroCount + 1, status: 'in-progress' });

  console.log(chalk.dim(`  Total pomodoros for this task: ${task.pomodoroCount + 1}`));

  const { takeBreak } = await inquirer.prompt<{ takeBreak: boolean }>([
    {
      type: 'confirm',
      name: 'takeBreak',
      message: chalk.cyan('Take a 5-minute break?'),
      default: true,
    },
  ]);

  if (takeBreak) {
    console.log(chalk.green('\n  Starting 5-minute break... relax! 😌\n'));
    await sleep(1000);
    await runCountdown(5 * 60, task.title, true);

    process.stdout.write('\x07');
    process.stdout.write('\x1b[2J\x1b[H');

    const breakDone = figlet.textSync('Break!', { font: 'Small' });
    console.log('\n' + gradient.pastel(breakDone));
    console.log(chalk.cyan('\n  Break over! Ready for another Pomodoro? 💪\n'));
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function cmdStats(): void {
  showSmallHeader('Task Manager — Productivity Stats');

  const tasks = getTasks();

  if (tasks.length === 0) {
    printWarning('No tasks yet. Add one with: devforge task add "task name"');
    return;
  }

  const done = tasks.filter((t) => t.status === 'done');
  const pending = tasks.filter((t) => t.status !== 'done');
  const totalPomodoros = tasks.reduce((acc, t) => acc + t.pomodoroCount, 0);
  const focusHours = (totalPomodoros * 25) / 60;

  const projectMap = new Map<string, number>();
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

  const completionRate =
    tasks.length > 0 ? ((done.length / tasks.length) * 100).toFixed(1) : '0';

  infoBox('📊 Productivity Report', [
    `  ${chalk.white.bold('Total tasks:')}      ${tasks.length}`,
    `  ${chalk.green('Completed:')}        ${done.length}`,
    `  ${chalk.yellow('Pending:')}          ${pending.length}`,
    '',
    `  ${chalk.red('🍅 Pomodoros:')}      ${totalPomodoros}`,
    `  ${chalk.cyan('⏰ Focus time:')}     ${focusHours.toFixed(1)}h`,
    '',
    `  ${chalk.magenta('Top project:')}      ${topProject} (${topCount} 🍅)`,
    `  ${chalk.white('Completion rate:')}  ${completionRate}%`,
  ]);
}

// ── Task command entry point ──────────────────────────────────────────────────

export async function runTask(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case 'add': {
      const title = args[1] || '';
      const opts: AddOptions = {};
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--project' && args[i + 1]) opts.project = args[++i];
        if (args[i] === '--priority' && args[i + 1]) opts.priority = args[++i] as Priority;
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
        printError('Usage: devforge task done <id>');
        break;
      }
      cmdDone(id);
      break;
    }

    case 'pomodoro': {
      const id = args[1];
      if (!id) {
        printError('Usage: devforge task pomodoro <id>');
        break;
      }
      await cmdPomodoro(id);
      break;
    }

    case 'stats':
      cmdStats();
      break;

    default: {
      showSmallHeader('Task Manager');
      console.log(chalk.cyan('\n  Usage:\n'));
      const cmds = [
        ['devforge task add "title"', '--project <name> --priority high|medium|low'],
        ['devforge task list', 'Show all tasks in a table'],
        ['devforge task done <id>', 'Mark a task complete'],
        ['devforge task pomodoro <id>', 'Start 25-minute Pomodoro timer'],
        ['devforge task stats', 'Show productivity statistics'],
      ];
      for (const [cmd, desc] of cmds) {
        console.log(`  ${chalk.white(cmd.padEnd(38))} ${chalk.dim(desc)}`);
      }
      console.log('');
      break;
    }
  }
}
