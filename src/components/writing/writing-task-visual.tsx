"use client";

import { ArrowDown, ArrowRight, RotateCcw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useI18n } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import {
  getStructuredVisualLabel,
  parseWritingVisualData,
  type MarkdownTableVisualData,
  type StructuredWritingVisualData,
} from "@/lib/writing-visual-data";

type WritingTaskVisualProps = {
  prompt: string;
  taskType: number;
  visualData?: unknown;
};

type ChartWritingVisualData = Exclude<
  StructuredWritingVisualData,
  { type: "process_diagram" }
>;

const chartColors = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#dc2626",
  "#ca8a04",
  "#0891b2",
];

export function WritingTaskVisual({
  prompt,
  taskType,
  visualData,
}: WritingTaskVisualProps) {
  const parsed = parseWritingVisualData({ prompt, taskType, visualData });

  if (!parsed) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        {prompt}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 overflow-hidden">
      <section className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <Badge className="bg-white">Task instruction</Badge>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {parsed.source === "structured"
            ? parsed.instruction
            : parsed.table.instruction}
        </div>
      </section>

      {parsed.source === "structured" ? (
        <StructuredVisual visual={parsed.visual} />
      ) : (
        <MarkdownTableVisual table={parsed.table} />
      )}
    </div>
  );
}

function StructuredVisual({ visual }: { visual: StructuredWritingVisualData }) {
  const { t } = useI18n();
  const label = getStructuredVisualLabel(visual.type);

  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <Badge className="bg-teal-50 text-teal-800">
          {visual.type === "process_diagram"
            ? t("writing.visual.processDiagram", label)
            : label}
        </Badge>
        <span className="text-xs font-medium text-slate-500">
          {t("writing.visual.information", "Visual information")}
        </span>
      </div>
      <div className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h3 className="font-medium text-slate-950">{visual.title}</h3>
          {visual.description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {visual.description}
            </p>
          ) : null}
          {"unit" in visual && visual.unit ? (
            <p className="mt-1 text-xs font-medium text-slate-500">
              {t("writing.visual.unit", "Unit")}: {visual.unit}
            </p>
          ) : null}
        </div>
        {visual.type === "process_diagram" ? (
          <ProcessDiagram visual={visual} />
        ) : visual.type === "table" ? (
          <StructuredTable visual={visual} />
        ) : (
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(visual)}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

function ProcessDiagram({
  visual,
}: {
  visual: Extract<StructuredWritingVisualData, { type: "process_diagram" }>;
}) {
  const { t } = useI18n();

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {visual.stages.map((stage, index) => {
          const isLast = index === visual.stages.length - 1;

          return (
            <div key={`${stage.label}-${index}`} className="min-w-0">
              <div className="flex min-w-0 items-stretch gap-3 md:block">
                <div className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <h4 className="min-w-0 text-sm font-semibold text-slate-950">
                      {stage.label}
                    </h4>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {stage.description}
                  </p>
                </div>

                {!isLast ? (
                  <>
                    <div
                      className="hidden justify-center py-3 text-slate-400 md:flex"
                      aria-hidden="true"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </div>
                    <div
                      className="flex items-center py-1 text-slate-400 md:hidden"
                      aria-hidden="true"
                    >
                      <ArrowDown className="h-5 w-5" />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {visual.is_cycle ? (
        <div className="flex items-center gap-2 rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t("writing.visual.cycleContinues", "Cycle continues")}
        </div>
      ) : null}
    </div>
  );
}

function renderChart(visual: ChartWritingVisualData) {
  if (visual.type === "line_chart") {
    return (
      <LineChart data={visual.data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={visual.xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {visual.series.map((series, index) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            name={series.label}
            stroke={chartColors[index % chartColors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    );
  }

  if (visual.type === "pie_chart") {
    const seriesKey = visual.series[0]?.key;

    return (
      <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <Tooltip />
        <Legend />
        <Pie
          data={visual.data}
          dataKey={seriesKey}
          nameKey={visual.xKey}
          innerRadius="45%"
          outerRadius="72%"
          paddingAngle={2}
        >
          {visual.data.map((item, index) => (
            <Cell
              key={`${String(item[visual.xKey])}-${index}`}
              fill={chartColors[index % chartColors.length]}
            />
          ))}
        </Pie>
      </PieChart>
    );
  }

  return (
    <BarChart data={visual.data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey={visual.xKey} tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip />
      <Legend />
      {visual.series.map((series, index) => (
        <Bar
          key={series.key}
          dataKey={series.key}
          name={series.label}
          fill={chartColors[index % chartColors.length]}
          radius={[4, 4, 0, 0]}
        />
      ))}
    </BarChart>
  );
}

function StructuredTable({ visual }: { visual: ChartWritingVisualData }) {
  const columns = [visual.xKey, ...visual.series.map((series) => series.key)];
  const labels = [
    visual.xKey,
    ...visual.series.map((series) => series.label),
  ];

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-[640px] border-collapse text-sm sm:min-w-full">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {labels.map((label, index) => (
              <th
                key={`${label}-${index}`}
                scope="col"
                className={
                  index === 0
                    ? "border-b border-slate-200 px-4 py-3 text-left font-semibold"
                    : "border-b border-slate-200 px-4 py-3 text-right font-semibold"
                }
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visual.data.map((row, rowIndex) => (
            <tr key={`${String(row[visual.xKey])}-${rowIndex}`}>
              {columns.map((column, columnIndex) => (
                <td
                  key={`${column}-${columnIndex}`}
                  className={
                    columnIndex === 0
                      ? "border-b border-slate-100 px-4 py-3 text-left font-medium text-slate-900 last:border-b-0"
                      : "border-b border-slate-100 px-4 py-3 text-right tabular-nums text-slate-700 last:border-b-0"
                  }
                >
                  {formatValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownTableVisual({ table }: { table: MarkdownTableVisualData }) {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <Badge className="bg-teal-50 text-teal-800">{table.label}</Badge>
        <span className="text-xs font-medium text-slate-500">
          {table.label === "Chart" ? "Chart data" : "Table data"}
        </span>
      </div>

      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-[640px] border-collapse text-sm sm:min-w-full">
          <caption className="caption-top border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-medium text-slate-950">
            {table.title}
          </caption>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {table.columns.map((column, columnIndex) => (
                <th
                  key={column}
                  scope="col"
                  className={
                    columnIndex === 0
                      ? "border-b border-slate-200 px-4 py-3 text-left font-semibold"
                      : "border-b border-slate-200 px-4 py-3 text-right font-semibold"
                  }
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${row.join("-")}-${rowIndex}`}>
                {table.columns.map((column, columnIndex) => (
                  <td
                    key={`${column}-${columnIndex}`}
                    className={
                      columnIndex === 0
                        ? "border-b border-slate-100 px-4 py-3 text-left font-medium text-slate-900 last:border-b-0"
                        : "border-b border-slate-100 px-4 py-3 text-right tabular-nums text-slate-700 last:border-b-0"
                    }
                  >
                    {row[columnIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }

  return value ?? "";
}
