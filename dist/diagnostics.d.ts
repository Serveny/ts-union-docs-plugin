import { DeprecatedUsageInfo } from './info';
import type * as TS from 'typescript/lib/tsserverlibrary';
export declare function createDeprecatedDiagnostics(ts: typeof TS, usages: DeprecatedUsageInfo[]): TS.DiagnosticWithLocation[];
