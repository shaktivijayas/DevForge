"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showBanner = showBanner;
exports.showSmallHeader = showSmallHeader;
exports.successBox = successBox;
exports.errorBox = errorBox;
exports.infoBox = infoBox;
exports.createOraSpinner = createOraSpinner;
exports.createNanoSpinner = createNanoSpinner;
exports.printStep = printStep;
exports.printSuccess = printSuccess;
exports.printWarning = printWarning;
exports.printError = printError;
exports.printInfo = printInfo;
exports.divider = divider;
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const gradient_string_1 = __importDefault(require("gradient-string"));
const boxen_1 = __importDefault(require("boxen"));
const nanospinner_1 = require("nanospinner");
const ora_1 = __importDefault(require("ora"));
function showBanner(large = true) {
    const text = figlet_1.default.textSync('DevForge', {
        font: large ? 'Big' : 'Small',
        horizontalLayout: 'default',
    });
    console.log(gradient_string_1.default.cristal(text));
    if (large) {
        console.log(chalk_1.default.gray('  ') +
            chalk_1.default.dim('🔧 The Developer\'s CLI Toolkit — v1.0.0') +
            '\n');
    }
}
function showSmallHeader(title) {
    const line = gradient_string_1.default.pastel(`  ⚡ DevForge — ${title}`);
    console.log('\n' + line);
    console.log(chalk_1.default.dim('  ' + '─'.repeat(50)) + '\n');
}
function successBox(message) {
    console.log((0, boxen_1.default)(chalk_1.default.green(message), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
    }));
}
function errorBox(message) {
    console.log((0, boxen_1.default)(chalk_1.default.red(message), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red',
    }));
}
function infoBox(title, lines) {
    const content = lines.join('\n');
    console.log((0, boxen_1.default)(content, {
        title: chalk_1.default.cyan.bold(title),
        titleAlignment: 'center',
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
}
function createOraSpinner(text) {
    return (0, ora_1.default)({
        text: chalk_1.default.cyan(text),
        color: 'cyan',
    });
}
function createNanoSpinner(text) {
    return (0, nanospinner_1.createSpinner)(chalk_1.default.cyan(text));
}
function printStep(step, total, msg) {
    const badge = chalk_1.default.bgCyan.black(` ${step}/${total} `);
    console.log(`  ${badge} ${chalk_1.default.white(msg)}`);
}
function printSuccess(msg) {
    console.log(`  ${chalk_1.default.green('✅')} ${chalk_1.default.green(msg)}`);
}
function printWarning(msg) {
    console.log(`  ${chalk_1.default.yellow('⚠️ ')} ${chalk_1.default.yellow(msg)}`);
}
function printError(msg) {
    console.log(`  ${chalk_1.default.red('❌')} ${chalk_1.default.red(msg)}`);
}
function printInfo(msg) {
    console.log(`  ${chalk_1.default.blue('ℹ️ ')} ${chalk_1.default.blue(msg)}`);
}
function divider() {
    console.log(chalk_1.default.dim('  ' + '─'.repeat(50)));
}
//# sourceMappingURL=display.js.map