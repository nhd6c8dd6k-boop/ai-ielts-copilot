export type WritingVisualData =
  {
    type: "table";
    label: "Table" | "Chart";
    instruction: string;
    title: string;
    columns: string[];
    rows: string[][];
    raw: string;
  };

export function parseWritingVisualData({
  prompt,
  taskType,
}: {
  prompt: string;
  taskType: number;
}): WritingVisualData | null {
  if (taskType !== 1) {
    return null;
  }

  const table = parseTablePrompt(prompt);

  if (table) {
    return table;
  }

  return null;
}

export function getWritingVisualTypeLabel({
  prompt,
  taskType,
}: {
  prompt: string;
  taskType: number;
}) {
  return parseWritingVisualData({ prompt, taskType })?.label ?? null;
}

function parseTablePrompt(prompt: string): WritingVisualData | null {
  const lines = prompt.split(/\r?\n/);
  const tableStart = lines.findIndex((line) => isTableLine(line));

  if (tableStart < 0) {
    return null;
  }

  let tableEnd = tableStart;

  while (tableEnd < lines.length && isTableLine(lines[tableEnd])) {
    tableEnd += 1;
  }

  const tableLines = lines
    .slice(tableStart, tableEnd)
    .filter((line) => !isMarkdownSeparatorLine(line));

  if (tableLines.length < 3) {
    return null;
  }

  const columns = splitTableLine(tableLines[0]);
  const rows = tableLines
    .slice(1)
    .map(splitTableLine)
    .filter((row) => row.length > 1);

  if (columns.length < 2 || rows.length < 2) {
    return null;
  }

  const instruction = lines
    .filter((_, index) => index < tableStart || index >= tableEnd)
    .join("\n")
    .trim();
  const raw = tableLines.join("\n");

  return {
    type: "table",
    label: inferTableLabel(prompt),
    instruction: instruction || prompt.replace(raw, "").trim() || prompt,
    title: inferTableTitle(prompt),
    columns,
    rows,
    raw,
  };
}

function isTableLine(line: string) {
  const trimmed = line.trim();

  return trimmed.includes("|") && splitTableLine(trimmed).length >= 2;
}

function isMarkdownSeparatorLine(line: string) {
  return splitTableLine(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitTableLine(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function inferTableLabel(prompt: string): "Table" | "Chart" {
  return /\b(chart|graph|bar|line|pie)\b/i.test(prompt) ? "Chart" : "Table";
}

function inferTableTitle(prompt: string) {
  const firstSentence = prompt
    .split(/\n/)
    .map((line) => line.trim())
    .find((line) => line && !isTableLine(line));

  return firstSentence ?? "Table data";
}
