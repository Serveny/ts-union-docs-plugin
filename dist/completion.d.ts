import { CompletionContextInfo, UnionInfo } from './info';
import type * as TS from 'typescript/lib/tsserverlibrary';
export declare function applyCompletionInfo(ts: typeof TS, completion: TS.CompletionInfo, info: CompletionContextInfo): void;
export declare function addDeprecatedCompletionEntryDetails(details: TS.CompletionEntryDetails, unionInfo: UnionInfo): void;
export declare function defaultComplInfo(): TS.CompletionInfo;
