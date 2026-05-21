#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { showBanner } from './utils/display';

const program = new Command();

program
  .name('devforge')
  .version('1.0.0')
  .description(chalk.cyan('🔧 The Developer\'s CLI Toolkit'))
  .addHelpText(
    'before',
    chalk.dim('\n  Run any command with --help for details.\n')
  );

// Lazy-load commands to keep startup fast
program
  .command('scaffold')
  .description('Interactive project scaffolder — create a full project structure')
  .action(async () => {
    const { runScaffold } = await import('./commands/scaffold');
    await runScaffold();
  });

program
  .command('pulse')
  .description('Real-time GitHub stats dashboard in your terminal')
  .action(async () => {
    const { runPulse } = await import('./commands/pulse');
    await runPulse();
  });

program
  .command('guard')
  .description('Security scanner — find secrets and leaks before you push')
  .action(async () => {
    const { runGuard } = await import('./commands/guard');
    await runGuard();
  });

program
  .command('task')
  .description('Terminal todo manager + Pomodoro timer')
  .addHelpText(
    'after',
    `
${chalk.cyan('Subcommands:')}
  ${chalk.white('devforge task add "name"')}   Add a new task
  ${chalk.white('devforge task list')}          List all tasks
  ${chalk.white('devforge task done <id>')}     Mark task complete
  ${chalk.white('devforge task pomodoro <id>')} Start 25-min Pomodoro
  ${chalk.white('devforge task stats')}         Productivity statistics
`
  )
  .allowUnknownOption()
  .action(async () => {
    // task subcommands handled inside
    const { runTask } = await import('./commands/task');
    await runTask(process.argv.slice(3));
  });

// Show banner before help
program.on('--help', () => {
  console.log('');
});

// Show banner on bare invocation
if (process.argv.length === 2) {
  showBanner(true);
  program.help();
}

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(chalk.red('\n  ❌ ' + err.message));
  process.exit(1);
});
