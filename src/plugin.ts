import type * as TS from 'typescript/lib/tsserverlibrary';
import {
	addDeprecatedCompletionEntryDetails,
	applyCompletionInfo,
	defaultComplInfo,
} from './completion';
import { createDeprecatedSemanticDiagnostics } from './diagnostics';
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
				const quickInfo =
					languageService.getQuickInfoAtPosition(fileName, pos) ??
					(typeInfo ? createFallbackQuickInfo(ts, pos, typeInfo) : undefined);
				if (!quickInfo || !typeInfo) return quickInfo;

				addExtraQuickInfo(ts, quickInfo, typeInfo);
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
				logPluginError(this.ts, logger, 'Completion Details', err);
			}

			return details;
		};

		proxy.getSemanticDiagnostics = (fileName) =>
			appendDeprecatedDiagnostics(
				languageService.getSemanticDiagnostics(fileName),
				() =>
					createDeprecatedSemanticDiagnostics(
						this.ts,
						typeInfoFactory.getDeprecatedUsageInfos(fileName)
					),
				(err) => logPluginError(this.ts, logger, 'Semantic Diagnostics', err)
			);

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

function appendDeprecatedDiagnostics<TDiagnostic extends TS.Diagnostic>(
	diagnostics: readonly TDiagnostic[],
	createDiagnostics: () => TDiagnostic[],
	onError: (err: unknown) => void
): TDiagnostic[] {
	const nextDiagnostics = [...diagnostics];

	try {
		nextDiagnostics.push(...createDiagnostics());
	} catch (err) {
		onError(err);
	}

	return nextDiagnostics;
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
