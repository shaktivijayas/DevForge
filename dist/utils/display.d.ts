import { Ora } from 'ora';
export declare function showBanner(large?: boolean): void;
export declare function showSmallHeader(title: string): void;
export declare function successBox(message: string): void;
export declare function errorBox(message: string): void;
export declare function infoBox(title: string, lines: string[]): void;
export declare function createOraSpinner(text: string): Ora;
export declare function createNanoSpinner(text: string): import("nanospinner").Spinner;
export declare function printStep(step: number, total: number, msg: string): void;
export declare function printSuccess(msg: string): void;
export declare function printWarning(msg: string): void;
export declare function printError(msg: string): void;
export declare function printInfo(msg: string): void;
export declare function divider(): void;
//# sourceMappingURL=display.d.ts.map