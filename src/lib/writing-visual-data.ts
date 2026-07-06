import { z } from "zod";

const visualDatumSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.null()]),
);

export const writingVisualDataSchema = z.object({
  type: z.enum(["bar_chart", "line_chart", "pie_chart", "table"]),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  xKey: z.string().min(1),
  series: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .min(1),
  data: z.array(visualDatumSchema).min(1),
  unit: z.string().optional().default(""),
});

export type StructuredWritingVisualData = z.infer<
  typeof writingVisualDataSchema
>;

export type MarkdownTableVisualData = {
  type: "markdown_table";
  label: "Table" | "Chart";
  instruction: string;
  title: string;
  columns: string[];
  rows: string[][];
  raw: string;
};

export type WritingVisualData =
  | {
      source: "structured";
      instruction: string;
      visual: StructuredWritingVisualData;
    }
  | {
      source: "markdown";
      table: MarkdownTableVisualData;
    };

export function parseWritingVisualData({
  prompt,
  taskType,
  visualData,
}: {
  prompt: string;
  taskType: number;
  visualData?: unknown;
}): WritingVisualData | null {
  if (taskType !== 1) {
    return null;
  }

  const structured = normalizeWritingVisualData(visualData);

  if (structured) {
    return {
      source: "structured",
      instruction: prompt,
      visual: structured,
    };
  }

  const table = parseTablePrompt(prompt);

  if (table) {
    return {
      source: "markdown",
      table,
    };
  }

  return null;
}

export function getWritingVisualTypeLabel({
  prompt,
  taskType,
  visualData,
}: {
  prompt: string;
  taskType: number;
  visualData?: unknown;
}) {
  const parsed = parseWritingVisualData({ prompt, taskType, visualData });

  if (!parsed) {
    return null;
  }

  if (parsed.source === "structured") {
    return getStructuredVisualLabel(parsed.visual.type);
  }

  return parsed.table.label;
}

export function normalizeWritingVisualData(
  visualData: unknown,
): StructuredWritingVisualData | null {
  if (!visualData) {
    return null;
  }

  const parsed = writingVisualDataSchema.safeParse(visualData);

  return parsed.success ? parsed.data : null;
}

export function getStructuredVisualLabel(
  type: StructuredWritingVisualData["type"],
) {
  if (type === "table") {
    return "Table";
  }

  if (type === "pie_chart") {
    return "Pie chart";
  }

  if (type === "line_chart") {
    return "Line chart";
  }

  return "Bar chart";
}

function parseTablePrompt(prompt: string): MarkdownTableVisualData | null {
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
    type: "markdown_table",
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
