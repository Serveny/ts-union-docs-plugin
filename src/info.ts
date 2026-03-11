import type * as TS from 'typescript/lib/tsserverlibrary';

// The supported start points for union documentation and completions
export enum SupportedType {
	Parameter,
	Variable,
}

// This class holds every type information the plugin needs
export class UnionInfo {
	constructor(
		public type: SupportedType,
		public name: string,
		public initNode: CalledNode,
		// Can be multiple nodes because different union types can have same values
		public entries: CalledNode[],
		public value?: string,
		public docComment?: string[],
		public tags?: TS.JSDocTagInfo[]
	) {}
}

export interface CompletionContextInfo {
	initNode: TS.Expression;
	templateInfo: UnionInfo | null;
	entryInfos: UnionInfo[];
}

export interface DeprecatedUsageInfo {
	node: TS.Expression;
	info: UnionInfo;
}

export interface CalledNode extends TS.Node {
	id?: number;
	callParent?: CalledNode; // The node that references to it
	original?: TS.Node; // For resolved nodes
	isRegexPattern?: boolean; // For template syntax like ${number}
	codeText?: string;
}

export class TypeInfoFactory {
	private checker!: TS.TypeChecker;
	private currentProgram: TS.Program | null = null;
	private sourceFileCache = new Map<string, TS.SourceFile | null>();
	private typeInfoCache = new Map<string, UnionInfo[] | null>();
	private completionInfoCache = new Map<string, CompletionContextInfo | null>();
	private deprecatedUsageCache = new Map<string, DeprecatedUsageInfo[]>();

	constructor(
		private ts: typeof TS,
		private ls: TS.LanguageService
	) {}

	getTypeInfo(fileName: string, position: number): UnionInfo[] | null {
		const cacheKey = `${fileName}:${position}`;
		if (this.typeInfoCache.has(cacheKey)) {
			return this.typeInfoCache.get(cacheKey) ?? null;
		}

		const node = this.getInitNode(fileName, position);
		const result = node ? this.getTypeInfoForNode(node) : null;
		this.typeInfoCache.set(cacheKey, result);
		return result;
	}

	getCompletionInfo(
		fileName: string,
		position: number
	): CompletionContextInfo | null {
		const cacheKey = `${fileName}:${position}`;
		if (this.completionInfoCache.has(cacheKey)) {
			return this.completionInfoCache.get(cacheKey) ?? null;
		}

		const context = this.getCompletionContext(fileName, position);
		if (!context) {
			this.completionInfoCache.set(cacheKey, null);
			return null;
		}

		const unionMemberNodes = this.collectUnionMemberNodes(context.typeNode);
		const templateEntries = this.filterRegexMembers(
			unionMemberNodes,
			context.contextualType
		);

		const result = {
			initNode: context.node,
			templateInfo:
				templateEntries.length === 0
					? null
					: this.createUnionInfo(
							SupportedType.Variable,
							'completion',
							context.node,
							templateEntries
						),
			entryInfos: this.createCompletionEntryInfos(
				context.node,
				unionMemberNodes
			),
		};
		this.completionInfoCache.set(cacheKey, result);
		return result;
	}

	getCompletionEntryInfo(
		fileName: string,
		position: number,
		entryName: string
	): UnionInfo | null {
		return (
			this.getCompletionInfo(fileName, position)?.entryInfos.find(
				(info) => info.name === entryName
			) ?? null
		);
	}

	getDeprecatedUsageInfos(fileName: string): DeprecatedUsageInfo[] {
		const cached = this.deprecatedUsageCache.get(fileName);
		if (cached) return cached;

		const sourceFile = this.getSourceFile(fileName);
		if (!sourceFile) return [];

		const usages: DeprecatedUsageInfo[] = [];
		const seen = new Set<number>();
		const visit = (node: TS.Node) => {
			if (isDeprecatedUsageNode(this.ts, node)) {
				for (const info of this.getTypeInfoForExpression(node)) {
					if (!getDeprecatedTag(info.tags)) continue;

					const start = node.getStart(sourceFile);
					if (seen.has(start)) continue;
					seen.add(start);
					usages.push({ node, info });
				}
			}

			this.ts.forEachChild(node, visit);
		};

		visit(sourceFile);
		this.deprecatedUsageCache.set(fileName, usages);
		return usages;
	}

	private getTypeInfoForNode(node: TS.Node): UnionInfo[] | null {
		const callExpression = this.getCallExpression(node);
		if (callExpression) return this.getUnionParametersInfo(callExpression);

		if (this.ts.isExpression(node)) {
			const contextualInfo = this.getUnionExpressionInfo(node);
			if (contextualInfo) return [contextualInfo];
		}

		const symbol = this.checker.getSymbolAtLocation(node);
		if (!symbol) return null;

		const variableInfo = this.getUnionVariableInfo(symbol);
		return variableInfo ? [variableInfo] : null;
	}

