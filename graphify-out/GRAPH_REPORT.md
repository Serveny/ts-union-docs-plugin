# Graph Report - .  (2026-07-29)

## Corpus Check
- 41 files · ~70,966 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 225 nodes · 365 edges · 25 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]

## God Nodes (most connected - your core abstractions)
1. `TypeInfoFactory` - 63 edges
2. `addParamTagDescription()` - 8 edges
3. `TypeScript Union Docs Plugin` - 8 edges
4. `buildParamTags()` - 6 edges
5. `createTemplateCompletions()` - 5 edges
6. `createDeprecatedDiagnostics()` - 5 edges
7. `addExtraParamTagInfo()` - 5 edges
8. `addExtraDocumentation()` - 5 edges
9. `formatQuotedParamTag()` - 5 edges
10. `prepareJSDocMetadata()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Union Type Variable Member Docs` --implements--> `Resolve Union Member JSDoc Into Tooltip`  [INFERRED]
  tests/quick-info-tests/union-type-var.test.ts → README.md
- `Union Type Property Member Docs` --implements--> `Resolve Union Member JSDoc Into Tooltip`  [INFERRED]
  tests/quick-info-tests/union-type-prop.test.ts → README.md
- `Deprecated Union Member Completion Flags` --conceptually_related_to--> `0.3.0 Deprecated Union Member Support`  [INFERRED]
  tests/completion-tests/deprecated-union-members.test.ts → CHANGELOG.md
- `Constructor Union Type Parameter Docs` --implements--> `Resolve Union Member JSDoc Into Tooltip`  [INFERRED]
  tests/quick-info-tests/constructor-union-type-param.test.ts → README.md
