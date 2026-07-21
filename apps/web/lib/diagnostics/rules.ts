import type { DiagnosticCategory } from '@fluid/types';
export { type DiagnosticRule, resetDiagnosticCounter } from './rules/_infrastructure';
import type { DiagnosticRule } from './rules/_infrastructure';
import { missingFrontmatterRule, missingTitleRule, missingDescriptionRule, missingOwnerRule, missingTagsRule, frontmatterOverUsageRule } from './rules/_frontmatter-rules';
import { brokenLinkRule, orphanPageRule, unlinkedPageRule, inconsistentLinkStyleRule, hardcodedUrlRule, unnecessaryLinkTextRule, missingLinkTextRule, emptyLinkTargetRule, lowLinkDensityRule, highLinkDensityRule } from './rules/_link-rules';
import { headingHierarchyRule, multipleH1Rule, missingBlankLineBeforeHeadingRule, missingBlankLineAfterHeadingRule, trailingPunctuationInHeadingRule, headingEndsWithColonRule, structureDepthRule, missingTocRule } from './rules/_heading-rules';
import { invalidMarkdownRule, duplicateBlankLinesRule, trailingWhitespaceRule, markdownFormattingRule, deprecatedSyntaxRule, inconsistentListMarkersRule, multipleSpacesRule, missingNewlineEofRule, missingAltTextRule, inconsistentEmphasisRule, spaceBeforePunctuationRule, doublePunctuationRule, htmlEntitiesRule, missingSpaceAfterPunctuationRule, blankLineInBlockquoteRule, missingClosingBacktickRule, unspacedBlockquoteRule, repeatedWordsRule, missingSpaceAroundInlineCodeRule } from './rules/_formatting-rules';
import { duplicateTitleRule, brokenMermaidRule, brokenImageRule, emptyPageRule, largePageRule, missingCodeBlockLanguageRule, staleDocsRule, indentedCodeBlockRule, horizontalRuleRule, longLineLengthRule, tableMissingHeaderRule, tableInconsistentColumnsRule, missingCodeExamplesRule, tooManyDiagramsRule, codeLanguageDiversityRule, missingRelatedPagesRule } from './rules/_quality-rules';
import { ADVANCED_RULES } from './rules/_advanced-rules';

export const ALL_RULES: DiagnosticRule[] = [
  brokenLinkRule, missingFrontmatterRule, missingTitleRule, missingDescriptionRule,
  missingOwnerRule, missingTagsRule, duplicateTitleRule, invalidMarkdownRule,
  brokenMermaidRule, brokenImageRule, emptyPageRule, orphanPageRule,
  unlinkedPageRule, largePageRule, headingHierarchyRule, multipleH1Rule,
  duplicateBlankLinesRule, trailingWhitespaceRule, markdownFormattingRule,
  missingCodeBlockLanguageRule, staleDocsRule, missingTocRule, deprecatedSyntaxRule,
  missingBlankLineBeforeHeadingRule, missingBlankLineAfterHeadingRule,
  inconsistentListMarkersRule, multipleSpacesRule, missingNewlineEofRule,
  missingAltTextRule, inconsistentEmphasisRule, spaceBeforePunctuationRule,
  doublePunctuationRule, htmlEntitiesRule, missingSpaceAfterPunctuationRule,
  trailingPunctuationInHeadingRule, blankLineInBlockquoteRule,
  missingClosingBacktickRule, unspacedBlockquoteRule, repeatedWordsRule,
  missingSpaceAroundInlineCodeRule, headingEndsWithColonRule,
  inconsistentLinkStyleRule, indentedCodeBlockRule, hardcodedUrlRule,
  horizontalRuleRule, unnecessaryLinkTextRule, missingLinkTextRule,
  longLineLengthRule, emptyLinkTargetRule, frontmatterOverUsageRule,
  tableMissingHeaderRule, tableInconsistentColumnsRule, lowLinkDensityRule,
  highLinkDensityRule, missingCodeExamplesRule, tooManyDiagramsRule,
  codeLanguageDiversityRule, structureDepthRule, missingRelatedPagesRule,
  ...ADVANCED_RULES,
];

export function getRuleById(id: string): DiagnosticRule | undefined {
  return ALL_RULES.find((r) => r.id === id);
}

export function getRulesByCategory(category: DiagnosticCategory): DiagnosticRule[] {
  return ALL_RULES.filter((r) => r.category === category);
}

export function getAutoFixableRules(): DiagnosticRule[] {
  return ALL_RULES.filter((r) => r.canAutoFix);
}
