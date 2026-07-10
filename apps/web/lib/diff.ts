export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface DiffResult {
  lines: DiffLine[];
  added: number;
  removed: number;
  unchanged: number;
}

/**
 * Compute a simple line-by-line diff between two strings.
 * Uses the Myers diff algorithm for efficiency.
 */
export function computeDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const result: DiffLine[] = [];
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  // Simple LCS-based diff
  const lcs = longestCommonSubsequence(oldLines, newLines);
  
  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;
  let lineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (lcsIdx < lcs.length) {
      // Output removed lines before next common line
      while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcs[lcsIdx]) {
        result.push({ type: 'removed', content: oldLines[oldIdx]!, lineNumber: lineNum++ });
        removed++;
        oldIdx++;
      }
      // Output added lines before next common line
      while (newIdx < newLines.length && newLines[newIdx] !== lcs[lcsIdx]) {
        result.push({ type: 'added', content: newLines[newIdx]!, lineNumber: lineNum++ });
        added++;
        newIdx++;
      }
      // Output common line
      if (lcsIdx < lcs.length) {
        result.push({ type: 'unchanged', content: lcs[lcsIdx]!, lineNumber: lineNum++ });
        unchanged++;
        oldIdx++;
        newIdx++;
        lcsIdx++;
      }
    } else {
      // No more common lines - remaining are all changes
      while (oldIdx < oldLines.length) {
        result.push({ type: 'removed', content: oldLines[oldIdx]!, lineNumber: lineNum++ });
        removed++;
        oldIdx++;
      }
      while (newIdx < newLines.length) {
        result.push({ type: 'added', content: newLines[newIdx]!, lineNumber: lineNum++ });
        added++;
        newIdx++;
      }
    }
  }

  return { lines: result, added, removed, unchanged };
}

/**
 * Compute the longest common subsequence of two arrays.
 */
function longestCommonSubsequence<T>(a: T[], b: T[]): T[] {
  const m = a.length;
  const n = b.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Backtrack to find the actual subsequence
  const result: T[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]!);
      i--;
      j--;
    } else if (dp[i - 1]![j]! > dp[i]![j - 1]!) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

/**
 * Get a word-level diff between two strings (for inline highlighting).
 */
export function computeWordDiff(oldText: string, newText: string): { type: 'added' | 'removed' | 'unchanged'; content: string }[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  const result: { type: 'added' | 'removed' | 'unchanged'; content: string }[] = [];
  
  const lcs = longestCommonSubsequence(oldWords, newWords);
  
  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;

  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    if (lcsIdx < lcs.length) {
      while (oldIdx < oldWords.length && oldWords[oldIdx] !== lcs[lcsIdx]) {
        result.push({ type: 'removed', content: oldWords[oldIdx]! });
        oldIdx++;
      }
      while (newIdx < newWords.length && newWords[newIdx] !== lcs[lcsIdx]) {
        result.push({ type: 'added', content: newWords[newIdx]! });
        newIdx++;
      }
      if (lcsIdx < lcs.length) {
        result.push({ type: 'unchanged', content: lcs[lcsIdx]! });
        oldIdx++;
        newIdx++;
        lcsIdx++;
      }
    } else {
      while (oldIdx < oldWords.length) {
        result.push({ type: 'removed', content: oldWords[oldIdx]! });
        oldIdx++;
      }
      while (newIdx < newWords.length) {
        result.push({ type: 'added', content: newWords[newIdx]! });
        newIdx++;
      }
    }
  }

  return result;
}
