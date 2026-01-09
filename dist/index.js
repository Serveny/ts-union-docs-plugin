"use strict";
var SupportedType = /* @__PURE__ */ ((SupportedType2) => {
  SupportedType2[SupportedType2["Paramter"] = 0] = "Paramter";
  SupportedType2[SupportedType2["Variable"] = 1] = "Variable";
  return SupportedType2;
})(SupportedType || {});
class UnionInfo {
  constructor(type, name, initNode, entries, value, docComment) {
    this.type = type;
    this.name = name;
    this.initNode = initNode;
    this.entries = entries;
    this.value = value;
    this.docComment = docComment;
  }
}
class TypeInfoFactory {
  constructor(ts, ls) {
    this.ts = ts;
    this.ls = ls;
  }
  getTypeInfo(fileName, position) {
    const node = this.getInitNode(fileName, position);
    if (!node) return null;
    const symbol = this.checker.getSymbolAtLocation(node);
    if (!symbol) return null;
    const callExpression = this.getCallExpression(node);
    if (callExpression) return this.getUnionParamtersInfo(callExpression);
    const variableInfo = this.getUnionVariableInfo(symbol);
    if (variableInfo) return [variableInfo];
    return null;
  }
  getContextualTypeInfo(fileName, position) {
    const node = this.getInitNode(fileName, position);
    if (!node || !this.ts.isExpression(node)) return null;
    const contextualType = this.checker.getContextualType(node);
    if (!contextualType) return null;
    let typeNode = null;
    if (contextualType.aliasSymbol) {
      const decl = contextualType.aliasSymbol.getDeclarations()?.[0];
      if (decl && this.ts.isTypeAliasDeclaration(decl)) {
        typeNode = decl.type;
      }
    }
    if (!typeNode) {
      const callLike = this.findCallLikeExpression(node);
      if (callLike) {
        const signature = this.checker.getResolvedSignature(callLike);
        const argIndex = callLike.arguments?.indexOf(node) ?? 0;
        const paramSymbol = signature?.getParameters()[argIndex];
        const paramDecl = paramSymbol?.getDeclarations()?.[0];
        if (paramDecl && this.ts.isParameter(paramDecl) && paramDecl.type) {
          typeNode = paramDecl.type;
        }
      }
    }
    if (!typeNode) return null;
    const unionMemberNodes = this.collectUnionMemberNodes(typeNode);
    const filteredNodes = unionMemberNodes.filter((memberNode) => {
      if (memberNode.isRegexPattern !== true) return false;
      const original = memberNode.callParent ?? memberNode.original ?? memberNode;
      if (this.ts.isTemplateLiteralTypeNode(memberNode)) {
        return (contextualType.getFlags() & this.ts.TypeFlags.StringLike) !== 0;
      }
      const memberType = this.checker.getTypeAtLocation(original);
      const isMatch = this.checker.isTypeAssignableTo(
        memberType,
        contextualType
      );
      return isMatch;
    });
    return new UnionInfo(
      1,
      "completion",
      node,
      filteredNodes,
      void 0
    );
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
  getUnionInfo(paramSymbol, arg) {
    const decl = paramSymbol.valueDeclaration;
    if (!decl || !this.ts.isParameter(decl) || !decl.type) return null;
    const unionMemberNodes = this.collectUnionMemberNodes(decl.type);
    if (unionMemberNodes.length === 0) return null;
    const value = this.getValue(arg);
    const valueNodes = unionMemberNodes.filter((entry) => this.cmp(arg, entry));
    return new UnionInfo(
      0,
      paramSymbol.name,
      decl.type,
      valueNodes,
      value
    );
  }
  getUnionVariableInfo(symbol) {
    const decl = symbol.valueDeclaration;
    if (!decl || !(this.ts.isVariableDeclaration(decl) || this.ts.isPropertyDeclaration(decl)))
      return null;
    if (!decl.type || !decl.initializer) return null;
    const unionMemberNodes = this.collectUnionMemberNodes(decl.type);
    if (unionMemberNodes.length === 0) return null;
    const value = this.getValue(decl.initializer);
    const valueNodes = unionMemberNodes.filter(
      (entry) => this.cmp(decl.initializer, entry)
    );
    return new UnionInfo(
      1,
      symbol.name,
      decl.type,
      valueNodes,
      value
    );
  }
  getInitNode(fileName, position) {
    const program = this.ls.getProgram();
    if (!program) return null;
    this.checker = program.getTypeChecker();
    if (!this.checker) return null;
    const source = program.getSourceFile(fileName);
    if (!source) return null;
    const node = this.findNodeAtPos(source, position);
    if (!node) return null;
    return node;
  }
  findNodeAtPos(srcFile, pos) {
    const find = (node) => pos >= node.getStart() && pos < node.getEnd() ? this.ts.forEachChild(node, find) || node : null;
    return find(srcFile);
  }
  getCallExpression(node) {
    if (this.ts.isCallExpression(node)) return node;
    while (node && !this.ts.isCallExpression(node)) node = node.parent;
    return node;
  }
  getUnionParamtersInfo(callExpr) {
    const paramTypes = [];
    const signature = this.checker.getResolvedSignature(callExpr);
    if (!signature) return paramTypes;
    const args = callExpr.arguments;
    const params = signature.getParameters();
    for (let i = 0; i < params.length; i++) {
      const paramInfo = this.getUnionInfo(params[i], args[i]);
      if (paramInfo) paramTypes.push(paramInfo);
    }
    return paramTypes;
  }
  getValue(expr) {
    return this.ts.isLiteralExpression(expr) ? expr.text : expr.getText();
  }
  collectUnionMemberNodes(node, callParent) {
    const ts = this.ts;
    node.codeText = getNodeText(node);
    if (ts.isUnionTypeNode(node) || // e.g. string | number
    ts.isIntersectionTypeNode(node) || // e.g. Class1 & Class2
    ts.isHeritageClause(node)) {
      return node.types.flatMap(
        (tn) => this.collectUnionMemberNodes(tn, callParent)
      );
    }
    if (ts.isConditionalTypeNode(node))
      return this.collectConditionalTypeNode(node);
    if (ts.isIndexedAccessTypeNode(node))
      return this.collectIndexedAccessTypeNode(node);
    if (ts.isTypeLiteralNode(node)) return this.collectTypeLiteralNode(node);
    if (ts.isMappedTypeNode(node)) return this.collectMappedTypeNode(node);
    if (ts.isTypeReferenceNode(node))
      return this.collectTypeReferenceNode(node);
    if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword)
      return this.collectKeyOfKeywordTypeOperatorNode(node, callParent);
    if (ts.isParenthesizedTypeNode(node))
      return this.collectUnionMemberNodes(node.type, node);
    if (ts.isArrayTypeNode(node))
      return this.collectUnionMemberNodes(node.elementType, node);
    if (ts.isTupleTypeNode(node)) return this.collectTupleTypeNode(node);
    if (ts.isTypeQueryNode(node)) return this.collectTypeQueryNode(node);
    if (ts.isTemplateLiteralTypeNode(node))
      return this.buildTemplateLiteralNode(node);
    if (ts.isLiteralTypeNode(node) || // e.g. "text", 42, true
    ts.isTypeNode(node)) {
      return [calledNode(node, callParent)];
    }
    console.warn("Unknown node type: ", node);
    return [];
  }
  collectConditionalTypeNode(node) {
    return [
      ...this.collectUnionMemberNodes(node.checkType, node),
      ...this.collectUnionMemberNodes(node.extendsType, node),
      ...this.collectUnionMemberNodes(node.trueType, node),
      ...this.collectUnionMemberNodes(node.falseType, node)
    ];
  }
  collectIndexedAccessTypeNode(node) {
    return [
      ...this.collectUnionMemberNodes(node.objectType, node),
      ...this.collectUnionMemberNodes(node.indexType, node)
    ];
  }
  collectTypeLiteralNode(node) {
    return node.members.flatMap(
      (m) => m.type ? this.collectUnionMemberNodes(m.type, node) : []
    );
  }
  collectMappedTypeNode(node) {
    const results = [];
    if (node.typeParameter.constraint)
      results.push(
        ...this.collectUnionMemberNodes(node.typeParameter.constraint, node)
      );
    if (node.type)
      results.push(...this.collectUnionMemberNodes(node.type, node));
    return results;
  }
  collectTypeReferenceNode(node) {
    const checker = this.checker, ts = this.ts, symbol = checker.getSymbolAtLocation(node.typeName);
    if (!symbol) return [];
    const aliasedSymbol = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const decl = aliasedSymbol.declarations?.[0];
    if (!decl) return [];
    const tn = ts.isTypeParameterDeclaration(decl) ? decl.constraint ?? null : ts.isTypeAliasDeclaration(decl) ? decl.type : null;
    if (!tn) return [];
    return this.collectUnionMemberNodes(tn, node);
  }
  collectKeyOfKeywordTypeOperatorNode(node, callParent) {
    const ts = this.ts, checker = this.checker, type = checker.getTypeAtLocation(node.type);
    return type.getProperties().map((p) => {
      const decl = p.getDeclarations()?.[0];
      const litNode = ts.factory.createLiteralTypeNode(
        ts.factory.createStringLiteral(p.getName())
      );
      return calledNode(litNode, callParent, decl);
    });
  }
  collectTupleTypeNode(node) {
    return node.elements.flatMap(
      (el) => this.collectUnionMemberNodes(el, node)
    );
  }
  collectTypeQueryNode(node) {
    const symbol = this.checker.getSymbolAtLocation(node.exprName);
    if (symbol) {
      const decls = symbol.getDeclarations() ?? [];
      return decls.flatMap(
        (d) => this.collectUnionMemberNodes(d, node)
      );
    }
    return [];
  }
  createLiteralNode(node, text, callParent, isRegexPattern) {
    const litNode = this.ts.factory.createStringLiteral(text);
    litNode.id = node.original?.id ?? node.id;
    return calledNode(
      litNode,
      callParent,
      node.original ?? node,
      isRegexPattern
    );
  }
  // Creates new literal nodes with every possible content
  buildTemplateLiteralNode(node) {
    const headText = node.head.text, ts = this.ts;
    const nodes = [];
    for (const span of node.templateSpans) {
      const spanNodes = [];
      const innerTypeNodes = this.collectUnionMemberNodes(span.type, node);
      for (const tn of innerTypeNodes) {
        if (tn.isRegexPattern != null)
          spanNodes.push(tn);
        else if (ts.isLiteralTypeNode(tn) && (this.ts.isStringLiteral(tn.literal) || this.ts.isNumericLiteral(tn.literal)))
          spanNodes.push(
            this.createLiteralNode(
              tn,
              tn.literal.text + span.literal.text,
              node,
              false
            )
          );
        else if (tn.kind === ts.SyntaxKind.NumberKeyword)
          spanNodes.push(
            this.createLiteralNode(
              tn,
              "\\d+(\\.\\d+)?" + span.literal.text,
              node,
              true
            )
          );
        else if (tn.kind === ts.SyntaxKind.BooleanKeyword)
          spanNodes.push(
            this.createLiteralNode(
              tn,
              "(true|false)" + span.literal.text,
              node,
              true
            )
          );
        else if (tn.kind === ts.SyntaxKind.StringKeyword)
          spanNodes.push(
            this.createLiteralNode(tn, "\\.\\*" + span.literal.text, node, true)
          );
        else console.warn("Unknown type of template: ", tn);
      }
      nodes.push(spanNodes);
    }
    const catProd = cartesianProduct(nodes).flatMap((compNodes) => {
      const isRegex = compNodes.some((n) => n.isRegexPattern === true);
      const txt = (n) => isRegex && n.isRegexPattern === false ? escapeRegExp(n.text) : n.text;
      const head = isRegex ? escapeRegExp(headText) : headText;
      const fullText = head + compNodes.map(txt).join("");
      return compNodes.map(
        (cn) => this.createLiteralNode(cn, fullText, cn.callParent, isRegex)
      );
    });
    return catProd;
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
}
function calledNode(node, callParent, original, isRegex) {
  const cNode = node;
  cNode.callParent = callParent;
  cNode.original = original;
  cNode.isRegexPattern = isRegex;
  return cNode;
}
function getNodeText(node) {
  const text = node.getSourceFile()?.text;
  if (!text) return "<No Source>";
  return text.substring(node.getStart(), node.getEnd());
}
function isRegexNode(node) {
  return node.isRegexPattern === true;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function cartesianProduct(arrays) {
  return arrays.reduce(
    (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
    [[]]
  );
}
function addExtraQuickInfo(ts, quickInfo, typesInfo) {
  if (typesInfo.length === 0) return;
  typesInfo.forEach((p) => addDocComment(ts, p));
  switch (typesInfo[0].type) {
    case SupportedType.Paramter:
      return addExtraJDocTagInfo(quickInfo, typesInfo);
    case SupportedType.Variable:
      return addExtraDocumentation(quickInfo, typesInfo);
  }
}
function addExtraJDocTagInfo(quickInfo, typesInfo) {
  if (!quickInfo.tags) quickInfo.tags = [];
  const tagIdxs = quickInfo.tags?.map((tag, idx) => ({ tag, idx })).filter((ti) => ti.tag.name === "param") ?? [];
  const newTags = [
    ...tagIdxs.length > 0 ? quickInfo.tags.filter((_, i) => i < tagIdxs[0].idx) : quickInfo.tags
  ];
  for (const typeInfo of typesInfo) {
    const jsDocTag = findJsDocParamTagByName(tagIdxs, typeInfo.name);
    if ((typeInfo.docComment?.length ?? 0) > 0) {
      const tag = jsDocTag?.tag ?? defaultParamJSDocTag(typeInfo.name);
      const newTag = addTagInfo(tag, typeInfo);
      newTags.push(newTag);
    }
  }
  const lastParamTagIdx = tagIdxs.length === 0 ? 0 : tagIdxs[tagIdxs.length - 1]?.idx ?? 0;
  if (quickInfo.tags.length - 1 > lastParamTagIdx)
    newTags.push(...quickInfo.tags.filter((_, i) => i > lastParamTagIdx));
  quickInfo.tags = newTags;
}
function addExtraDocumentation(quickInfo, typesInfo) {
  const newDocs = quickInfo.documentation ? [...quickInfo.documentation] : [];
  for (const typeInfo of typesInfo) {
    newDocs.push(
      createMarkdownDisplayPart(
        typeInfo.docComment?.map((line, i) => i > 0 ? line = "> " + line : line).join("\n") ?? ""
      )
    );
  }
  quickInfo.documentation = newDocs;
}
function findJsDocParamTagByName(tags, name) {
  const foundTag = tags.find(
    ({ tag }) => tag.text?.some(
      (textPart) => textPart.kind === "parameterName" && textPart.text.toLowerCase() === name.toLowerCase()
    )
  );
  return foundTag ?? null;
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
  newTag.text.push(
    createMarkdownDisplayPart(
      typeInfo.docComment?.map((line, i) => i > 0 ? line = "> " + line : line).join("\n")
    )
  );
  return newTag;
}
function addDocComment(ts, param) {
  const visitedNodes = /* @__PURE__ */ new Set();
  const comments = [];
  function add(node) {
    const id = node.id;
    if (visitedNodes.has(id)) return false;
    visitedNodes.add(id);
    comments.push(extractJSDocsFromNode(ts, node));
    return true;
  }
  for (const entryNode of param.entries.reverse()) {
    add(entryNode);
    let parent = entryNode.callParent;
    while (parent != null) {
      add(parent);
      parent = parent.callParent;
    }
  }
  const lines = comments.reverse().flat();
  if (!param.docComment) param.docComment = lines;
  else param.docComment.push(...lines);
}
function extractJSDocsFromNode(ts, node) {
  node = node.original ?? node;
  const sourceFile = node.getSourceFile();
  if (!sourceFile) return [];
  const sourceText = sourceFile.getFullText();
  const start = node.getStart();
  const comment = getLeadingComment(ts, sourceText, start);
  return comment ? prepareJSDocText(sourceText.substring(comment.pos, comment.end)) : [];
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
function prepareJSDocText(rawComment) {
  return rawComment.replace("/**", "").replace("*/", "").split("\n").map((line) => line.trim().replace(/^\* ?/, "")).map((line) => line.replace(/@(\w+)/g, (_, tag) => `
> _@${tag}_`));
}
function addTemplateCompletions(ts, completion, unionInfo) {
  const entries = createTemplateCompletions(ts, unionInfo);
  if (entries.length === 0) return;
  completion.entries.push(...entries);
}
function createTemplateCompletions(ts, unionInfo) {
  const visitedNodes = /* @__PURE__ */ new Set();
  const entries = [];
  const templateNodes = unionInfo.entries.filter((n) => isRegexNode(n));
  if (templateNodes.length === 0) return entries;
  const replacementSpan = getNodeTextSpan(unionInfo.initNode);
  for (const tn of templateNodes) {
    const snippet = regexToSnippet(tn.text);
    if (visitedNodes.has(snippet)) continue;
    visitedNodes.add(snippet);
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
function replaceSnippetDefaults(str) {
  return str.replace(/\$\{\d+:([^}]+)\}/g, "$1");
}
function defaultComplInfo() {
  return {
    isGlobalCompletion: false,
    isMemberCompletion: false,
    isNewIdentifierLocation: false,
    entries: []
  };
}
function getNodeTextSpan(node) {
  const start = node.getStart() + 1;
  return {
    start,
    length: node.getWidth() - 2
  };
}
class UnionTypeDocsPlugin {
  constructor(ts) {
    this.ts = ts;
  }
  create(info) {
    this.logger = info.project.projectService.logger;
    this.ls = info.languageService;
    this.typeInfoFactory = new TypeInfoFactory(this.ts, this.ls);
    this.proxy = createLsProxy(this.ls);
    this.proxy.getQuickInfoAtPosition = this.getQuickInfoAtPosition.bind(this);
    this.proxy.getCompletionsAtPosition = this.getCompletionsAtPosition.bind(this);
    this.logger.info("[Union type docs plugin] Loaded");
    return this.proxy;
  }
  getQuickInfoAtPosition(fileName, pos) {
    const quickInfo = this.ls.getQuickInfoAtPosition(fileName, pos);
    if (!quickInfo) return quickInfo;
    try {
      const typeInfo = this.typeInfoFactory.getTypeInfo(fileName, pos);
      if (!typeInfo) return quickInfo;
      addExtraQuickInfo(this.ts, quickInfo, typeInfo);
    } catch (err) {
      this.logErr("Quick Info", err);
    }
    return quickInfo;
  }
  getCompletionsAtPosition(fileName, pos, opts, fmt) {
    const cmpl = this.ls.getCompletionsAtPosition(fileName, pos, opts, fmt) ?? defaultComplInfo();
    try {
      const typeInfo = this.typeInfoFactory.getContextualTypeInfo(
        fileName,
        pos
      );
      if (!typeInfo) return cmpl;
      addTemplateCompletions(this.ts, cmpl, typeInfo);
    } catch (err) {
      this.logErr("Completion", err);
    }
    return cmpl;
  }
  logErr(at, err) {
    this.logger.msg(
      `[TS Union Docs ${at} Error]: ${errToString(err)}`,
      this.ts.server.Msg.Err
    );
  }
}
function createLsProxy(oldLs) {
  const proxy = /* @__PURE__ */ Object.create(null);
  for (const k of Object.keys(oldLs)) {
    const x = oldLs[k];
    proxy[k] = typeof x === "function" ? x.bind(oldLs) : x;
  }
  return proxy;
}
function errToString(err) {
  if (err instanceof Error) return `${err.message} | ${err.stack}`;
  else if (typeof err === "string") return err;
  else return String(err);
}
module.exports = (mod) => new UnionTypeDocsPlugin(mod.typescript);
//# sourceMappingURL=index.js.map
