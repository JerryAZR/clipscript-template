import { diffLines } from "diff";
import { diffWords } from "./word-diff";

/**
 * Authoring aid behind scripts/annotate-diff.mts: turns pristine file
 * versions into the annotated step files an author would write by hand.
 *
 * Two modes:
 * - animated: each version becomes a step file; removals are marked `!diff -`
 *   in the OLD file, additions `!diff +` in the NEW file, and similar
 *   modified line pairs collapse to a trailing `!from <old line>` comment
 *   (token-level diff, see word-diff.ts). Middle files of a chain accumulate
 *   markers from both their inbound and outbound transitions.
 * - static: one merged diff file per transition - the full new file with
 *   removed lines inserted at their original positions, all marked, for
 *   "review this change" beats where nothing animates.
 *
 * Pairing is per line: similar modified lines collapse to `!from`, unpaired
 * or dissimilar lines fall back to line-level `!diff -`/`+` (an inline token
 * diff of a rewrite would be a wall of struck text).
 */

export type PairReport = {
  /** 0-based index of the transition (0 = first file -> second file) */
  index: number;
  /** lines marked !diff + in the new file */
  added: number;
  /** lines marked !diff - in the old file */
  removed: number;
  /** lines annotated !from in the new file */
  inline: number;
  /** hunks that fell back to line-level diff despite having both sides */
  fallbacks: { newStartLine: number; removed: number; added: number }[];
};

export const DEFAULT_SIMILARITY_THRESHOLD = 0.5;

const LINE_COMMENT_TOKENS: Record<string, string> = {
  // prettier-ignore
  ts: "//", tsx: "//", js: "//", jsx: "//", mts: "//", cts: "//",
  c: "//", h: "//", cpp: "//", cc: "//", hpp: "//", cs: "//",
  java: "//", go: "//", rs: "//", swift: "//", kt: "//", kts: "//",
  scala: "//", php: "//", dart: "//",
  py: "#", rb: "#", pl: "#", sh: "#", bash: "#", zsh: "#",
  yaml: "#", yml: "#", toml: "#", r: "#", jl: "#", ex: "#", exs: "#",
  lua: "--", sql: "--", hs: "--",
};

export const lineCommentToken = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const token = LINE_COMMENT_TOKENS[ext];
  if (!token) {
    throw new Error(
      `annotate-diff: no line comment token known for ".${ext}" (${filename}) - add it to LINE_COMMENT_TOKENS`,
    );
  }
  return token;
};

