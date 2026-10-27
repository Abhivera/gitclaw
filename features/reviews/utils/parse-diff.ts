export type DiffLine = { text: string; line: number; added: boolean };

/** Parse right-side coordinates, respecting each hunk's declared line counts. */
export function parseDiff(patch: string): DiffLine[] {
  const result: DiffLine[] = [];
  let line = 0;
  let oldRemaining = 0;
  let newRemaining = 0;
  for (const raw of patch.split(/\r?\n/)) {
    const hunk = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(raw);
    if (hunk) {
      line = Number(hunk[3]);
      oldRemaining = Number(hunk[2] ?? 1);
      newRemaining = Number(hunk[4] ?? 1);
      continue;
    }
    if (raw.startsWith("\\")) continue;
    if (raw.startsWith("+") && newRemaining > 0) {
      result.push({ text: raw.slice(1), line: line++, added: true });
      newRemaining--;
    } else if (raw.startsWith("-") && oldRemaining > 0) {
      oldRemaining--;
    } else if (raw.startsWith(" ") && oldRemaining > 0 && newRemaining > 0) {
      result.push({ text: raw.slice(1), line: line++, added: false });
      oldRemaining--;
      newRemaining--;
    } else {
      oldRemaining = 0;
      newRemaining = 0;
    }
  }
  return result;
}
