import type * as TS from 'typescript/lib/tsserverlibrary';

// This class holds every type information the plugin needs
export class TypeInfo {
	constructor(public unionParams: UnionParameterInfo[]) {}
}

export class UnionParameterInfo {
	constructor(
		public i: number,
		public name: string,
		// Can be multiple nodes because different union types can have same values
		public entries: TS.TypeNode[],
		public value?: string,
		public docComment?: string[]
	) {}
}

export class TypeInfoFactory {
	private checker!: TS.TypeChecker;

	constructor(private ts: typeof TS, private ls: TS.LanguageService) {}

	create(fileName: string, position: number): TypeInfo | null {
		const program = this.ls.getProgram();
		if (!program) return null;

		this.checker = program.getTypeChecker();
		if (!this.checker) return null;

		const source = program.getSourceFile(fileName);
		if (!source) return null;

		const node = this.findNodeAtPos(source, position);
		if (!node) return null;

		const symbol = this.checker.getSymbolAtLocation(node);
		if (!symbol) return null;

		const callExpression = this.getCallExpression(node);
		if (!callExpression) return null;

		const unionParams = this.getUnionParamters(callExpression);
		if (unionParams.length === 0) return null;
		return new TypeInfo(unionParams);
	}

	private findNodeAtPos(srcFile: TS.SourceFile, pos: number): TS.Node | null {
		const find = (node: TS.Node): TS.Node | null =>
			pos >= node.getStart() && pos < node.getEnd()
				? this.ts.forEachChild(node, find) || node
				: null;
		return find(srcFile);
	}

	private getCallExpression(node: TS.Node): TS.CallExpression | null {
		if (this.ts.isCallExpression(node)) return node;
		while (node && !this.ts.isCallExpression(node)) node = node.parent;
		return node;
	}
	private getUnionParamters(callExpr: TS.CallExpression): UnionParameterInfo[] {
		const paramTypes: UnionParameterInfo[] = [];
		const signature = this.checker.getResolvedSignature(callExpr);
		if (!signature) return paramTypes;

		const args = callExpr.arguments;
		const params = signature.getParameters();
		for (let i = 0; i < params.length; i++) {
			const paramInfo = this.getUnionParamInfo(i, params[i], args[i]);
			if (paramInfo) paramTypes.push(paramInfo);
		}

		return paramTypes;
	}

	private getUnionParamInfo(
		i: number,
		paramSymbol: TS.Symbol,
		arg: TS.Expression
	): UnionParameterInfo | null {
		const decl = paramSymbol.valueDeclaration;
		if (!decl || !this.ts.isParameter(decl) || !decl.type) return null;

		const unionMemberNodes = this.collectUnionMemberNodes(decl.type);
		if (unionMemberNodes.length === 0) return null;

		const value = this.getValue(arg);
		const valueNodes = unionMemberNodes.filter((entry) => this.cmp(arg, entry));

		return new UnionParameterInfo(i, paramSymbol.name, valueNodes, value);
	}

	private getValue(expr: TS.Expression): string {
		return this.ts.isLiteralExpression(expr) ? expr.text : expr.getText();
	}

	private collectUnionMemberNodes(node: TS.Node): TS.TypeNode[] {
		const ts = this.ts,
			checker = this.checker;

		if (ts.isUnionTypeNode(node)) {
			return node.types.map((tn) => this.collectUnionMemberNodes(tn)).flat();
		}
		if (ts.isTypeReferenceNode(node)) {
			const symbol = checker.getSymbolAtLocation(node.typeName);
			if (!symbol) return [];
			const aliasedSymbol =
				symbol.flags & ts.SymbolFlags.Alias
					? checker.getAliasedSymbol(symbol)
					: symbol;

			const decl = aliasedSymbol.declarations?.[0];
			if (!decl) return [];
			const tn = ts.isTypeParameterDeclaration(decl)
				? decl.constraint ?? null
				: ts.isTypeAliasDeclaration(decl)
				? decl.type
				: null;
			if (!tn) return [];
			return this.collectUnionMemberNodes(tn);
		}
		if (ts.isTypeOperatorNode(node)) {
			if (node.operator === ts.SyntaxKind.KeyOfKeyword) {
				const type = checker.getTypeAtLocation(node.type);
				return type.getProperties().map((p) => {
					const decl = p.getDeclarations()?.[0];
					const node = ts.factory.createLiteralTypeNode(
						ts.factory.createStringLiteral(p.getName())
					);
					// little hack to get the original declaration of the keyof property
					// to be able to access the jsdoc of it
					(node as any).original = decl;
					return node;
				});
			}
		}
		if (ts.isParenthesizedTypeNode(node)) {
			return this.collectUnionMemberNodes(node.type);
		}
		if (ts.isTypeNode(node)) {
			return [node];
		}
		return [];
	}

	private cmp(expr: TS.Expression, node: TS.TypeNode): boolean {
		const ts = this.ts;
		if (!ts.isLiteralTypeNode(node)) return false;

		const typeLiteral = node.literal;

		// string literals (i.e. "hello" and type T = "hello")
		if (ts.isStringLiteral(expr) && ts.isStringLiteral(typeLiteral))
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
}
