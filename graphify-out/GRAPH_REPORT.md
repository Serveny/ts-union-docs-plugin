# Graph Report - .  (2026-05-07)

## Corpus Check
- 37 files · ~52,845 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 331 nodes · 523 edges · 15 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Type Info Factory|Type Info Factory]]
- [[_COMMUNITY_Completion Semantics|Completion Semantics]]
- [[_COMMUNITY_Doc Parsing Helpers|Doc Parsing Helpers]]
- [[_COMMUNITY_Quick Info Rendering|Quick Info Rendering]]
- [[_COMMUNITY_Release Diagnostics|Release Diagnostics]]
- [[_COMMUNITY_README Usage Docs|README Usage Docs]]
- [[_COMMUNITY_Version Script|Version Script]]
- [[_COMMUNITY_Completion Pipeline|Completion Pipeline]]
- [[_COMMUNITY_Language Service Proxy|Language Service Proxy]]
- [[_COMMUNITY_Hover Demo Image|Hover Demo Image]]
- [[_COMMUNITY_Mixxx Type Stubs|Mixxx Type Stubs]]
- [[_COMMUNITY_Completion Demo Image|Completion Demo Image]]
- [[_COMMUNITY_Union Property Cases|Union Property Cases]]
- [[_COMMUNITY_Build Configuration|Build Configuration]]
- [[_COMMUNITY_Vitest Discovery|Vitest Discovery]]

## God Nodes (most connected - your core abstractions)
1. `TypeInfoFactory` - 63 edges
2. `main()` - 10 edges
3. `TypeInfoFactory` - 9 edges
4. `UnionInfo Metadata Model` - 9 edges
5. `TypeScript Union Docs Plugin` - 8 edges
6. `addParamTagDescription()` - 7 edges
7. `Deprecated Usage Diagnostics` - 7 edges
8. `createDeprecatedDiagnostics()` - 6 edges
9. `buildParamTags()` - 6 edges
10. `getTagText()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Union Type Variable Member Docs` --implements--> `Resolve Union Member JSDoc Into Tooltip`  [INFERRED]
  tests/quick-info-tests/union-type-var.test.ts → README.md
- `Union Type Property Member Docs` --implements--> `Resolve Union Member JSDoc Into Tooltip`  [INFERRED]
  tests/quick-info-tests/union-type-prop.test.ts → README.md
- `0.2.0 Constructor Union Parameter Support` --conceptually_related_to--> `Constructor Union Type Parameter Docs`  [INFERRED]
  CHANGELOG.md → tests/quick-info-tests/constructor-union-type-param.test.ts
- `Non-Param Tag Preservation Case` --semantically_similar_to--> `Completion Details Deprecation Tags`  [INFERRED] [semantically similar]
  tests/cases/union-type-param-non-param-tags.ts → src/completion.ts
- `Union Type Function Parameter Member Docs` --implements--> `Resolve Union Member JSDoc Into Tooltip`  [INFERRED]
  tests/quick-info-tests/union-type-param.test.ts → README.md

## Hyperedges (group relationships)
- **Language Service Extension Flow** — plugin_language_service_proxy, info_type_info_factory, docs_quick_info_enrichment, completion_completion_enrichment, diagnostics_deprecated_diagnostics [EXTRACTED 1.00]
- **Union Metadata Pipeline** — info_union_member_collection, info_doc_metadata_extraction, info_union_info, docs_quick_info_enrichment, completion_deprecated_entry_marking, diagnostics_deprecated_diagnostics [INFERRED 0.88]
- **Template Literal Completion Pipeline** — info_template_literal_resolution, completion_regex_to_snippet, completion_template_completion_generation, template_type_case, nested_union_type_param_case [INFERRED 0.84]
- **Quick Info Union Member Documentation Coverage** — union_type_param_member_docs, union_type_var_member_docs, union_type_prop_member_docs, constructor_union_type_param_docs, nested_union_type_param_docs [EXTRACTED 1.00]
- **Mixxx Dynamic Union Type Behavior** — mixxx_completions_dynamic_control_snippets, mixxx_completions_dynamic_group_snippets, mixxx_types_param_docs, mixxx_types_constructor_button_docs [EXTRACTED 1.00]
- **Release Automation Flow** — increment_version_interactive_release_prompt, increment_version_semver_bump, increment_version_package_manifest_updates, increment_version_git_release_discovery, increment_version_changelog_generation [EXTRACTED 1.00]
- **Color Union Documentation Pattern** — demo_color_type, demo_blue_union_member, demo_red_template_union_member, demo_range_tag [EXTRACTED 0.92]
- **Function Parameter Hover Documentation** — demo_logcolors_function, demo_color1_parameter, demo_color2_parameter, demo_editor_hover_tooltip [EXTRACTED 0.93]
- **TypeScript Union Completion Demo** — demo_completion_typescript_color_union, demo_completion_jsdoc_union_member_comments, demo_completion_autocomplete_popup, demo_completion_color_suggestions [EXTRACTED 0.90]
- **Range Driven Red Suggestions** — demo_completion_range_tag, demo_completion_color_suggestions, demo_completion_red_numeric_suggestion [INFERRED 0.77]

