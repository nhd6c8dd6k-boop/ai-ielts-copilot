import { z } from "zod";

const supportedVisualTypes = [
  "none",
  "bar_chart",
  "line_chart",
  "pie_chart",
  "table",
  "process_diagram",
] as const;

const adminWritingVisualSeriesSchema = z.object({
  name: z.string(),
  values: z.array(z.number()),
});

const adminWritingVisualStageSchema = z.object({
  label: z.string(),
  description: z.string(),
});

export const adminWritingGeneratedVisualDataSchema = z.object({
  type: z.enum(supportedVisualTypes),
  title: z.string(),
  description: z.string(),
  xKey: z.string(),
  unit: z.string(),
  categories: z.array(z.string()),
  series: z.array(adminWritingVisualSeriesSchema),
  table_headers: z.array(z.string()),
  table_rows: z.array(z.array(z.string())),
  stages: z.array(adminWritingVisualStageSchema),
  is_cycle: z.boolean(),
});

export const adminWritingOutputSchema = z.object({
  task_type: z.number().int().min(1).max(2),
  band_target: z.number().int().min(5).max(9),
  topic: z.string().min(1),
  prompt: z.string().min(1),
  sample_answer_band_7: z.string().min(1),
  sample_answer_band_8: z.string().min(1),
  sample_answer_band_9: z.string().min(1),
  scoring_notes: z.array(z.string()).min(1),
  visual_data: adminWritingGeneratedVisualDataSchema,
});

type AdminWritingOutput = z.infer<typeof adminWritingOutputSchema>;
type AdminWritingVisualData = z.infer<typeof adminWritingGeneratedVisualDataSchema>;

type StoredWritingVisualData =
  | {
      type: "bar_chart" | "line_chart" | "pie_chart" | "table";
      title: string;
      description: string;
      xKey: string;
      series: Array<{ key: string; label: string }>;
      data: Array<Record<string, string | number>>;
      unit: string;
    }
  | {
      type: "process_diagram";
      title: string;
      description: string;
      stages: Array<{ label: string; description: string }>;
      is_cycle: boolean;
    };

export class AdminWritingGenerationValidationError extends Error {
  safeMessage = "Writing generation returned invalid structured content.";
  code = "admin_writing_semantic_validation_failed";

  constructor(message: string) {
    super(message);
    this.name = "AdminWritingGenerationValidationError";
  }
}

export function validateAdminWritingContentPayload(data: AdminWritingOutput) {
  validateGeneratedWritingVisualData({
    taskType: data.task_type,
    visualData: data.visual_data,
  });

  return data;
}

export function normalizeAdminWritingVisualDataForStorage(
  visualData: AdminWritingVisualData,
): StoredWritingVisualData | null {
  if (visualData.type === "none") {
    return null;
  }

  if (visualData.type === "process_diagram") {
    return {
      type: "process_diagram",
      title: visualData.title,
      description: visualData.description,
      stages: visualData.stages,
      is_cycle: visualData.is_cycle,
    };
  }

  if (visualData.type === "table") {
    const [xKey, ...seriesHeaders] = visualData.table_headers;

    return {
      type: "table",
      title: visualData.title,
      description: visualData.description,
      xKey,
      unit: visualData.unit,
      series: seriesHeaders.map((header) => ({
        key: header,
        label: header,
      })),
      data: visualData.table_rows.map((row) =>
        Object.fromEntries(
          visualData.table_headers.map((header, index) => [
            header,
            parseCellValue(row[index] ?? ""),
          ]),
        ),
      ),
    };
  }

  const xKey = visualData.xKey.trim() || "category";
  const series = visualData.series.map((item) => ({
    key: item.name,
    label: item.name,
  }));

  return {
    type: visualData.type,
    title: visualData.title,
    description: visualData.description,
    xKey,
    unit: visualData.unit,
    series,
    data: visualData.categories.map((category, index) => {
      const row: Record<string, string | number> = {
        [xKey]: category,
      };

      for (const item of visualData.series) {
        row[item.name] = item.values[index] ?? 0;
      }

      return row;
    }),
  };
}

function validateGeneratedWritingVisualData({
  taskType,
  visualData,
}: {
  taskType: number;
  visualData: AdminWritingVisualData;
}) {
  if (taskType === 2) {
    if (visualData.type !== "none") {
      throw new AdminWritingGenerationValidationError(
        "Task 2 writing content must use visual_data.type = none.",
      );
    }

    validateNoneVisualData(visualData);
    return;
  }

  if (visualData.type === "none") {
    throw new AdminWritingGenerationValidationError(
      "Task 1 writing content must include visual_data.",
    );
  }

  if (isChartVisualType(visualData.type)) {
    validateChartVisualData(visualData);
    return;
  }

  if (visualData.type === "table") {
    validateTableVisualData(visualData);
    return;
  }

  validateProcessDiagramVisualData(visualData);
}

function validateNoneVisualData(visualData: AdminWritingVisualData) {
  if (
    visualData.title ||
    visualData.description ||
    visualData.xKey ||
    visualData.unit ||
    visualData.categories.length > 0 ||
    visualData.series.length > 0 ||
    visualData.table_headers.length > 0 ||
    visualData.table_rows.length > 0 ||
    visualData.stages.length > 0
  ) {
    throw new AdminWritingGenerationValidationError(
      "visual_data.type = none must use empty strings and empty arrays.",
    );
  }
}

function validateChartVisualData(visualData: AdminWritingVisualData) {
  if (visualData.categories.length === 0) {
    throw new AdminWritingGenerationValidationError(
      "Chart visual_data must include at least one category.",
    );
  }

  if (visualData.series.length === 0) {
    throw new AdminWritingGenerationValidationError(
      "Chart visual_data must include at least one series.",
    );
  }

  for (const item of visualData.series) {
    if (!item.name.trim()) {
      throw new AdminWritingGenerationValidationError(
        "Chart visual_data series names cannot be empty.",
      );
    }

    if (item.values.length !== visualData.categories.length) {
      throw new AdminWritingGenerationValidationError(
        "Chart visual_data series values must match categories length.",
      );
    }
  }
}

function validateTableVisualData(visualData: AdminWritingVisualData) {
  if (visualData.table_headers.length === 0) {
    throw new AdminWritingGenerationValidationError(
      "Table visual_data must include headers.",
    );
  }

  if (visualData.table_rows.length === 0) {
    throw new AdminWritingGenerationValidationError(
      "Table visual_data must include rows.",
    );
  }

  for (const row of visualData.table_rows) {
    if (row.length !== visualData.table_headers.length) {
      throw new AdminWritingGenerationValidationError(
        "Table visual_data row length must match headers length.",
      );
    }
  }
}

function validateProcessDiagramVisualData(visualData: AdminWritingVisualData) {
  if (visualData.stages.length < 2) {
    throw new AdminWritingGenerationValidationError(
      "Process diagram visual_data must include at least two stages.",
    );
  }

  for (const stage of visualData.stages) {
    if (!stage.label.trim() || !stage.description.trim()) {
      throw new AdminWritingGenerationValidationError(
        "Process diagram stages must include labels and descriptions.",
      );
    }
  }
}

function isChartVisualType(
  type: AdminWritingVisualData["type"],
): type is "bar_chart" | "line_chart" | "pie_chart" {
  return type === "bar_chart" || type === "line_chart" || type === "pie_chart";
}

function parseCellValue(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  const numeric = Number(normalized);

  return normalized && Number.isFinite(numeric) ? numeric : value;
}