	private getTypeInfoForExpression(expr: TS.Expression): UnionInfo[] {
		const argumentInfo = this.getUnionInfoForArgument(expr);
		if (argumentInfo) return [argumentInfo];

		const contextualInfo = this.getUnionExpressionInfo(expr);
		return contextualInfo ? [contextualInfo] : [];
	}

	private getUnionInfoForArgument(expr: TS.Expression): UnionInfo | null {
		const callLike = this.findCallLikeExpression(expr);
		if (!callLike) return null;

		const argIndex = callLike.arguments?.indexOf(expr as any) ?? -1;
		if (argIndex < 0) return null;

		const signature = this.checker.getResolvedSignature(callLike);
		const paramSymbol = signature?.getParameters()[argIndex];
		return paramSymbol ? this.getUnionInfo(paramSymbol, expr) : null;
	}

	private getCompletionContext(fileName: string, position: number) {
		const node = this.getInitNode(fileName, position);
		if (!node || !this.ts.isExpression(node)) return null;

		const contextualType = this.checker.getContextualType(node);
		if (!contextualType) return null;

		const typeNode = this.resolveTypeNode(node, contextualType);
		if (!typeNode) return null;

		return { node, contextualType, typeNode };
	}

	private resolveTypeNode(
		node: TS.Expression,
		contextualType: TS.Type
	): TS.TypeNode | null {
		const aliasNode = this.getTypeNodeFromAlias(contextualType);
		if (aliasNode) return aliasNode;

		const paramNode = this.getTypeNodeFromParameter(node);
		if (paramNode) return paramNode;

		return this.getTypeNodeFromInitializer(node);
	}

	private getTypeNodeFromAlias(type: TS.Type): TS.TypeNode | null {
		const decl = type.aliasSymbol?.getDeclarations()?.[0];
		if (decl && this.ts.isTypeAliasDeclaration(decl)) return decl.type;
		return null;
	}

	private getTypeNodeFromParameter(node: TS.Expression): TS.TypeNode | null {
		const callLike = this.findCallLikeExpression(node);
		if (!callLike) return null;

		const signature = this.checker.getResolvedSignature(callLike);
		const argIndex = callLike.arguments?.indexOf(node as any) ?? -1;
		if (argIndex < 0) return null;

		const paramSymbol = signature?.getParameters()[argIndex];
		const paramDecl = paramSymbol?.getDeclarations()?.[0];

		return paramDecl && this.ts.isParameter(paramDecl) && paramDecl.type
			? paramDecl.type
			: null;
	}

	private getTypeNodeFromInitializer(node: TS.Expression): TS.TypeNode | null {
		const parent = node.parent;
		if (!parent) return null;

		if (
			this.ts.isVariableDeclaration(parent) ||
			this.ts.isPropertyDeclaration(parent)
		) {
			return parent.initializer === node ? (parent.type ?? null) : null;
		}

		return null;
	}

	private filterRegexMembers(
		members: CalledNode[],
		contextualType: TS.Type
	): CalledNode[] {
		return members.filter((memberNode) => {
			if (memberNode.isRegexPattern !== true) return false;

			const original =
				memberNode.callParent ?? memberNode.original ?? memberNode;

			if (this.ts.isTemplateLiteralTypeNode(memberNode))
				return (contextualType.getFlags() & this.ts.TypeFlags.StringLike) !== 0;

			const memberType = this.checker.getTypeAtLocation(original);
			return this.checker.isTypeAssignableTo(memberType, contextualType);
		});
	}

	private findCallLikeExpression(
		node: TS.Node
	): TS.CallExpression | TS.NewExpression | undefined {
		let current = node.parent;
		while (current && !this.ts.isSourceFile(current)) {
			if (this.ts.isCallExpression(current) || this.ts.isNewExpression(current))
				return current;
			current = current.parent;
		}
		return undefined;
	}

	private getUnionExpressionInfo(expr: TS.Expression): UnionInfo | null {
		const contextualType = this.checker.getContextualType(expr);
		if (!contextualType) return null;

		const typeNode = this.resolveTypeNode(expr, contextualType);
		if (!typeNode) return null;

		const unionMemberNodes = this.collectUnionMemberNodes(typeNode);
		if (unionMemberNodes.length === 0) return null;

		const valueNodes = unionMemberNodes.filter((entry) =>
			this.cmp(expr, entry)
		);

		return this.createUnionInfo(
			SupportedType.Variable,
			this.getExpressionName(expr),
			expr,
			valueNodes,
			this.getValue(expr)
		);
	}

	private getExpressionName(expr: TS.Expression): string {
		const parent = expr.parent;
		if (
			parent &&
			(this.ts.isVariableDeclaration(parent) ||
				this.ts.isPropertyDeclaration(parent) ||
				this.ts.isParameter(parent)) &&
			this.ts.isIdentifier(parent.name)
		)
			return parent.name.text;

		return 'value';
	}

