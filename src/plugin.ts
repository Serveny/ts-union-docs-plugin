import type * as TS from 'typescript/lib/tsserverlibrary';
import {
	addDeprecatedCompletionEntryDetails,
	applyCompletionInfo,
	defaultComplInfo,
} from './completion';
import { createDeprecatedDiagnostics } from './diagnostics';
import { addExtraQuickInfo, createFallbackQuickInfo } from './docs';
import { TypeInfoFactory } from './info';

export class UnionTypeDocsPlugin {
	constructor(private readonly ts: typeof TS) {}

	create(info: TS.server.PluginCreateInfo) {
		const logger = info.project.projectService.logger,
			languageService = info.languageService,
			ts = this.ts,
			typeInfoFactory = new TypeInfoFactory(this.ts, languageService),
			proxy = createLanguageServiceProxy(languageService);

		proxy.getQuickInfoAtPosition = (fileName, pos) => {
			try {
				const typeInfo = typeInfoFactory.getTypeInfo(fileName, pos);
				const hasTypeInfo = typeInfo != null && typeInfo.length > 0;
				const quickInfo =
					languageService.getQuickInfoAtPosition(fileName, pos) ??
					(hasTypeInfo ? createFallbackQuickInfo(ts, pos, typeInfo) : undefined);
				if (!quickInfo || !hasTypeInfo) return quickInfo;

				addExtraQuickInfo(quickInfo, typeInfo);
				return quickInfo;
			} catch (err) {
				logPluginError(ts, logger, 'Quick Info', err);
				return languageService.getQuickInfoAtPosition(fileName, pos);
			}
		};

		proxy.getCompletionsAtPosition = (fileName, pos, opts, fmt) => {
			const completions =
				languageService.getCompletionsAtPosition(fileName, pos, opts, fmt) ??
				defaultComplInfo();

			try {
				const completionInfo = typeInfoFactory.getCompletionInfo(fileName, pos);
				if (completionInfo)
					applyCompletionInfo(ts, completions, completionInfo);
			} catch (err) {
				logPluginError(ts, logger, 'Completion', err);
			}

			return completions;
		};

		proxy.getCompletionEntryDetails = (
			fileName,
			position,
			name,
			formatOptions,
			source,
			preferences,
			data
		) => {
			const details = languageService.getCompletionEntryDetails(
				fileName,
				position,
				name,
				formatOptions,
				source,
				preferences,
				data
			);
			if (!details) return details;

			try {
				const entryInfo = typeInfoFactory.getCompletionEntryInfo(
					fileName,
					position,
					name
				);
				if (entryInfo) addDeprecatedCompletionEntryDetails(details, entryInfo);
			} catch (err) {
				logPluginError(ts, logger, 'Completion Details', err);
			}

			return details;
		};

		proxy.getSemanticDiagnostics = (fileName) => {
			const diagnostics = languageService.getSemanticDiagnostics(fileName);

			try {
				const usages = typeInfoFactory.getDeprecatedUsageInfos(fileName);
				return [...diagnostics, ...createDeprecatedDiagnostics(ts, usages)];
			} catch (err) {
				logPluginError(ts, logger, 'Semantic Diagnostics', err);
				return diagnostics;
			}
		};

		logger.info('[Union type docs plugin] Loaded');
		return proxy;
	}
}

function createLanguageServiceProxy(
	languageService: TS.LanguageService
): TS.LanguageService {
	const proxy = Object.create(null) as TS.LanguageService;
	for (const key of Object.keys(languageService) as Array<
		keyof TS.LanguageService
	>) {
		const value = languageService[key];
		(proxy as any)[key] =
			typeof value === 'function' ? value.bind(languageService) : value;
	}
	return proxy;
}

function logPluginError(
	ts: typeof TS,
	logger: TS.server.Logger,
	at: string,
	err: unknown
) {
	logger.msg(
		`[TS Union Docs ${at} Error]: ${errToString(err)}`,
		ts.server.Msg.Err
	);
}

function errToString(err: unknown): string {
	if (err instanceof Error) return `${err.message} | ${err.stack}`;
	if (typeof err === 'string') return err;
	return String(err);
}
