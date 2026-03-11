import { UnionInfo } from './info';
import type * as TS from 'typescript/lib/tsserverlibrary';
export declare function addExtraQuickInfo(_ts: typeof TS, quickInfo: TS.QuickInfo, typesInfo: UnionInfo[]): void;
export declare function createFallbackQuickInfo(ts: typeof TS, pos: number, typeInfo: UnionInfo[]): TS.QuickInfo;