	private getUnionInfo(
		paramSymbol: TS.Symbol,
		arg: TS.Expression
	): UnionInfo | null {
		const decl = paramSymbol.valueDeclaration;
		if (!decl || !this.ts.isParameter(decl) || !decl.type) return null;

		const unionMemberNodes = this.collectUnionMemberNodes(decl.type);
		if (unionMemberNodes.length === 0) return null;

		const valueNodes = unionMemberNodes.filter((entry) => this.cmp(arg, entry));

		return this.createUnionInfo(
			SupportedType.Parameter,
			paramSymbol.name,
			decl.type,
			valueNodes,
			this.getValue(arg)
		);
	}

	private getUnionVariableInfo(symbol: TS.Symbol): UnionInfo | null {
		const decl = symbol.valueDeclaration;
		if (
			!decl ||
			!(
				this.ts.isVariableDeclaration(decl) ||
				this.ts.isPropertyDeclaration(decl)
			)
		)
			return null;
		if (!decl.type || !decl.initializer) return null;

		const unionMemberNodes = this.collectUnionMemberNodes(decl.type);
		if (unionMemberNodes.length === 0) return null;

		const valueNodes = unionMemberNodes.filter((entry) =>
			this.cmp(decl.initializer as TS.Expression, entry)
		);

		return this.createUnionInfo(
			SupportedType.Variable,
			symbol.name,
			decl.type,
			valueNodes,
			this.getValue(decl.initializer)
		);
	}

	private createCompletionEntryInfos(
		initNode: TS.Expression,
		entries: CalledNode[]
	): UnionInfo[] {
		const groupedEntries = new Map<string, CalledNode[]>();
		for (const entry of entries) {
			const entryName = this.getCompletionEntryName(entry);
			if (!entryName) continue;

			const group = groupedEntries.get(entryName);
			if (group) group.push(entry);
			else groupedEntries.set(entryName, [entry]);
		}

		return [...groupedEntries.entries()].map(([entryName, groupedNodes]) =>
			this.createUnionInfo(
				SupportedType.Variable,
				entryName,
				initNode,
				groupedNodes,
				entryName
			)
		);
	}

	private createUnionInfo(
		type: SupportedType,
		name: string,
		initNode: CalledNode,
		entries: CalledNode[],
		value?: string
	): UnionInfo {
		const metadata = this.collectDocMetadata(entries);
		return new UnionInfo(
			type,
			name,
			initNode,
			entries,
			value,
			metadata.docComment,
			metadata.tags
		);
	}

	private collectDocMetadata(entries: CalledNode[]) {
		const visitedNodes = new Set<TS.Node>();
		const comments: string[][] = [];
		const tags: TS.JSDocTagInfo[][] = [];

		const addNode = (node: CalledNode) => {
			const sourceNode = node.original ?? node;
			if (visitedNodes.has(sourceNode)) return;
			visitedNodes.add(sourceNode);

			const metadata = extractJSDocMetadataFromNode(this.ts, node);
			if (metadata.docComment.length > 0) comments.push(metadata.docComment);
			if (metadata.tags.length > 0) tags.push(metadata.tags);
		};

		for (const entryNode of [...entries].reverse()) {
			addNode(entryNode);

			let parent = entryNode.callParent;
			while (parent != null) {
				addNode(parent);
				parent = parent.callParent;
			}
		}

		const docComment = comments.reverse().flat();
		const uniqueTags = dedupeTags(tags.reverse().flat());

		return {
			docComment: docComment.length > 0 ? docComment : undefined,
			tags: uniqueTags.length > 0 ? uniqueTags : undefined,
		};
	}

	private getInitNode(fileName: string, position: number) {
		const source = this.getSourceFile(fileName);
		if (!source) return null;

		const node = this.findNodeAtPos(source, position);
		return node ?? null;
	}

	private getSourceFile(fileName: string) {
		const program = this.getProgram();
		if (!program) return null;

		if (!this.sourceFileCache.has(fileName)) {
			this.sourceFileCache.set(
				fileName,
				program.getSourceFile(fileName) ?? null
			);
		}

		return this.sourceFileCache.get(fileName) ?? null;
	}

	private getProgram(): TS.Program | null {
		const program = this.ls.getProgram() ?? null;
		if (!program) {
			this.currentProgram = null;
			this.clearCaches();
			return null;
		}

		if (program !== this.currentProgram) {
			this.currentProgram = program;
			this.checker = program.getTypeChecker();
			this.clearCaches();
		}

		return program;
	}

	private clearCaches() {
		this.sourceFileCache.clear();
		this.typeInfoCache.clear();
		this.completionInfoCache.clear();
		this.deprecatedUsageCache.clear();
	}

