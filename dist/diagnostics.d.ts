import { DeprecatedUsageInfo } from './info';
import type * as TS from 'typescript/lib/tsserverlibrary';
export declare function createDeprecatedSemanticDiagnostics(ts: typeof TS, usages: DeprecatedUsageInfo[]): TS.Diagnostic[];
