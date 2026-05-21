export interface SecretPattern {
    name: string;
    regex: RegExp;
    severity: 'critical' | 'warning';
    fix: string;
}
export declare const SECRET_PATTERNS: SecretPattern[];
export declare const GITIGNORE_REQUIRED: string[];
export declare const GITIGNORE_RECOMMENDED: string[];
export declare function maskSecret(value: string): string;
//# sourceMappingURL=patterns.d.ts.map