	private findNodeAtPos(srcFile: TS.SourceFile, pos: number): TS.Node | null {
		const find = (node: TS.Node): TS.Node | null =>
			pos >= node.getStart() && pos < node.getEnd()
				? this.ts.forEachChild(node, find) || node
				: null;
		return find(srcFile);
	}

	private getCallExpression(
		node: TS.Node
	): TS.CallExpression | TS.NewExpression | null {
		if (this.ts.isCallExpression(node) || this.ts.isNewExpression(node))
			return node;
		while (
			node &&
			!this.ts.isCallExpression(node) &&
			!this.ts.isNewExpression(node)
		)
			node = node.parent;
		return node;
	}

	private getUnionParametersInfo(
		callExpr: TS.CallExpression | TS.NewExpression
	): UnionInfo[] {
		const paramTypes: UnionInfo[] = [];
		const signature = this.checker.getResolvedSignature(callExpr);
		if (!signature) return paramTypes;

		const args = callExpr.arguments ?? [];
		const params = signature.getParameters();
		for (let i = 0; i < params.length; i++) {
			const arg = args[i];
			if (!arg) continue;
			const paramInfo = this.getUnionInfo(params[i], arg);
			if (paramInfo) paramTypes.push(paramInfo);
		}

		return paramTypes;
	}

	private getValue(expr: TS.Expression): string {
		const resolvedExpr = this.resolveExpression(expr);
		return getExpressionValueText(this.ts, resolvedExpr) ?? expr.getText();
	}

	private collectUnionMemberNodes(
		node: TS.Node,
		callParent?: TS.Node,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		const ts = this.ts;
		(node as any).codeText = getNodeText(node);

		if (
			ts.isUnionTypeNode(node) ||
			ts.isIntersectionTypeNode(node) ||
			ts.isHeritageClause(node)
		) {
			return node.types.flatMap((tn) =>
				this.collectUnionMemberNodes(tn, callParent, typeArgMap)
			);
		}

		// e.g. T extends U ? string : number
		if (ts.isConditionalTypeNode(node))
			return this.collectConditionalTypeNode(node, typeArgMap);

		// e.g. Object1["propName"]
		if (ts.isIndexedAccessTypeNode(node))
			return this.collectIndexedAccessTypeNode(node, typeArgMap);

		// e.g. { prop1: string; prop2: number }
		if (ts.isTypeLiteralNode(node))
			return this.collectTypeLiteralNode(node, typeArgMap);

		// e.g. { [K in keyof T]: T[K] }
		if (ts.isMappedTypeNode(node))
			return this.collectMappedTypeNode(node, typeArgMap);

		// e.g. Promise<string>
		if (ts.isTypeReferenceNode(node))
			return this.collectTypeReferenceNode(node, typeArgMap);

		// e.g. keyof Class1
		if (
			ts.isTypeOperatorNode(node) &&
			node.operator === ts.SyntaxKind.KeyOfKeyword
		)
			return this.collectKeyOfKeywordTypeOperatorNode(node, callParent);

		// e.g. (string | number)[]
		if (ts.isParenthesizedTypeNode(node))
			return this.collectUnionMemberNodes(node.type, node, typeArgMap);

		// e.g. string[]
		if (ts.isArrayTypeNode(node))
			return this.collectUnionMemberNodes(node.elementType, node, typeArgMap);

		// e.g. [string, number, boolean]
		if (ts.isTupleTypeNode(node))
			return this.collectTupleTypeNode(node, typeArgMap);

		// e.g. typeof var1
		if (ts.isTypeQueryNode(node))
			return this.collectTypeQueryNode(node, typeArgMap);

		// e.g. `text-${number}`
		if (ts.isTemplateLiteralTypeNode(node))
			return this.buildTemplateLiteralNode(node, typeArgMap);

		// This is the end of the journey
		if (
			ts.isLiteralTypeNode(node) || // e.g. "text", 42, true
			ts.isTypeNode(node) // e.g. string, number, boolean
		)
			return [calledNode(node, callParent)];

		console.warn('Unknown node type: ', node);
		return [];
	}

	private collectConditionalTypeNode(
		node: TS.ConditionalTypeNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		return [
			...this.collectUnionMemberNodes(node.checkType, node, typeArgMap),
			...this.collectUnionMemberNodes(node.extendsType, node, typeArgMap),
			...this.collectUnionMemberNodes(node.trueType, node, typeArgMap),
			...this.collectUnionMemberNodes(node.falseType, node, typeArgMap),
		];
	}

	private collectIndexedAccessTypeNode(
		node: TS.IndexedAccessTypeNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		return [
			...this.collectUnionMemberNodes(node.objectType, node, typeArgMap),
			...this.collectUnionMemberNodes(node.indexType, node, typeArgMap),
		];
	}