## Communities

### Community 0 - "Type Info Factory"
Cohesion: 0.08
Nodes (2): getNodeText(), TypeInfoFactory

### Community 1 - "Completion Semantics"
Cohesion: 0.07
Nodes (45): Completion Info Enrichment, Deprecated Completion Entry Marking, Completion Details Deprecation Tags, Regex Pattern to Snippet Conversion, Template Completion Generation, Deprecated Union Members Case, Deprecated Usage Diagnostics, Fallback Quick Info (+37 more)

### Community 2 - "Doc Parsing Helpers"
Cohesion: 0.1
Nodes (23): isVersionSubject(), calledNode(), cartesianProduct(), escapeRegExp(), extractDocComment(), extractJSDocMetadataFromNode(), extractJSDocTags(), getExpressionValueText() (+15 more)

### Community 3 - "Quick Info Rendering"
Cohesion: 0.15
Nodes (25): addExtraDocumentation(), addExtraParamTagInfo(), addExtraQuickInfo(), addExtraVariableQuickInfo(), addParamTagDescription(), appendUnionTags(), buildParamTags(), cloneTag() (+17 more)

### Community 4 - "Release Diagnostics"
Cohesion: 0.09
Nodes (26): 0.1.0 Template Completion Support, 0.2.0 Constructor Union Parameter Support, 0.3.0 Deprecated Union Member Support, 0.3.2 Generic Completion and Constructor Fixes, Plugin Release History, Deprecated Union Member Completion Flags, Deprecated Union Member Completion Detail Metadata, No Duplicate Deprecated Suggestion Diagnostics (+18 more)

### Community 5 - "README Usage Docs"
Cohesion: 0.12
Nodes (19): Constructor Union Type Parameter Docs, Inline Union Parameter Produces No Extra Quick Info Docs, Mixxx Button Constructor Parameter Docs, Nested Union Type Parameter Docs, Debug Project Must Be Outside Plugin Folder Rationale, Language Service Plugin Configuration, Local Testing Workflow, Plugin Feature Set (+11 more)

### Community 6 - "Version Script"
Cohesion: 0.23
Nodes (17): assertJsonObject(), bumpVersion(), classifyCommit(), cleanCommitMessage(), findLastReleaseRef(), formatChangelogLine(), getCommitsSince(), insertChangelogSection() (+9 more)

### Community 7 - "Completion Pipeline"
Cohesion: 0.19
Nodes (14): addDeprecatedCompletionEntryDetails(), addTemplateCompletions(), appendKindModifier(), applyCompletionInfo(), createTemplateCompletions(), getNodeTextSpan(), markDeprecatedEntries(), regexToSnippet() (+6 more)

### Community 8 - "Language Service Proxy"
Cohesion: 0.14
Nodes (5): createLanguageServiceProxy(), errToString(), logPluginError(), UnionTypeDocsPlugin, createProxyFromCase()

### Community 9 - "Hover Demo Image"
Cohesion: 0.39
Nodes (9): Blue Union Member, color1 Parameter, color2 Parameter, Color Swatch Icons, Color Type, Editor Hover Tooltip, logColors Function, Range Tag 1-900 (+1 more)

