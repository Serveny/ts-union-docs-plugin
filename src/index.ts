import * as ts from 'typescript/lib/tsserverlibrary';
import { UnionTypeDocsPlugin } from './plugin';

export = (mod: { typescript: typeof ts }) =>
  new UnionTypeDocsPlugin(mod.typescript);