	private collectTypeLiteralNode(
		node: TS.TypeLiteralNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		return node.members.flatMap((member) =>
			(member as any).type
				? this.collectUnionMemberNodes((member as any).type, node, typeArgMap)
				: []
		);
	}

	private collectMappedTypeNode(
		node: TS.MappedTypeNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		const results: TS.Node[] = [];
		if (node.typeParameter.constraint)
			results.push(
				...this.collectUnionMemberNodes(
					node.typeParameter.constraint,
					node,
					typeArgMap
				)
			);
		if (node.type)
			results.push(
				...this.collectUnionMemberNodes(node.type, node, typeArgMap)
			);
		return results;
	}

	private collectTypeReferenceNode(
		node: TS.TypeReferenceNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		const checker = this.checker,
			ts = this.ts,
			symbol = checker.getSymbolAtLocation(node.typeName);
		if (!symbol) return [];

		const aliasedSymbol =
			symbol.flags & ts.SymbolFlags.Alias
				? checker.getAliasedSymbol(symbol)
				: symbol;

		const decl = aliasedSymbol.declarations?.[0];
		if (!decl) return [];

		if (ts.isTypeParameterDeclaration(decl)) {
			const mapped = typeArgMap?.get(aliasedSymbol);
			if (mapped) return this.collectUnionMemberNodes(mapped, node, typeArgMap);
			if (decl.constraint)
				return this.collectUnionMemberNodes(decl.constraint, node, typeArgMap);
			return [];
		}

		if (ts.isTypeAliasDeclaration(decl)) {
			const nextMap = this.buildTypeArgumentMap(decl, node, typeArgMap);
			return this.collectUnionMemberNodes(decl.type, node, nextMap);
		}

		return [];
	}

	private collectKeyOfKeywordTypeOperatorNode(
		node: TS.TypeOperatorNode,
		callParent?: TS.Node
	): CalledNode[] {
		const ts = this.ts,
			checker = this.checker,
			type = checker.getTypeAtLocation(node.type);
		return type.getProperties().map((prop) => {
			const decl = prop.getDeclarations()?.[0];
			const litNode = ts.factory.createLiteralTypeNode(
				ts.factory.createStringLiteral(prop.getName())
			);
			return calledNode(litNode, callParent, decl);
		});
	}

	private collectTupleTypeNode(
		node: TS.TupleTypeNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		return node.elements.flatMap((element) =>
			this.collectUnionMemberNodes(element, node, typeArgMap)
		);
	}

	private collectTypeQueryNode(
		node: TS.TypeQueryNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		const symbol = this.checker.getSymbolAtLocation(node.exprName);
		if (!symbol) return [];

		const decls = symbol.getDeclarations() ?? [];
		return decls.flatMap((decl) =>
			this.collectUnionMemberNodes(decl as TS.Node, node, typeArgMap)
		);
	}

	private createLiteralNode<T extends TS.Node>(
		node: T,
		text: string,
		callParent?: TS.Node,
		isRegexPattern?: boolean
	): CalledNode & TS.LiteralLikeNode {
		const litNode = this.ts.factory.createStringLiteral(text);
		const called = node as CalledNode;
		const originalOverride =
			called.isRegexPattern === true &&
			called.callParent != null &&
			called.callParent !== node &&
			this.ts.isTemplateLiteralTypeNode(called.callParent)
				? called.callParent
				: undefined;
		const original = originalOverride ?? called.original ?? node;
		(litNode as any).id = (original as any).id ?? called.id;

		return calledNode(litNode, callParent, original, isRegexPattern);
	}