const ALREADY_ANNOTATED = /!(diff\(|from\s)/;

export const assertPristine = (text: string, filename: string) => {
  if (ALREADY_ANNOTATED.test(text)) {
    throw new Error(
      `annotate-diff: ${filename} already contains !diff/!from annotations - pass pristine sources`,
    );
  }
};

/** character-level overlap ratio of two lines, 0..1 */
export const lineSimilarity = (a: string, b: string): number => {
  if (a === b) return 1;
  if (a.length + b.length === 0) return 1;
  const same = diffWords(a, b)
    .filter((op) => op.type === "same")
    .reduce((n, op) => n + op.text.length, 0);
  return (2 * same) / (a.length + b.length);
};

// --- diff parsing -----------------------------------------------------------

type RemoveEntry = { type: "remove"; line: string; oldLine: number };
type AddEntry = { type: "add"; line: string; newLine: number };
type DiffEntry = { type: "same"; line: string } | RemoveEntry | AddEntry;

/** flattens diffLines parts into per-line entries with 1-based line numbers */
const flattenLineDiff = (oldText: string, newText: string): DiffEntry[] => {
  const entries: DiffEntry[] = [];
  let oldLine = 1;
  let newLine = 1;
  for (const part of diffLines(oldText, newText)) {
    const lines = part.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop(); // trailing newline
    for (const line of lines) {
      if (part.added) {
        entries.push({ type: "add", line, newLine: newLine++ });
      } else if (part.removed) {
        entries.push({ type: "remove", line, oldLine: oldLine++ });
      } else {
        entries.push({ type: "same", line });
        oldLine++;
        newLine++;
      }
    }
  }
  return entries;
};

type Hunk = { removed: RemoveEntry[]; added: AddEntry[] };

/** groups consecutive change entries into hunks (context lines break hunks) */
const toHunks = (entries: DiffEntry[]): Hunk[] => {
  const hunks: Hunk[] = [];
  let current: Hunk | null = null;
  for (const entry of entries) {
    if (entry.type === "same") {
      current = null;
      continue;
    }
    if (!current) {
      current = { removed: [], added: [] };
      hunks.push(current);
    }
    if (entry.type === "remove") current.removed.push(entry);
    else current.added.push(entry);
  }
  return hunks;
};

// --- marker emission --------------------------------------------------------

type MarkerOps = {
  /** comment lines to insert before pristine line N (1-based) */
  above: Map<number, string[]>;
  /** trailing comment to append to pristine line N */
  trailing: Map<number, string>;
};

const emptyOps = (): MarkerOps => ({ above: new Map(), trailing: new Map() });

const mergeOps = (a: MarkerOps, b: MarkerOps): MarkerOps => ({
  // inbound markers (+, from the previous transition) come before outbound
  // ones (-, for the next transition) when both target the same line
  above: new Map(
    [...new Set([...a.above.keys(), ...b.above.keys()])].map((line) => [
      line,
      [...(a.above.get(line) ?? []), ...(b.above.get(line) ?? [])],
    ]),
  ),
  trailing: new Map([...a.trailing, ...b.trailing]),
});

const indentOf = (line: string): string => line.match(/^\s*/)?.[0] ?? "";

const diffMarker = (indent: string, token: string, count: number, sign: string) =>
  `${indent}${token} !diff(1:${count}) ${sign}`;

/**
 * Plans one hunk. Pairing is per line, not per hunk: the i-th removed line
 * pairs with the i-th added line when they are similar enough (and the new
 * line can carry a trailing comment); unpaired and dissimilar lines fall
 * back to line-level `!diff`. A hunk can therefore mix both kinds - a
 * modified line next to a pure removal is the common case.
 */
type HunkPlan = {
  inlinePairs: { removed: RemoveEntry; added: AddEntry }[];
  lineRemoved: RemoveEntry[];
  lineAdded: AddEntry[];
};

const planHunk = (hunk: Hunk, token: string, threshold: number): HunkPlan => {
  const plan: HunkPlan = { inlinePairs: [], lineRemoved: [], lineAdded: [] };
  const n = Math.min(hunk.removed.length, hunk.added.length);
  for (let i = 0; i < n; i++) {
    const removed = hunk.removed[i];
    const added = hunk.added[i];
    // a trailing !from comment after a real comment would be swallowed by
    // the first comment token, so such pairs can't go inline
    if (lineSimilarity(removed.line, added.line) >= threshold && !added.line.includes(token)) {
      plan.inlinePairs.push({ removed, added });
    } else {
      plan.lineRemoved.push(removed);
      plan.lineAdded.push(added);
    }
  }
  plan.lineRemoved.push(...hunk.removed.slice(n));
  plan.lineAdded.push(...hunk.added.slice(n));
  return plan;
};

/** groups entries into runs of consecutive line numbers */
const consecutiveRuns = <T>(entries: T[], lineOf: (entry: T) => number): T[][] => {
  const runs: T[][] = [];
  for (const entry of entries) {
    const last = runs[runs.length - 1];
    if (last && lineOf(last[last.length - 1]) === lineOf(entry) - 1) {
      last.push(entry);
    } else {
      runs.push([entry]);
    }
  }
  return runs;
};

const pairOps = (
  oldText: string,
  newText: string,
  token: string,
  threshold: number,
): { oldOps: MarkerOps; newOps: MarkerOps; report: Omit<PairReport, "index"> } => {
  const oldOps = emptyOps();
  const newOps = emptyOps();
  const report: Omit<PairReport, "index"> = {
    added: 0,
    removed: 0,
    inline: 0,
    fallbacks: [],
  };

  const entries = flattenLineDiff(oldText, newText);
  for (const hunk of toHunks(entries)) {
    const plan = planHunk(hunk, token, threshold);

    for (const { removed, added } of plan.inlinePairs) {
      newOps.trailing.set(added.newLine, `  ${token} !from ${removed.line.trim()}`);
      report.inline++;
    }
    if (plan.lineRemoved.length > 0 && plan.lineAdded.length > 0) {
      report.fallbacks.push({
        newStartLine: plan.lineAdded[0].newLine,
        removed: plan.lineRemoved.length,
        added: plan.lineAdded.length,
      });
    }
    for (const run of consecutiveRuns(plan.lineRemoved, (e) => e.oldLine)) {
      const line = run[0].oldLine;
      const marker = diffMarker(indentOf(run[0].line), token, run.length, "-");
      oldOps.above.set(line, [...(oldOps.above.get(line) ?? []), marker]);
      report.removed += run.length;
    }
    for (const run of consecutiveRuns(plan.lineAdded, (e) => e.newLine)) {
      const line = run[0].newLine;
      const marker = diffMarker(indentOf(run[0].line), token, run.length, "+");
      newOps.above.set(line, [...(newOps.above.get(line) ?? []), marker]);
      report.added += run.length;
    }
  }

  return { oldOps, newOps, report };
};

const renderAnnotated = (pristineLines: string[], ops: MarkerOps): string => {
  const out: string[] = [];
  pristineLines.forEach((line, i) => {
    const lineNumber = i + 1;
    out.push(...(ops.above.get(lineNumber) ?? []));
    out.push(line + (ops.trailing.get(lineNumber) ?? ""));
  });
  return out.join("\n") + "\n";
};

// --- public API -------------------------------------------------------------

export type AnnotateOptions = {
  /** 0..1, minimum line similarity for an inline `!from` pair */
  threshold?: number;
};

/** splits into content lines; a single trailing newline is not a line */
const toLines = (text: string): string[] =>
  text.endsWith("\n") ? text.slice(0, -1).split("\n") : text.split("\n");

/**
 * Animated mode: N pristine versions in, N annotated step files out.
 * Every input must be pristine - already-annotated input throws.
 */
export const annotateSeries = (
  texts: string[],
  filename: string,
  options: AnnotateOptions = {},
): { annotated: string[]; reports: PairReport[] } => {
  if (texts.length < 2) {
    throw new Error("annotate-diff: need at least two file versions");
  }
  texts.forEach((text, i) => assertPristine(text, `${filename} (version ${i + 1})`));
  const token = lineCommentToken(filename);
  const threshold = options.threshold ?? DEFAULT_SIMILARITY_THRESHOLD;

  const perFile = texts.map(() => emptyOps());
  const reports: PairReport[] = [];
  for (let i = 0; i < texts.length - 1; i++) {
    const { oldOps, newOps, report } = pairOps(
      texts[i],
      texts[i + 1],
      token,
      threshold,
    );
    perFile[i] = mergeOps(perFile[i], oldOps);
    perFile[i + 1] = mergeOps(perFile[i + 1], newOps);
    reports.push({ index: i, ...report });
  }

  return {
    annotated: texts.map((text, i) => renderAnnotated(toLines(text), perFile[i])),
    reports,
  };
};

/**
 * Static mode: one merged diff file - the full new file with removed lines
 * inserted at their original positions (before the corresponding additions),
 * all marked. Pairing follows the same rules as animated mode.
 */
export const annotateStatic = (
  oldText: string,
  newText: string,
  filename: string,
  options: AnnotateOptions = {},
): { text: string; report: Omit<PairReport, "index"> } => {
  assertPristine(oldText, `${filename} (old)`);
  assertPristine(newText, `${filename} (new)`);
  const token = lineCommentToken(filename);
  const threshold = options.threshold ?? DEFAULT_SIMILARITY_THRESHOLD;

  const entries = flattenLineDiff(oldText, newText);
  const report: Omit<PairReport, "index"> = {
    added: 0,
    removed: 0,
    inline: 0,
    fallbacks: [],
  };

  const out: string[] = [];
  let i = 0;
  while (i < entries.length) {
    const entry = entries[i];
    if (entry.type === "same") {
      out.push(entry.line);
      i++;
      continue;
    }
    const hunk: Hunk = { removed: [], added: [] };
    while (i < entries.length && entries[i].type !== "same") {
      const e = entries[i];
      if (e.type === "remove") hunk.removed.push(e);
      else if (e.type === "add") hunk.added.push(e);
      i++;
    }
    const plan = planHunk(hunk, token, threshold);

    if (plan.lineRemoved.length > 0 && plan.lineAdded.length > 0) {
      report.fallbacks.push({
        newStartLine: plan.lineAdded[0].newLine,
        removed: plan.lineRemoved.length,
        added: plan.lineAdded.length,
      });
    }
    // git order: all removed lines of the hunk before the added lines
    for (const run of consecutiveRuns(plan.lineRemoved, (e) => e.oldLine)) {
      out.push(diffMarker(indentOf(run[0].line), token, run.length, "-"));
      out.push(...run.map((e) => e.line));
      report.removed += run.length;
    }
    // added side keeps file order: inline pairs interleave with + runs
    const paired = new Map(plan.inlinePairs.map((p) => [p.added, p.removed]));
    const runStarts = new Map(
      consecutiveRuns(plan.lineAdded, (e) => e.newLine).map((run) => [run[0], run]),
    );
    for (const added of hunk.added) {
      const removed = paired.get(added);
      if (removed) {
        out.push(`${added.line}  ${token} !from ${removed.line.trim()}`);
        report.inline++;
        continue;
      }
      const run = runStarts.get(added);
      if (run) {
        out.push(diffMarker(indentOf(run[0].line), token, run.length, "+"));
        report.added += run.length;
      }
      out.push(added.line);
    }
  }

  return { text: out.join("\n") + "\n", report };
};
