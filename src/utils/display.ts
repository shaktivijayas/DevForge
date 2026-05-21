import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import boxen from 'boxen';
import { createSpinner } from 'nanospinner';
import ora, { Ora } from 'ora';

export function showBanner(large = true): void {
  const text = figlet.textSync('DevForge', {
    font: large ? 'Big' : 'Small',
    horizontalLayout: 'default',
  });
  console.log(gradient.cristal(text));
  if (large) {
    console.log(
      chalk.gray('  ') +
        chalk.dim('🔧 The Developer\'s CLI Toolkit — v1.0.0') +
        '\n'
    );
  }
}

export function showSmallHeader(title: string): void {
  const line = gradient.pastel(`  ⚡ DevForge — ${title}`);
  console.log('\n' + line);
  console.log(chalk.dim('  ' + '─'.repeat(50)) + '\n');
}

export function successBox(message: string): void {
  console.log(
    boxen(chalk.green(message), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
    })
  );
}

export function errorBox(message: string): void {
  console.log(
    boxen(chalk.red(message), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'red',
    })
  );
}

export function infoBox(title: string, lines: string[]): void {
  const content = lines.join('\n');
  console.log(
    boxen(content, {
      title: chalk.cyan.bold(title),
      titleAlignment: 'center',
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  );
}

export function createOraSpinner(text: string): Ora {
  return ora({
    text: chalk.cyan(text),
    color: 'cyan',
  });
}

export function createNanoSpinner(text: string) {
  return createSpinner(chalk.cyan(text));
}

export function printStep(step: number, total: number, msg: string): void {
  const badge = chalk.bgCyan.black(` ${step}/${total} `);
  console.log(`  ${badge} ${chalk.white(msg)}`);
}

export function printSuccess(msg: string): void {
  console.log(`  ${chalk.green('✅')} ${chalk.green(msg)}`);
}

export function printWarning(msg: string): void {
  console.log(`  ${chalk.yellow('⚠️ ')} ${chalk.yellow(msg)}`);
}

export function printError(msg: string): void {
  console.log(`  ${chalk.red('❌')} ${chalk.red(msg)}`);
}

export function printInfo(msg: string): void {
  console.log(`  ${chalk.blue('ℹ️ ')} ${chalk.blue(msg)}`);
}

export function divider(): void {
  console.log(chalk.dim('  ' + '─'.repeat(50)));
}