	// Creates new literal nodes with every possible content
	private buildTemplateLiteralNode(
		node: TS.TemplateLiteralTypeNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): CalledNode[] {
		const headText = node.head.text;
		const ts = this.ts;
		const nodes: (CalledNode & TS.LiteralLikeNode)[][] = [];

		for (const span of node.templateSpans) {
			const spanNodes: (CalledNode & TS.LiteralLikeNode)[] = [];
			const innerTypeNodes = this.collectUnionMemberNodes(
				span.type,
				node,
				typeArgMap
			);

			for (const typeNode of innerTypeNodes) {
				if (typeNode.isRegexPattern != null) {
					const regexNode = typeNode as CalledNode & TS.LiteralLikeNode;
					regexNode.text += escapeRegExp(span.literal.text);
					spanNodes.push(regexNode);
				}
				// Literal: "foo" -> "foo"
				else if (
					ts.isLiteralTypeNode(typeNode) &&
					(this.ts.isStringLiteral(typeNode.literal) ||
						this.ts.isNumericLiteral(typeNode.literal))
				) {
					spanNodes.push(
						this.createLiteralNode(
							typeNode,
							typeNode.literal.text + span.literal.text,
							node,
							false
						)
					);
				}
				// number
				else if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
					spanNodes.push(
						this.createLiteralNode(
							typeNode,
							'\\d+(\\.\\d+)?' + span.literal.text,
							node,
							true
						)
					);
				}
				// boolean
				else if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
					spanNodes.push(
						this.createLiteralNode(
							typeNode,
							'(true|false)' + span.literal.text,
							node,
							true
						)
					);
				}
				// string (caution: greedy)
				else if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
					spanNodes.push(
						this.createLiteralNode(
							typeNode,
							'\\.\\*' + span.literal.text,
							node,
							true
						)
					);
				} else {
					console.warn('Unknown type of template: ', typeNode);
				}
			}

			nodes.push(spanNodes);
		}

		const cartesianNodes = cartesianProduct(nodes).flatMap((componentNodes) => {
			const isRegex = componentNodes.some(
				(entry) => entry.isRegexPattern === true
			);
			const getText = (entry: CalledNode & TS.LiteralLikeNode) =>
				isRegex && entry.isRegexPattern === false
					? escapeRegExp(entry.text)
					: entry.text;
			const head = isRegex ? escapeRegExp(headText) : headText;
			const fullText = head + componentNodes.map(getText).join('');
			return componentNodes.map((entry) =>
				this.createLiteralNode(entry, fullText, node, isRegex)
			);
		});

		return cartesianNodes;
	}

	private buildTypeArgumentMap(
		decl: TS.TypeAliasDeclaration,
		node: TS.TypeReferenceNode,
		typeArgMap?: Map<TS.Symbol, TS.TypeNode>
	): Map<TS.Symbol, TS.TypeNode> {
		const map = typeArgMap ? new Map(typeArgMap) : new Map();
		const typeParams = decl.typeParameters ?? [];
		const typeArgs = node.typeArguments ?? [];

		for (let i = 0; i < typeParams.length; i++) {
			const param = typeParams[i];
			const symbol = this.checker.getSymbolAtLocation(param.name);
			if (!symbol) continue;
			const arg = typeArgs[i] ?? param.default ?? param.constraint;
			if (arg) map.set(symbol, arg);
		}

		return map;
	}

	private cmp(expr: TS.Expression, node: CalledNode): boolean {
		const resolvedExpr = this.resolveExpression(expr);

		// check for generated regex pattern
		if (isRegexNode(node) && isStringLikeExpression(this.ts, resolvedExpr)) {
			// Surround with ^...$, so the whole string must match
			const pattern = new RegExp(`^${node.text}$`);
			return pattern.test(resolvedExpr.text);
		}
		if (node.isRegexPattern === false) return this.cmpLit(resolvedExpr, node as any);
		if (!this.ts.isLiteralTypeNode(node)) return false;
		return this.cmpLit(resolvedExpr, node.literal);
	}

	private cmpLit(
		expr: TS.Expression,
		typeLiteral:
			| TS.LiteralExpression
			| TS.NullLiteral
			| TS.BooleanLiteral
			| TS.PrefixUnaryExpression
	) {
		const ts = this.ts;
		// string literals (i.e. "hello" and type T = "hello")
		if (isStringLikeExpression(ts, expr) && ts.isStringLiteral(typeLiteral))
			return expr.text === typeLiteral.text;

		// numeric literals (i.e. 42 and type T = 42)
		if (ts.isNumericLiteral(expr) && ts.isNumericLiteral(typeLiteral))
			return expr.text === typeLiteral.text;

		// BigInt literals (i.e. 100n and type T = 100n)
		if (ts.isBigIntLiteral(expr) && ts.isBigIntLiteral(typeLiteral))
			return expr.text === typeLiteral.text;

		// booleans (compare kind of nodes)
		if (
			(expr.kind === ts.SyntaxKind.TrueKeyword &&
				typeLiteral.kind === ts.SyntaxKind.TrueKeyword) ||
			(expr.kind === ts.SyntaxKind.FalseKeyword &&
				typeLiteral.kind === ts.SyntaxKind.FalseKeyword)
		)
			return true;

		// TODO: objects

		// null
		if (
			expr.kind === ts.SyntaxKind.NullKeyword &&
			typeLiteral.kind === ts.SyntaxKind.NullKeyword
		)
			return true;

		// undefined
		if (
			expr.kind === ts.SyntaxKind.UndefinedKeyword &&
			typeLiteral.kind === ts.SyntaxKind.UndefinedKeyword
		)
			return true;

		return false;
	}

	private resolveExpression(
		expr: TS.Expression,
		visited = new Set<TS.Node>()
	): TS.Expression {
		const unwrappedExpr = this.unwrapExpression(expr);
		if (visited.has(unwrappedExpr)) return unwrappedExpr;
		visited.add(unwrappedExpr);

		const symbol = this.getReferencedSymbol(unwrappedExpr);
		if (!symbol) return unwrappedExpr;

		const initializer = this.getConstInitializer(symbol);
		if (!initializer) return unwrappedExpr;

		return this.resolveExpression(initializer, visited);
	}

	private unwrapExpression(expr: TS.Expression): TS.Expression {
		let current = expr;

		while (true) {
			if (this.ts.isParenthesizedExpression(current)) {
				current = current.expression;
				continue;
			}
			if (this.ts.isAsExpression(current)) {
				current = current.expression;
				continue;
			}
			if (this.ts.isTypeAssertionExpression(current)) {
				current = current.expression;
				continue;
			}
			if (this.ts.isSatisfiesExpression?.(current)) {
				current = current.expression;
				continue;
			}
			if (this.ts.isNonNullExpression(current)) {
				current = current.expression;
				continue;
			}

			return current;
		}
	}

	private getReferencedSymbol(expr: TS.Expression): TS.Symbol | null {
		if (
			!this.ts.isIdentifier(expr) &&
			!this.ts.isPropertyAccessExpression(expr)
		)
			return null;

		const location = this.ts.isIdentifier(expr) ? expr : expr.name;
		const symbol = this.checker.getSymbolAtLocation(location);
		if (!symbol) return null;

		return symbol.flags & this.ts.SymbolFlags.Alias
			? this.checker.getAliasedSymbol(symbol)
			: symbol;
	}

	private getConstInitializer(symbol: TS.Symbol): TS.Expression | null {
		for (const decl of symbol.getDeclarations() ?? []) {
			if (this.ts.isVariableDeclaration(decl)) {
				if (!isConstVariableDeclaration(this.ts, decl)) continue;
				if (decl.initializer) return decl.initializer;
			}

			if (this.ts.isPropertyDeclaration(decl)) {
				if (!hasModifier(this.ts, decl, this.ts.SyntaxKind.ReadonlyKeyword))
					continue;
				if (decl.initializer) return decl.initializer;
			}
		}

		return null;
	}

	private getCompletionEntryName(node: CalledNode): string | null {
		if (!this.ts.isLiteralTypeNode(node)) return null;

		const literal = node.literal;
		if (
			this.ts.isStringLiteral(literal) ||
			this.ts.isNumericLiteral(literal) ||
			this.ts.isBigIntLiteral(literal)
		)
			return literal.text;
		if (literal.kind === this.ts.SyntaxKind.TrueKeyword) return 'true';
		if (literal.kind === this.ts.SyntaxKind.FalseKeyword) return 'false';
		if (literal.kind === this.ts.SyntaxKind.NullKeyword) return 'null';

		return null;
	}
}

