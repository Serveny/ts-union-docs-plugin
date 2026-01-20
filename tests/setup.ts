import * as ts from 'typescript/lib/tsserverlibrary';
import { vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { UnionTypeDocsPlugin } from '../src/plugin';

export function createProxyFromCase(relativeFilePath: string) {
	const absolutePath = path.resolve(process.cwd(), relativeFilePath);

	if (!fs.existsSync(absolutePath)) {
		throw new Error(`Test case file not found: ${absolutePath}`);
	}
	const code = fs.readFileSync(absolutePath, 'utf8');

	const compilerOptions: ts.CompilerOptions = {
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.CommonJS,
	};

	const host: ts.LanguageServiceHost = {
		getScriptFileNames: () => [absolutePath],
		getScriptVersion: () => '1',
		getScriptSnapshot: (name) => {
			if (name === absolutePath) return ts.ScriptSnapshot.fromString(code);
			if (fs.existsSync(name))
				return ts.ScriptSnapshot.fromString(fs.readFileSync(name, 'utf8'));
			return undefined;
		},
		getCurrentDirectory: () => process.cwd(),
		getCompilationSettings: () => compilerOptions,
		getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
		fileExists: (p) => fs.existsSync(p),
		readFile: (p) => fs.readFileSync(p, 'utf8'),
	};

	const languageService = ts.createLanguageService(host);

	const mockInfo: Partial<ts.server.PluginCreateInfo> = {
		languageService,
		project: {
			projectService: {
				logger: {
					info: vi.fn(),
					msg: vi.fn(),
					error: vi.fn(),
				},
			},
		} as any,
	};

	const plugin = new UnionTypeDocsPlugin(ts as any);
	const proxy = plugin.create(mockInfo as ts.server.PluginCreateInfo);

	// WARM-UP because of TypeScript lazy lib loading
	proxy.getQuickInfoAtPosition(absolutePath, 0);

	return { proxy, absolutePath, code };
}

export function tagsToText(quickInfo?: ts.QuickInfo): string | undefined {
	return quickInfo?.tags
		?.map((tag) => tag.text?.map((t) => t.text)?.join(''))
		.join('');
}

export function documentationToText(quickInfo?: ts.QuickInfo) {
	return quickInfo?.documentation?.map((tag) => tag.text).join('');
}

export function completionSnippetNames(
	completionInfo: ts.CompletionInfo
): string[] {
	return completionInfo.entries
		.filter((entry) => entry.isSnippet === true)
		.map((entry) => entry.name);
}