### Community 10 - "Mixxx Type Stubs"
Cohesion: 0.32
Nodes (4): Button, EncoderX, getValue(), setValue()

### Community 11 - "Completion Demo Image"
Cohesion: 0.29
Nodes (8): Autocomplete Popup, Code Editor Screenshot, Color Completion Suggestions, JSDoc Union Member Comments, logColors Call, @range Tag, red-0 Numeric Suggestion, TypeScript Color Union

### Community 15 - "Union Property Cases"
Cohesion: 0.4
Nodes (2): ColorPalette, VariableColorPalette

### Community 16 - "Build Configuration"
Cohesion: 0.67
Nodes (3): Declaration File Generation, Vite CommonJS Library Build, TypeScript Runtime Externalization

### Community 37 - "Vitest Discovery"
Cohesion: 1.0
Nodes (1): Vitest Test Discovery

## Knowledge Gaps
- **35 isolated node(s):** `TypeScript Runtime Externalization`, `Declaration File Generation`, `Vitest Test Discovery`, `TSServer Plugin Factory Export`, `Program-Scoped Cache Invalidation` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Type Info Factory`** (59 nodes): `getNodeText()`, `TypeInfoFactory`, `.addEnclosingTypeParameterMappings()`, `.addSignatureTypeParameterMappings()`, `.buildCallTypeParameterMap()`, `.buildTypeArgumentMap()`, `.clearCaches()`, `.collectConditionalTypeNode()`, `.collectDocMetadata()`, `.collectIndexedAccessTypeNode()`, `.collectKeyOfKeywordTypeOperatorNode()`, `.collectLiteralValues()`, `.collectMappedTypeNode()`, `.collectTupleTypeNode()`, `.collectTypeLiteralNode()`, `.collectTypeQueryNode()`, `.collectTypeReferenceNode()`, `.collectUnionMemberNodes()`, `.constructor()`, `.createCompletionEntryInfos()`, `.createTypeNodeFromExpression()`, `.createUnionInfo()`, `.filterRegexMembers()`, `.findCallLikeExpression()`, `.findNodeAtPos()`, `.getCallExpression()`, `.getCompletionContext()`, `.getCompletionEntryInfo()`, `.getCompletionEntryName()`, `.getCompletionInfo()`, `.getDeprecatedUsageInfos()`, `.getExpressionName()`, `.getIndexedAccessMembersForKey()`, `.getInitNode()`, `.getParameterTypeContext()`, `.getProgram()`, `.getReferencedSymbol()`, `.getSourceFile()`, `.getTypeInfo()`, `.getTypeInfoForExpression()`, `.getTypeInfoForNode()`, `.getTypeNodeFromAlias()`, `.getTypeNodeFromInitializer()`, `.getTypeNodeFromParameter()`, `.getTypeParameterConstraintNode()`, `.getTypeReferenceSymbol()`, `.getUnionExpressionInfo()`, `.getUnionInfo()`, `.getUnionInfoForArgument()`, `.getUnionParametersInfo()`, `.getUnionVariableInfo()`, `.getValue()`, `.inferTypeArgumentFromParameters()`, `.isDirectTypeParameterReference()`, `.normalizeTypeArgument()`, `.resolveExpression()`, `.resolveMappedTypeNode()`, `.resolveTypeNode()`, `.unwrapExpression()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Union Property Cases`** (5 nodes): `union-type-prop.ts`, `ColorPalette`, `.print()`, `VariableColorPalette`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Discovery`** (1 nodes): `Vitest Test Discovery`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TypeInfoFactory` connect `Type Info Factory` to `Doc Parsing Helpers`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `getTagText()` connect `Quick Info Rendering` to `Doc Parsing Helpers`, `Completion Pipeline`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `getDeprecatedTag()` connect `Completion Pipeline` to `Doc Parsing Helpers`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `TypeScript Runtime Externalization`, `Declaration File Generation`, `Vitest Test Discovery` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Type Info Factory` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Completion Semantics` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Doc Parsing Helpers` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._