function extractJSDocMetadataFromNode(ts: typeof TS, node: CalledNode) {
	const sourceNode = node.original ?? node;
	const sourceFile = sourceNode.getSourceFile();
	if (!sourceFile) return { docComment: [], tags: [] };

	const sourceText = sourceFile.getFullText();
	const start = sourceNode.getStart();
	const comment = getLeadingComment(ts, sourceText, start);

	return comment
		? prepareJSDocMetadata(sourceText.substring(comment.pos, comment.end))
		: { docComment: [], tags: [] };
}

function getLeadingComment(
	ts: typeof TS,
	text: string,
	pos: number
): TS.CommentRange | undefined {
	const comments = ts.getLeadingCommentRanges(text, pos) ?? [];

	if (comments.length > 0 && text[comments[0].pos + 2] === '*')
		return comments[comments.length - 1];

	text = text.substring(0, pos);
	const commentStart = text.lastIndexOf('/**');
	if (commentStart === -1) return;

	const commentEnd = text.lastIndexOf('*/');
	if (commentEnd === -1) return;

	const textBetween = text.substring(commentEnd + 2, pos);
	if (/[^ \t|\n]/.test(textBetween)) return;

	return {
		pos: commentStart + 3,
		end: commentEnd,
		kind: ts.SyntaxKind.MultiLineCommentTrivia,
	};
}

function prepareJSDocMetadata(rawComment: string) {
	const normalizedLines = normalizeJSDocLines(rawComment);
	return {
		docComment: extractDocComment(normalizedLines),
		tags: extractJSDocTags(normalizedLines),
	};
}

function normalizeJSDocLines(rawComment: string): string[] {
	return rawComment
		.replace('/**', '')
		.replace('*/', '')
		.split('\n')
		.map((line) => line.trim().replace(/^\* ?/, ''));
}

function extractDocComment(normalizedLines: string[]): string[] {
	const docComment: string[] = [];

	for (let i = 0; i < normalizedLines.length; i++) {
		const line = normalizedLines[i];
		if (isTagLine(line)) {
			for (let j = i + 1; j < normalizedLines.length; j++) {
				if (isTagLine(normalizedLines[j])) break;
				i = j;
			}
			continue;
		}

		docComment.push(line);
	}

	return trimEmptyLines(docComment);
}

