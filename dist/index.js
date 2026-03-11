"use strict";
var SupportedType = /* @__PURE__ */ ((SupportedType2) => {
  SupportedType2[SupportedType2["Parameter"] = 0] = "Parameter";
  SupportedType2[SupportedType2["Variable"] = 1] = "Variable";
  return SupportedType2;
})(SupportedType || {});
class UnionInfo {
  constructor(type, name, initNode, entries, value, docComment, tags) {
    this.type = type;
    this.name = name;
    this.initNode = initNode;
    this.entries = entries;
    this.value = value;
    this.docComment = docComment;
    this.tags = tags;
  }
}
class TypeInfoFactory {
  constructor(ts, ls) {
    this.ts = ts;
    this.ls = ls;
    this.currentProgram = null;
    this.sourceFileCache = /* @__PURE__ */ new Map();
    this.typeInfoCache = /* @__PURE__ */ new Map();
    this.completionInfoCache = /* @__PURE__ */ new Map();
    this.deprecatedUsageCache = /* @__PURE__ */ new Map();
  }
  getTypeInfo(fileName, position) {
    const cacheKey = `${fileName}:${position}`;
    if (this.typeInfoCache.has(cacheKey)) {
      return this.typeInfoCache.get(cacheKey) ?? null;
    }
    const node = this.getInitNode(fileName, position);
    const result = node ? this.getTypeInfoForNode(node) : null;
    this.typeInfoCache.set(cacheKey, result);
    return result;
  }
  getCompletionInfo(fileName, position) {
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
      templateInfo: templateEntries.length === 0 ? null : this.createUnionInfo(
        1,
        "completion",
        context.node,
        templateEntries
      ),
      entryInfos: this.createCompletionEntryInfos(
        context.node,
        unionMemberNodes
      )
    };
    this.completionInfoCache.set(cacheKey, result);
    return result;
  }
  getCompletionEntryInfo(fileName, position, entryName) {
    return this.getCompletionInfo(fileName, position)?.entryInfos.find(
      (info) => info.name === entryName
    ) ?? null;
  }
  getDeprecatedUsageInfos(fileName) {
    const cached = this.deprecatedUsageCache.get(fileName);
    if (cached) return cached;
    const sourceFile = this.getSourceFile(fileName);
    if (!sourceFile) return [];
    const usages = [];
    const seen = /* @__PURE__ */ new Set();
    const visit = (node) => {
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
  getTypeInfoForNode(node) {
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
  getTypeInfoForExpression(expr) {
    const argumentInfo = this.getUnionInfoForArgument(expr);
    if (argumentInfo) return [argumentInfo];
    const contextualInfo = this.getUnionExpressionInfo(expr);
    return contextualInfo ? [contextualInfo] : [];
  }
  getUnionInfoForArgument(expr) {
    const callLike = this.findCallLikeExpression(expr);
    if (!callLike) return null;
    const argIndex = callLike.arguments?.indexOf(expr) ?? -1;
    if (argIndex < 0) return null;
    const signature = this.checker.getResolvedSignature(callLike);
    const paramSymbol = signature?.getParameters()[argIndex];
    return paramSymbol ? this.getUnionInfo(paramSymbol, expr) : null;
  }
  getCompletionContext(fileName, position) {
    const node = this.getInitNode(fileName, position);
    if (!node || !this.ts.isExpression(node)) return null;
    const contextualType = this.checker.getContextualType(node);
    if (!contextualType) return null;
    const typeNode = this.resolveTypeNode(node, contextualType);
    if (!typeNode) return null;
    return { node, contextualType, typeNode };
  }
  resolveTypeNode(node, contextualType) {
    const aliasNode = this.getTypeNodeFromAlias(contextualType);
    if (aliasNode) return aliasNode;
    const paramNode = this.getTypeNodeFromParameter(node);
    if (paramNode) return paramNode;
    return this.getTypeNodeFromInitializer(node);
  }
  getTypeNodeFromAlias(type) {
    const decl = type.aliasSymbol?.getDeclarations()?.[0];
    if (decl && this.ts.isTypeAliasDeclaration(decl)) return decl.type;
    return null;
  }
  getTypeNodeFromParameter(node) {
    const callLike = this.findCallLikeExpression(node);
    if (!callLike) return null;
    const signature = this.checker.getResolvedSignature(callLike);
    const argIndex = callLike.arguments?.indexOf(node) ?? -1;
    if (argIndex < 0) return null;
    const paramSymbol = signature?.getParameters()[argIndex];
    const paramDecl = paramSymbol?.getDeclarations()?.[0];
    return paramDecl && this.ts.isParameter(paramDecl) && paramDecl.type ? paramDecl.type : null;
  }
  getTypeNodeFromInitializer(node) {
    const parent = node.parent;
    if (!parent) return null;
    if (this.ts.isVariableDeclaration(parent) || this.ts.isPropertyDeclaration(parent)) {
      return parent.initializer === node ? parent.type ?? null : null;
    }
    return null;
  }
  filterRegexMembers(members, contextualType) {
    return members.filter((memberNode) => {
      if (memberNode.isRegexPattern !== true) return false;
      const original = memberNode.callParent ?? memberNode.original ?? memberNode;
      if (this.ts.isTemplateLiteralTypeNode(memberNode))
        return (contextualType.getFlags() & this.ts.TypeFlags.StringLike) !== 0;
      const memberType = this.checker.getTypeAtLocation(original);
      return this.checker.isTypeAssignableTo(memberType, contextualType);
    });
  }
  findCallLikeExpression(node) {
    let current = node.parent;
    while (current && !this.ts.isSourceFile(current)) {
      if (this.ts.isCallExpression(current) || this.ts.isNewExpression(current))
        return current;
      current = current.parent;
    }
    return void 0;
  }
  getUnionExpressionInfo(expr) {
    const contextualType = this.checker.getContextualType(expr);
    if (!contextualType) return null;
    const typeNode = this.resolveTypeNode(expr, contextualType);
    if (!typeNode) return null;
    const unionMemberNodes = this.collectUnionMemberNodes(typeNode);
    if (unionMemberNodes.length === 0) return null;
    const valueNodes = unionMemberNodes.filter(
      (entry) => this.cmp(expr, entry)
    );
    return this.createUnionInfo(
      1,
      this.getExpressionName(expr),
      expr,
      valueNodes,
      this.getValue(expr)
    );
  }
  getExpressionName(expr) {
    const parent = expr.parent;
    if (parent && (this.ts.isVariableDeclaration(parent) || this.ts.isPropertyDeclaration(parent) || this.ts.isParameter(parent)) && this.ts.isIdentifier(parent.name))
      return parent.name.text;
    return "value";
  }
  getUnionInfo(paramSymbol, arg) {
    const decl = paramSymbol.valueDeclaration;
    if (!decl || !this.ts.isParameter(decl) || !decl.type) return null;
    const unionMemberNodes = this.collectUnionMemberNodes(decl.type);
    if (unionMemberNodes.length === 0) return null;
    const valueNodes = unionMemberNodes.filter((entry) => this.cmp(arg, entry));
    return this.createUnionInfo(
      0,
      paramSymbol.name,
      decl.type,
      valueNodes,
      this.getValue(arg)
    );
  }
  getUnionVariableInfo(symbol) {
    const decl = symbol.valueDeclaration;
    if (!decl || !(this.ts.isVariableDeclaration(decl) || this.ts.isPropertyDeclaration(decl)))
      return null;
    if (!decl.type || !decl.initializer) return null;
    const unionMemberNodes = this.collectUnionMemberNodes(decl.type);
    if (unionMemberNodes.length === 0) return null;
    const valueNodes = unionMemberNodes.filter(
      (entry) => this.cmp(decl.initializer, entry)
    );
    return this.createUnionInfo(
      1,
      symbol.name,
      decl.type,
      valueNodes,
      this.getValue(decl.initializer)
    );
  }
  createCompletionEntryInfos(initNode, entries) {
    const groupedEntries = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      const entryName = this.getCompletionEntryName(entry);
      if (!entryName) continue;
      const group = groupedEntries.get(entryName);
      if (group) group.push(entry);
      else groupedEntries.set(entryName, [entry]);
    }
    return [...groupedEntries.entries()].map(
      ([entryName, groupedNodes]) => this.createUnionInfo(
        1,
        entryName,
        initNode,
        groupedNodes,
        entryName
      )
    );
  }
  createUnionInfo(type, name, initNode, entries, value) {
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
  collectDocMetadata(entries) {
    const visitedNodes = /* @__PURE__ */ new Set();
    const comments = [];
    const tags = [];
    const addNode = (node) => {
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
      docComment: docComment.length > 0 ? docComment : void 0,
      tags: uniqueTags.length > 0 ? uniqueTags : void 0
    };
  }
  getInitNode(fileName, position) {
    const source = this.getSourceFile(fileName);
    if (!source) return null;
    const node = this.findNodeAtPos(source, position);
    return node ?? null;
  }
  getSourceFile(fileName) {
    const program = this.getProgram();
    if (!program) return null;
    if (!this.sourceFileCache.has(fileName)) {
      this.sourceFileCache.set(fileName, program.getSourceFile(fileName) ?? null);
    }
    return this.sourceFileCache.get(fileName) ?? null;
  }
  getProgram() {
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
  clearCaches() {
    this.sourceFileCache.clear();
    this.typeInfoCache.clear();
    this.completionInfoCache.clear();
    this.deprecatedUsageCache.clear();
  }
  findNodeAtPos(srcFile, pos) {
    const find = (node) => pos >= node.getStart() && pos < node.getEnd() ? this.ts.forEachChild(node, find) || node : null;
    return find(srcFile);
  }
  getCallExpression(node) {
    if (this.ts.isCallExpression(node) || this.ts.isNewExpression(node))
      return node;
    while (node && !this.ts.isCallExpression(node) && !this.ts.isNewExpression(node))
      node = node.parent;
    return node;
  }
  getUnionParametersInfo(callExpr) {
    const paramTypes = [];
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
  getValue(expr) {
    return this.ts.isLiteralExpression(expr) ? expr.text : expr.getText();
  }
  collectUnionMemberNodes(node, callParent, typeArgMap) {
    const ts = this.ts;
    node.codeText = getNodeText(node);
    if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node) || ts.isHeritageClause(node)) {
      return node.types.flatMap(
        (tn) => this.collectUnionMemberNodes(tn, callParent, typeArgMap)
      );
    }
    if (ts.isConditionalTypeNode(node))
      return this.collectConditionalTypeNode(node, typeArgMap);
    if (ts.isIndexedAccessTypeNode(node))
      return this.collectIndexedAccessTypeNode(node, typeArgMap);
    if (ts.isTypeLiteralNode(node))
      return this.collectTypeLiteralNode(node, typeArgMap);
    if (ts.isMappedTypeNode(node))
      return this.collectMappedTypeNode(node, typeArgMap);
    if (ts.isTypeReferenceNode(node))
      return this.collectTypeReferenceNode(node, typeArgMap);
    if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword)
      return this.collectKeyOfKeywordTypeOperatorNode(node, callParent);
    if (ts.isParenthesizedTypeNode(node))
      return this.collectUnionMemberNodes(node.type, node, typeArgMap);
    if (ts.isArrayTypeNode(node))
      return this.collectUnionMemberNodes(node.elementType, node, typeArgMap);
    if (ts.isTupleTypeNode(node))
      return this.collectTupleTypeNode(node, typeArgMap);
    if (ts.isTypeQueryNode(node))
      return this.collectTypeQueryNode(node, typeArgMap);
    if (ts.isTemplateLiteralTypeNode(node))
      return this.buildTemplateLiteralNode(node, typeArgMap);
    if (ts.isLiteralTypeNode(node) || // e.g. "text", 42, true
    ts.isTypeNode(node))
      return [calledNode(node, callParent)];
    console.warn("Unknown node type: ", node);
    return [];
  }
  collectConditionalTypeNode(node, typeArgMap) {
    return [
      ...this.collectUnionMemberNodes(node.checkType, node, typeArgMap),
      ...this.collectUnionMemberNodes(node.extendsType, node, typeArgMap),
      ...this.collectUnionMemberNodes(node.trueType, node, typeArgMap),
      ...this.collectUnionMemberNodes(node.falseType, node, typeArgMap)
    ];
  }
  collectIndexedAccessTypeNode(node, typeArgMap) {
    return [
      ...this.collectUnionMemberNodes(node.objectType, node, typeArgMap),
      ...this.collectUnionMemberNodes(node.indexType, node, typeArgMap)
    ];
  }
  collectTypeLiteralNode(node, typeArgMap) {
    return node.members.flatMap(
      (member) => member.type ? this.collectUnionMemberNodes(member.type, node, typeArgMap) : []
    );
  }
  collectMappedTypeNode(node, typeArgMap) {
    const results = [];
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
  collectTypeReferenceNode(node, typeArgMap) {
    const checker = this.checker, ts = this.ts, symbol = checker.getSymbolAtLocation(node.typeName);
    if (!symbol) return [];
    const aliasedSymbol = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
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
  collectKeyOfKeywordTypeOperatorNode(node, callParent) {
    const ts = this.ts, checker = this.checker, type = checker.getTypeAtLocation(node.type);
    return type.getProperties().map((prop) => {
      const decl = prop.getDeclarations()?.[0];
      const litNode = ts.factory.createLiteralTypeNode(
        ts.factory.createStringLiteral(prop.getName())
      );
      return calledNode(litNode, callParent, decl);
    });
  }
  collectTupleTypeNode(node, typeArgMap) {
    return node.elements.flatMap(
      (element) => this.collectUnionMemberNodes(element, node, typeArgMap)
    );
  }
  collectTypeQueryNode(node, typeArgMap) {
    const symbol = this.checker.getSymbolAtLocation(node.exprName);
    if (!symbol) return [];
    const decls = symbol.getDeclarations() ?? [];
    return decls.flatMap(
      (decl) => this.collectUnionMemberNodes(decl, node, typeArgMap)
    );
  }
  createLiteralNode(node, text, callParent, isRegexPattern) {
    const litNode = this.ts.factory.createStringLiteral(text);
    const called = node;
    const originalOverride = called.isRegexPattern === true && called.callParent != null && called.callParent !== node && this.ts.isTemplateLiteralTypeNode(called.callParent) ? called.callParent : void 0;
    const original = originalOverride ?? called.original ?? node;
    litNode.id = original.id ?? called.id;
    return calledNode(litNode, callParent, original, isRegexPattern);
  }
  // Creates new literal nodes with every possible content
  buildTemplateLiteralNode(node, typeArgMap) {
    const headText = node.head.text;
    const ts = this.ts;
    const nodes = [];
    for (const span of node.templateSpans) {
      const spanNodes = [];
      const innerTypeNodes = this.collectUnionMemberNodes(
        span.type,
        node,
        typeArgMap
      );
      for (const typeNode of innerTypeNodes) {
        if (typeNode.isRegexPattern != null) {
          const regexNode = typeNode;
          regexNode.text += escapeRegExp(span.literal.text);
          spanNodes.push(regexNode);
        } else if (ts.isLiteralTypeNode(typeNode) && (this.ts.isStringLiteral(typeNode.literal) || this.ts.isNumericLiteral(typeNode.literal))) {
          spanNodes.push(
            this.createLiteralNode(
              typeNode,
              typeNode.literal.text + span.literal.text,
              node,
              false
            )
          );
        } else if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
          spanNodes.push(
            this.createLiteralNode(
              typeNode,
              "\\d+(\\.\\d+)?" + span.literal.text,
              node,
              true
            )
          );
        } else if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
          spanNodes.push(
            this.createLiteralNode(
              typeNode,
              "(true|false)" + span.literal.text,
              node,
              true
            )
          );
        } else if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
          spanNodes.push(
            this.createLiteralNode(
              typeNode,
              "\\.\\*" + span.literal.text,
              node,
              true
            )
          );
        } else {
          console.warn("Unknown type of template: ", typeNode);
        }
      }
      nodes.push(spanNodes);
    }
    const cartesianNodes = cartesianProduct(nodes).flatMap((componentNodes) => {
      const isRegex = componentNodes.some(
        (entry) => entry.isRegexPattern === true
      );
      const getText = (entry) => isRegex && entry.isRegexPattern === false ? escapeRegExp(entry.text) : entry.text;
      const head = isRegex ? escapeRegExp(headText) : headText;
      const fullText = head + componentNodes.map(getText).join("");
      return componentNodes.map(
        (entry) => this.createLiteralNode(entry, fullText, node, isRegex)
      );
    });
    return cartesianNodes;
  }
  buildTypeArgumentMap(decl, node, typeArgMap) {
    const map = typeArgMap ? new Map(typeArgMap) : /* @__PURE__ */ new Map();
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
  cmp(expr, node) {
    if (isRegexNode(node) && this.ts.isStringLiteral(expr)) {
      const pattern = new RegExp(`^${node.text}$`);
      return pattern.test(expr.text);
    }
    if (node.isRegexPattern === false) return this.cmpLit(expr, node);
    if (!this.ts.isLiteralTypeNode(node)) return false;
    return this.cmpLit(expr, node.literal);
  }
  cmpLit(expr, typeLiteral) {
    const ts = this.ts;
    if (ts.isStringLiteral(expr) && ts.isStringLiteral(typeLiteral))
      return expr.text === typeLiteral.text;
    if (ts.isNumericLiteral(expr) && ts.isNumericLiteral(typeLiteral))
      return expr.text === typeLiteral.text;
    if (ts.isBigIntLiteral(expr) && ts.isBigIntLiteral(typeLiteral))
      return expr.text === typeLiteral.text;
    if (expr.kind === ts.SyntaxKind.TrueKeyword && typeLiteral.kind === ts.SyntaxKind.TrueKeyword || expr.kind === ts.SyntaxKind.FalseKeyword && typeLiteral.kind === ts.SyntaxKind.FalseKeyword)
      return true;
    if (expr.kind === ts.SyntaxKind.NullKeyword && typeLiteral.kind === ts.SyntaxKind.NullKeyword)
      return true;
    if (expr.kind === ts.SyntaxKind.UndefinedKeyword && typeLiteral.kind === ts.SyntaxKind.UndefinedKeyword)
      return true;
    return false;
  }
  getCompletionEntryName(node) {
    if (!this.ts.isLiteralTypeNode(node)) return null;
    const literal = node.literal;
    if (this.ts.isStringLiteral(literal) || this.ts.isNumericLiteral(literal) || this.ts.isBigIntLiteral(literal))
      return literal.text;
    if (literal.kind === this.ts.SyntaxKind.TrueKeyword) return "true";
    if (literal.kind === this.ts.SyntaxKind.FalseKeyword) return "false";
    if (literal.kind === this.ts.SyntaxKind.NullKeyword) return "null";
    return null;
  }
}
function extractJSDocMetadataFromNode(ts, node) {
  const sourceNode = node.original ?? node;
  const sourceFile = sourceNode.getSourceFile();
  if (!sourceFile) return { docComment: [], tags: [] };
  const sourceText = sourceFile.getFullText();
  const start = sourceNode.getStart();
  const comment = getLeadingComment(ts, sourceText, start);
  return comment ? prepareJSDocMetadata(sourceText.substring(comment.pos, comment.end)) : { docComment: [], tags: [] };
}
function getLeadingComment(ts, text, pos) {
  const comments = ts.getLeadingCommentRanges(text, pos) ?? [];
  if (comments.length > 0 && text[comments[0].pos + 2] === "*")
    return comments[comments.length - 1];
  text = text.substring(0, pos);
  const commentStart = text.lastIndexOf("/**");
  if (commentStart === -1) return;
  const commentEnd = text.lastIndexOf("*/");
  if (commentEnd === -1) return;
  const textBetween = text.substring(commentEnd + 2, pos);
  if (/[^ \t|\n]/.test(textBetween)) return;
  return {
    pos: commentStart + 3,
    end: commentEnd,
    kind: ts.SyntaxKind.MultiLineCommentTrivia
  };
}
function prepareJSDocMetadata(rawComment) {
  return {
    docComment: prepareJSDocText(rawComment),
    tags: extractDeprecatedTags(rawComment)
  };
}
function prepareJSDocText(rawComment) {
  return rawComment.replace("/**", "").replace("*/", "").split("\n").map((line) => line.trim().replace(/^\* ?/, "")).map((line) => line.replace(/@(\w+)/g, (_, tag) => `
> _@${tag}_`));
}
function extractDeprecatedTags(rawComment) {
  const normalizedLines = rawComment.replace("/**", "").replace("*/", "").split("\n").map((line) => line.trim().replace(/^\* ?/, ""));
  const tags = [];
  for (let i = 0; i < normalizedLines.length; i++) {
    const line = normalizedLines[i];
    const match = line.match(/^@deprecated\b(?:\s+(.*))?$/);
    if (!match) continue;
    const tagLines = [match[1]?.trim() ?? ""];
    for (let j = i + 1; j < normalizedLines.length; j++) {
      const continuationLine = normalizedLines[j].trim();
      if (continuationLine.startsWith("@")) break;
      if (continuationLine === "") continue;
      tagLines.push(continuationLine);
      i = j;
    }
    const text = tagLines.join(" ").trim();
    tags.push({
      name: "deprecated",
      text: text ? [{ kind: "text", text }] : []
    });
  }
  return tags;
}
function dedupeTags(tags) {
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const tag of tags) {
    const key = `${tag.name}:${getTagText(tag)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tag);
  }
  return unique;
}
function isDeprecatedUsageNode(ts, node) {
  return ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isBigIntLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword;
}
function calledNode(node, callParent, original, isRegex) {
  const called = node;
  called.callParent = callParent;
  called.original = original;
  called.isRegexPattern = isRegex;
  return called;
}
function getNodeText(node) {
  const text = node.getSourceFile()?.text;
  if (!text) return "<No Source>";
  return text.substring(node.getStart(), node.getEnd());
}
function getDeprecatedTag(tags) {
  return tags?.find((tag) => tag.name === "deprecated");
}
function getTagText(tag) {
  return tag?.text?.map((part) => part.text).join("") ?? "";
}
function isRegexNode(node) {
  return node.isRegexPattern === true;
}
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function cartesianProduct(arrays) {
  return arrays.reduce(
    (acc, curr) => acc.flatMap((items) => curr.map((item) => [...items, item])),
    [[]]
  );
}
function applyCompletionInfo(ts, completion, info) {
  addTemplateCompletions(ts, completion, info.templateInfo);
  markDeprecatedEntries(completion, info.entryInfos);
}
function addDeprecatedCompletionEntryDetails(details, unionInfo) {
  const deprecatedTag = getDeprecatedTag(unionInfo.tags);
  if (!deprecatedTag) return;
  details.tags = details.tags ? [...details.tags] : [];
  if (details.tags.some(
    (tag) => tag.name === deprecatedTag.name && getTagText(tag) === getTagText(deprecatedTag)
  ))
    return;
  details.tags.push(deprecatedTag);
}
function defaultComplInfo() {
  return {
    isGlobalCompletion: false,
    isMemberCompletion: false,
    isNewIdentifierLocation: false,
    entries: []
  };
}
function addTemplateCompletions(ts, completion, unionInfo) {
  if (!unionInfo) return;
  const entries = createTemplateCompletions(ts, unionInfo);
  if (entries.length === 0) return;
  completion.entries.push(...entries);
}
function markDeprecatedEntries(completion, entryInfos) {
  const deprecatedNames = new Set(
    entryInfos.filter((entryInfo) => getDeprecatedTag(entryInfo.tags)).map((entryInfo) => entryInfo.name)
  );
  if (deprecatedNames.size === 0) return;
  for (const entry of completion.entries) {
    if (!deprecatedNames.has(entry.name)) continue;
    entry.kindModifiers = appendKindModifier(entry.kindModifiers, "deprecated");
  }
}
function createTemplateCompletions(ts, unionInfo) {
  const visitedSnippets = /* @__PURE__ */ new Set();
  const templateNodes = unionInfo.entries.filter((node) => isRegexNode(node));
  if (templateNodes.length === 0) return [];
  const replacementSpan = getNodeTextSpan(unionInfo.initNode);
  const entries = [];
  for (const templateNode of templateNodes) {
    const snippet = regexToSnippet(templateNode.text);
    if (visitedSnippets.has(snippet)) continue;
    visitedSnippets.add(snippet);
    const name = replaceSnippetDefaults(snippet);
    entries.push({
      name,
      kind: ts.ScriptElementKind.string,
      sortText: name,
      insertText: snippet,
      isSnippet: true,
      replacementSpan
    });
  }
  return entries;
}
function regexToSnippet(snippet) {
  let i = 1;
  return snippet.replace(/\\d\+\(\\\.\\d\+\)\?/g, () => `\${${i++}:0}`).replace(/\(true\|false\)/g, () => `\${${i++}:false}`).replace(/\.\*/g, () => `\${${i++}:TEXT}`).replace(/\\/g, "");
}
function replaceSnippetDefaults(text) {
  return text.replace(/\$\{\d+:([^}]+)\}/g, "$1");
}
function getNodeTextSpan(node) {
  const start = node.getStart() + 1;
  return {
    start,
    length: node.getWidth() - 2
  };
}
function appendKindModifier(kindModifiers, modifier) {
  const modifiers = new Set(
    (kindModifiers ?? "").split(",").map((part) => part.trim()).filter(Boolean)
  );
  modifiers.add(modifier);
  return [...modifiers].join(",");
}
function createDeprecatedSemanticDiagnostics(ts, usages) {
  return createDeprecatedDiagnostics(ts, usages);
}
function createDeprecatedDiagnostics(ts, usages) {
  const diagnostics = [];
  for (const { node, info } of usages) {
    const deprecatedTag = getDeprecatedTag(info.tags);
    if (!deprecatedTag) continue;
    diagnostics.push({
      file: node.getSourceFile(),
      start: node.getStart(),
      length: node.getWidth(),
      category: ts.DiagnosticCategory.Suggestion,
      code: 6385,
      messageText: formatDeprecatedMessage(node.getText(), deprecatedTag),
      source: "ts-union-docs-plugin",
      reportsDeprecated: {}
    });
  }
  return diagnostics;
}
function formatDeprecatedMessage(nodeText, deprecatedTag) {
  const tagText = getTagText(deprecatedTag);
  return tagText ? `${nodeText} is deprecated. ${tagText}` : `${nodeText} is deprecated.`;
}
function addExtraQuickInfo(_ts, quickInfo, typesInfo) {
  if (typesInfo.length === 0) return;
  switch (typesInfo[0].type) {
    case SupportedType.Parameter:
      return addExtraJDocTagInfo(quickInfo, typesInfo);
    case SupportedType.Variable:
      return addExtraDocumentation(quickInfo, typesInfo);
  }
}
function createFallbackQuickInfo(ts, pos, typeInfo) {
  return {
    kind: ts.ScriptElementKind.string,
    kindModifiers: "",
    textSpan: {
      start: pos,
      length: typeInfo[0]?.value?.length ?? 1
    },
    displayParts: typeInfo[0]?.value ? [
      {
        kind: "stringLiteral",
        text: JSON.stringify(typeInfo[0].value)
      }
    ] : void 0
  };
}
function addExtraJDocTagInfo(quickInfo, typesInfo) {
  if (!quickInfo.tags) quickInfo.tags = [];
  const tagIdxs = quickInfo.tags.map((tag, idx) => ({ tag, idx })).filter((entry) => entry.tag.name === "param");
  const newTags = [
    ...tagIdxs.length > 0 ? quickInfo.tags.filter((_, i) => i < tagIdxs[0].idx) : quickInfo.tags
  ];
  for (const typeInfo of typesInfo) {
    const jsDocTag = findJsDocParamTagByName(tagIdxs, typeInfo.name);
    if ((typeInfo.docComment?.length ?? 0) === 0) continue;
    const tag = jsDocTag?.tag ?? defaultParamJSDocTag(typeInfo.name);
    newTags.push(addTagInfo(tag, typeInfo));
  }
  const lastParamTagIdx = tagIdxs.length === 0 ? 0 : tagIdxs[tagIdxs.length - 1]?.idx ?? 0;
  if (quickInfo.tags.length - 1 > lastParamTagIdx)
    newTags.push(...quickInfo.tags.filter((_, i) => i > lastParamTagIdx));
  quickInfo.tags = newTags;
}
function addExtraDocumentation(quickInfo, typesInfo) {
  const newDocs = quickInfo.documentation ? [...quickInfo.documentation] : [];
  for (const typeInfo of typesInfo) {
    if ((typeInfo.docComment?.length ?? 0) === 0) continue;
    newDocs.push(
      createMarkdownDisplayPart(formatDocComment(typeInfo.docComment ?? []))
    );
  }
  quickInfo.documentation = newDocs;
}
function findJsDocParamTagByName(tags, name) {
  return tags.find(
    ({ tag }) => tag.text?.some(
      (textPart) => textPart.kind === "parameterName" && textPart.text.toLowerCase() === name.toLowerCase()
    )
  ) ?? null;
}
function defaultParamJSDocTag(name) {
  return {
    name: "param",
    text: [
      {
        kind: "keyword",
        text: name
      }
    ]
  };
}
function createMarkdownDisplayPart(mdText) {
  return {
    text: mdText,
    kind: "markdown"
  };
}
function addTagInfo(oldTag, typeInfo) {
  if (!typeInfo?.docComment) return oldTag;
  const newTag = JSON.parse(JSON.stringify(oldTag));
  if (!newTag.text) newTag.text = [];
  newTag.text.push(createMarkdownDisplayPart(formatDocComment(typeInfo.docComment)));
  return newTag;
}
function formatDocComment(lines) {
  return lines.map((line, index) => index > 0 ? `> ${line}` : line).join("\n");
}
class UnionTypeDocsPlugin {
  constructor(ts) {
    this.ts = ts;
  }
  create(info) {
    const logger = info.project.projectService.logger, languageService = info.languageService, ts = this.ts, typeInfoFactory = new TypeInfoFactory(this.ts, languageService), proxy = createLanguageServiceProxy(languageService);
    proxy.getQuickInfoAtPosition = (fileName, pos) => {
      try {
        const typeInfo = typeInfoFactory.getTypeInfo(fileName, pos);
        const quickInfo = languageService.getQuickInfoAtPosition(fileName, pos) ?? (typeInfo ? createFallbackQuickInfo(ts, pos, typeInfo) : void 0);
        if (!quickInfo || !typeInfo) return quickInfo;
        addExtraQuickInfo(ts, quickInfo, typeInfo);
        return quickInfo;
      } catch (err) {
        logPluginError(ts, logger, "Quick Info", err);
        return languageService.getQuickInfoAtPosition(fileName, pos);
      }
    };
    proxy.getCompletionsAtPosition = (fileName, pos, opts, fmt) => {
      const completions = languageService.getCompletionsAtPosition(fileName, pos, opts, fmt) ?? defaultComplInfo();
      try {
        const completionInfo = typeInfoFactory.getCompletionInfo(fileName, pos);
        if (completionInfo)
          applyCompletionInfo(ts, completions, completionInfo);
      } catch (err) {
        logPluginError(ts, logger, "Completion", err);
      }
      return completions;
    };
    proxy.getCompletionEntryDetails = (fileName, position, name, formatOptions, source, preferences, data) => {
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
        logPluginError(this.ts, logger, "Completion Details", err);
      }
      return details;
    };
    proxy.getSemanticDiagnostics = (fileName) => appendDeprecatedDiagnostics(
      languageService.getSemanticDiagnostics(fileName),
      () => createDeprecatedSemanticDiagnostics(
        this.ts,
        typeInfoFactory.getDeprecatedUsageInfos(fileName)
      ),
      (err) => logPluginError(this.ts, logger, "Semantic Diagnostics", err)
    );
    logger.info("[Union type docs plugin] Loaded");
    return proxy;
  }
}
function createLanguageServiceProxy(languageService) {
  const proxy = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(languageService)) {
    const value = languageService[key];
    proxy[key] = typeof value === "function" ? value.bind(languageService) : value;
  }
  return proxy;
}
function appendDeprecatedDiagnostics(diagnostics, createDiagnostics, onError) {
  const nextDiagnostics = [...diagnostics];
  try {
    nextDiagnostics.push(...createDiagnostics());
  } catch (err) {
    onError(err);
  }
  return nextDiagnostics;
}
function logPluginError(ts, logger, at, err) {
  logger.msg(
    `[TS Union Docs ${at} Error]: ${errToString(err)}`,
    ts.server.Msg.Err
  );
}
function errToString(err) {
  if (err instanceof Error) return `${err.message} | ${err.stack}`;
  if (typeof err === "string") return err;
  return String(err);
}
module.exports = (mod) => new UnionTypeDocsPlugin(mod.typescript);
//# sourceMappingURL=index.js.map
