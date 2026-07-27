/**
 * Diff-view generator: pristine file versions in, annotated step files out.
 * The output is exactly what an author would write by hand - review it in
 * git diff, tweak where the auto-pairing guessed wrong, commit.
 *
 * Usage:
 *   npx tsx scripts/annotate-diff.mts --out public/<episode>/code/ v1.ts v2.ts [v3.ts ...]
 *   npx tsx scripts/annotate-diff.mts --static --out public/<episode>/code/ v1.ts v2.ts
 *
 * Animated mode (default) writes one annotated file per input, same
 * basename: removals marked `!diff -` in the old file, additions `!diff +`
 * and similar modified pairs `!from <old line>` in the new file. Middle
 * files of a chain accumulate markers from both transitions.
 *
 * Static mode (--static) writes one merged diff file per transition named
 * after the version it produces (v2.ts + v3.ts -> v3.diff.ts): the full new
 * file with removed lines inserted at their original positions, all marked.
 * Drop it into `steps` for a "review this change" beat.
 *
 * Options:
 *   --out <dir>        output directory (required); never overwrites unless --force
 *   --static           emit merged diff files instead of per-version step files
 *   --threshold <0..1> minimum line similarity for an inline !from pair (0.5)
 *   --force            allow overwriting existing output files
 */
import fs from "node:fs";
import path from "node:path";
import {
  annotateSeries,
  annotateStatic,
  DEFAULT_SIMILARITY_THRESHOLD,
  type PairReport,
} from "../src/calculate-metadata/annotate-diff";

const args = process.argv.slice(2);
const argOf = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const hasFlag = (name: string) => args.includes(`--${name}`);
const positional = args.filter((a, i) => {
  if (a.startsWith("--")) return false;
  const prev = args[i - 1];
  return prev !== "--out" && prev !== "--threshold";
});

const outDir = argOf("out");
const threshold = Number(argOf("threshold") ?? DEFAULT_SIMILARITY_THRESHOLD);
if (!outDir || positional.length < 2 || Number.isNaN(threshold)) {
  throw new Error(
    "usage: npx tsx scripts/annotate-diff.mts [--static] [--force] [--threshold 0.5] --out <dir> <v1> <v2> [v3 ...]",
  );
}

const reportLine = (label: string, report: Omit<PairReport, "index">) => {
  const parts = [
    `${report.added} added`,
    `${report.removed} removed`,
    `${report.inline} inline`,
  ];
  const fallbacks = report.fallbacks
    .map((f) => `line ${f.newStartLine} (${f.removed}->${f.added})`)
    .join(", ");
  return `${label}: ${parts.join(", ")}${fallbacks ? ` - line-level fallback at ${fallbacks}` : ""}`;
};

const writeOutput = (dir: string, name: string, content: string) => {
  const target = path.join(dir, name);
  if (fs.existsSync(target) && !hasFlag("force")) {
    throw new Error(`annotate-diff: ${target} exists - pass --force to overwrite`);
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(target, content);
  console.log(`wrote ${target}`);
};

const texts = positional.map((file) => fs.readFileSync(file, "utf8"));
const names = positional.map((file) => path.basename(file));

if (hasFlag("static")) {
  for (let i = 0; i < texts.length - 1; i++) {
    const ext = names[i + 1].split(".").pop()!;
    const base = names[i + 1].slice(0, -(ext.length + 1));
    const outName = `${base}.diff.${ext}`;
    const { text, report } = annotateStatic(texts[i], texts[i + 1], outName, {
      threshold,
    });
    writeOutput(outDir, outName, text);
    console.log(reportLine(`${names[i]} -> ${names[i + 1]}`, report));
  }
} else {
  const filenames = new Set(names);
  if (filenames.size !== names.length) {
    throw new Error("annotate-diff: inputs must have distinct basenames");
  }
  const extensions = new Set(names.map((n) => n.split(".").pop()));
  if (extensions.size !== 1) {
    throw new Error("annotate-diff: all inputs must share one extension (they are versions of the same file)");
  }
  // all inputs must share one language - outputs are steps of the same file
  const { annotated, reports } = annotateSeries(texts, names[0], { threshold });
  annotated.forEach((text, i) => writeOutput(outDir, names[i], text));
  reports.forEach((report, i) =>
    console.log(reportLine(`${names[i]} -> ${names[i + 1]}`, report)),
  );
}