- `Constructor Union Type Parameter Docs` --conceptually_related_to--> `0.2.0 Constructor Union Parameter Support`  [INFERRED]
  tests/quick-info-tests/constructor-union-type-param.test.ts → CHANGELOG.md

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

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (2): isClassLikeTypeParameterOwner(), TypeInfoFactory

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (25): addExtraDocumentation(), addExtraParamTagInfo(), addExtraQuickInfo(), addExtraVariableQuickInfo(), addParamTagDescription(), appendUnionTags(), buildParamTags(), cloneTag() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (18): calledNode(), cartesianProduct(), escapeRegExp(), extractDocComment(), extractJSDocMetadataFromNode(), extractJSDocTags(), getLeadingComment(), getNodeText() (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (22): 0.2.0 Constructor Union Parameter Support, Constructor Union Type Parameter Docs, Mixxx Constructor Parameter Completion Snippets, Mixxx Dynamic Control Completion Snippets, Mixxx Dynamic Group Completion Snippets, Mixxx Button Constructor Parameter Docs, Mixxx Group-Specific Documentation Filtering, Mixxx Multiline Param Markdown Rendering (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.2
Nodes (13): addDeprecatedCompletionEntryDetails(), addTemplateCompletions(), appendKindModifier(), applyCompletionInfo(), createTemplateCompletions(), getNodeTextSpan(), markDeprecatedEntries(), regexToSnippet() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (16): 0.1.0 Template Completion Support, 0.3.0 Deprecated Union Member Support, 0.3.2 Generic Completion and Constructor Fixes, Plugin Release History, Deprecated Union Member Completion Flags, Deprecated Union Member Completion Detail Metadata, No Duplicate Deprecated Suggestion Diagnostics, Deprecated Union Member Semantic Diagnostics (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.24
Nodes (3): getExpressionValueText(), isRegexNode(), isStringLikeExpression()

### Community 7 - "Community 7"
Cohesion: 0.39
Nodes (9): Blue Union Member, color1 Parameter, color2 Parameter, Color Swatch Icons, Color Type, Editor Hover Tooltip, logColors Function, Range Tag 1-900 (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (8): Autocomplete Popup, Code Editor Screenshot, Color Completion Suggestions, JSDoc Union Member Comments, logColors Call, @range Tag, red-0 Numeric Suggestion, TypeScript Color Union

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (5): Completion Entry Details Interception, Completion Interception, Plugin Error Logging, Quick Info Interception, Semantic Diagnostics Interception

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (4): TSServer Plugin Factory Export, Language Service Proxy, UnionTypeDocsPlugin, Test Language Service Proxy Factory

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (4): Mixxx Control Lookup Demo, Mixxx Group to Control Mapping, Template-Based Mixxx Control Groups, Mixxx Generic Control Flow Case

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (3): Declaration File Generation, Vite CommonJS Library Build, TypeScript Runtime Externalization

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (2): Nested Template Union Parameter Case, Union Type Parameter Color Case

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (1): Vitest Test Discovery

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (1): Color Union Documentation Demo

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (1): QuickInfo and Diagnostic Text Helpers

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (1): Inline Union Parameter Case

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (1): Union Type Variable Case

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (1): Union Type Property Case

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (1): Deprecated Union Members Case

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (1): Non-Param Tag Preservation Case

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): Inline Union Parameter Produces No Extra Quick Info Docs

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): Nested Union Type Parameter Docs

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): Non-Param Tag Preservation During Param Injection

## Knowledge Gaps
- **47 isolated node(s):** `TypeScript Runtime Externalization`, `Declaration File Generation`, `Vitest Test Discovery`, `TSServer Plugin Factory Export`, `Quick Info Interception` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (50 nodes): `isClassLikeTypeParameterOwner()`, `TypeInfoFactory`, `.addEnclosingTypeParameterMappings()`, `.addSignatureTypeParameterMappings()`, `.buildCallTypeParameterMap()`, `.buildTypeArgumentMap()`, `.collectConditionalTypeNode()`, `.collectDocMetadata()`, `.collectIndexedAccessTypeNode()`, `.collectKeyOfKeywordTypeOperatorNode()`, `.collectLiteralValues()`, `.collectMappedTypeNode()`, `.collectTupleTypeNode()`, `.collectTypeLiteralNode()`, `.collectTypeQueryNode()`, `.collectTypeReferenceNode()`, `.collectUnionMemberNodes()`, `.constructor()`, `.createCompletionEntryInfos()`, `.createUnionInfo()`, `.filterRegexMembers()`, `.findCallLikeExpression()`, `.findNodeAtPos()`, `.getCallExpression()`, `.getCompletionContext()`, `.getCompletionEntryInfo()`, `.getCompletionEntryName()`, `.getCompletionInfo()`, `.getExpressionName()`, `.getIndexedAccessMembersForKey()`, `.getInitNode()`, `.getParameterTypeContext()`, `.getTypeInfo()`, `.getTypeInfoForExpression()`, `.getTypeInfoForNode()`, `.getTypeNodeFromAlias()`, `.getTypeNodeFromInitializer()`, `.getTypeNodeFromParameter()`, `.getTypeParameterConstraintNode()`, `.getTypeReferenceSymbol()`, `.getUnionExpressionInfo()`, `.getUnionInfo()`, `.getUnionInfoForArgument()`, `.getUnionParametersInfo()`, `.getUnionVariableInfo()`, `.getValue()`, `.isDirectTypeParameterReference()`, `.normalizeTypeArgument()`, `.resolveMappedTypeNode()`, `.resolveTypeNode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `Nested Template Union Parameter Case`, `Union Type Parameter Color Case`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `Vitest Test Discovery`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `Color Union Documentation Demo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `QuickInfo and Diagnostic Text Helpers`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `Inline Union Parameter Case`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `Union Type Variable Case`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `Union Type Property Case`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `Deprecated Union Members Case`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `Non-Param Tag Preservation Case`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `Inline Union Parameter Produces No Extra Quick Info Docs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `Nested Union Type Parameter Docs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `Non-Param Tag Preservation During Param Injection`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TypeInfoFactory` connect `Community 0` to `Community 2`, `Community 6`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Why does `dedupeTagInfos()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `createDeprecatedDiagnostics()` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `TypeScript Runtime Externalization`, `Declaration File Generation`, `Vitest Test Discovery` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._