function extractJSDocTags(normalizedLines: string[]): TS.JSDocTagInfo[] {
	const tags: TS.JSDocTagInfo[] = [];

	for (let i = 0; i < normalizedLines.length; i++) {
		const line = normalizedLines[i];
		const match = line.match(/^@(\w+)\b(?:\s+(.*))?$/);
		if (!match) continue;

		const tagLines = [match[2]?.trim() ?? ''];
		for (let j = i + 1; j < normalizedLines.length; j++) {
			const continuationLine = normalizedLines[j];
			if (isTagLine(continuationLine)) break;
			tagLines.push(continuationLine);
			i = j;
		}

		const normalizedTagLines = trimEmptyLines(tagLines).map((part) => part.trim());
		const text = shouldPreserveTagLineBreaks(normalizedTagLines)
			? normalizedTagLines.join('\n').trim()
			: normalizedTagLines.join(' ').trim();
		tags.push({
			name: match[1],
			text: text ? [{ kind: 'text', text }] : [],
		});
	}

	return tags;
}

function isTagLine(line: string): boolean {
	return /^@\w+\b/.test(line);
}

function trimEmptyLines(lines: string[]): string[] {
	let start = 0;
	let end = lines.length;

	while (start < end && lines[start].trim() === '') start++;
	while (end > start && lines[end - 1].trim() === '') end--;

	return lines.slice(start, end);
}

function shouldPreserveTagLineBreaks(lines: readonly string[]): boolean {
	return lines.some(isMarkdownTableLine);
}

function isMarkdownTableLine(line: string): boolean {
	return /^\|.*\|$/.test(line);
}

function dedupeTags(tags: readonly TS.JSDocTagInfo[]): TS.JSDocTagInfo[] {
	const seen = new Set<string>();
	const unique: TS.JSDocTagInfo[] = [];

	for (const tag of tags) {
		const key = `${tag.name}:${getTagText(tag)}`;
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(tag);
	}

	return unique;
}

function isDeprecatedUsageNode(
	ts: typeof TS,
	node: TS.Node
): node is TS.Expression {
	return (
		ts.isStringLiteral(node) ||
		ts.isNumericLiteral(node) ||
		ts.isBigIntLiteral(node) ||
		node.kind === ts.SyntaxKind.TrueKeyword ||
		node.kind === ts.SyntaxKind.FalseKeyword ||
		node.kind === ts.SyntaxKind.NullKeyword
	);
}

function calledNode<T extends TS.Node>(
	node: T,
	callParent?: TS.Node,
	original?: TS.Node,
	isRegex?: boolean
): CalledNode & T {
	const called = node as CalledNode;
	called.callParent = callParent;
	called.original = original;
	called.isRegexPattern = isRegex;
	return called as CalledNode & T;
}

function getNodeText(node: TS.Node) {
	const text = node.getSourceFile()?.text;
	if (!text) return '<No Source>';
	return text.substring(node.getStart(), node.getEnd());
}

function getExpressionValueText(
	ts: typeof TS,
	expr: TS.Expression
): string | undefined {
	if (isStringLikeExpression(ts, expr)) return expr.text;
	if (ts.isNumericLiteral(expr) || ts.isBigIntLiteral(expr)) return expr.text;
	if (expr.kind === ts.SyntaxKind.TrueKeyword) return 'true';
	if (expr.kind === ts.SyntaxKind.FalseKeyword) return 'false';
	if (expr.kind === ts.SyntaxKind.NullKeyword) return 'null';
	if (expr.kind === ts.SyntaxKind.UndefinedKeyword) return 'undefined';
	return undefined;
}

function isStringLikeExpression(
	ts: typeof TS,
	expr: TS.Expression
): expr is TS.StringLiteral | TS.NoSubstitutionTemplateLiteral {
	return ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr);
}

function isConstVariableDeclaration(
	ts: typeof TS,
	decl: TS.VariableDeclaration
): boolean {
	return (
		ts.isVariableDeclarationList(decl.parent) &&
		(decl.parent.flags & ts.NodeFlags.Const) !== 0
	);
}

function hasModifier(
	_ts: typeof TS,
	node: TS.Node & { modifiers?: TS.NodeArray<TS.ModifierLike> },
	kind: TS.SyntaxKind
): boolean {
	return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

export function getDeprecatedTag(
	tags: readonly TS.JSDocTagInfo[] | undefined
): TS.JSDocTagInfo | undefined {
	return tags?.find((tag) => tag.name === 'deprecated');
}

export function getTagText(tag: TS.JSDocTagInfo | undefined): string {
	return tag?.text?.map((part) => part.text).join('') ?? '';
}

export function isRegexNode(
	node: CalledNode
): node is TS.StringLiteral & CalledNode {
	return node.isRegexPattern === true;
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
	return arrays.reduce(
		(acc, curr) => acc.flatMap((items) => curr.map((item) => [...items, item])),
		[[]] as T[][]
	);
}
