#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const display_1 = require("./utils/display");
const program = new commander_1.Command();
program
    .name('devforge')
    .version('1.0.0')
    .description(chalk_1.default.cyan('🔧 The Developer\'s CLI Toolkit'))
    .addHelpText('before', chalk_1.default.dim('\n  Run any command with --help for details.\n'));
// Lazy-load commands to keep startup fast
program
    .command('scaffold')
    .description('Interactive project scaffolder — create a full project structure')
    .action(async () => {
    const { runScaffold } = await Promise.resolve().then(() => __importStar(require('./commands/scaffold')));
    await runScaffold();
});
program
    .command('pulse')
    .description('Real-time GitHub stats dashboard in your terminal')
    .action(async () => {
    const { runPulse } = await Promise.resolve().then(() => __importStar(require('./commands/pulse')));
    await runPulse();
});
program
    .command('guard')
    .description('Security scanner — find secrets and leaks before you push')
    .action(async () => {
    const { runGuard } = await Promise.resolve().then(() => __importStar(require('./commands/guard')));
    await runGuard();
});
program
    .command('task')
    .description('Terminal todo manager + Pomodoro timer')
    .addHelpText('after', `
${chalk_1.default.cyan('Subcommands:')}
  ${chalk_1.default.white('devforge task add "name"')}   Add a new task
  ${chalk_1.default.white('devforge task list')}          List all tasks
  ${chalk_1.default.white('devforge task done <id>')}     Mark task complete
  ${chalk_1.default.white('devforge task pomodoro <id>')} Start 25-min Pomodoro
  ${chalk_1.default.white('devforge task stats')}         Productivity statistics
`)
    .allowUnknownOption()
    .action(async () => {
    // task subcommands handled inside
    const { runTask } = await Promise.resolve().then(() => __importStar(require('./commands/task')));
    await runTask(process.argv.slice(3));
});
// Show banner before help
program.on('--help', () => {
    console.log('');
});
// Show banner on bare invocation
if (process.argv.length === 2) {
    (0, display_1.showBanner)(true);
    program.help();
}
program.parseAsync(process.argv).catch((err) => {
    console.error(chalk_1.default.red('\n  ❌ ' + err.message));
    process.exit(1);
});
//# sourceMappingURL=index.js.map