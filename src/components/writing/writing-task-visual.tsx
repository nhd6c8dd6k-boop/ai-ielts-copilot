"use client";

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
  const label = getStructuredVisualLabel(visual.type);

  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <Badge className="bg-teal-50 text-teal-800">{label}</Badge>
        <span className="text-xs font-medium text-slate-500">
          Visual information
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
          {visual.unit ? (
            <p className="mt-1 text-xs font-medium text-slate-500">
              Unit: {visual.unit}
            </p>
          ) : null}
        </div>
        {visual.type === "table" ? (
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

function renderChart(visual: StructuredWritingVisualData) {
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

function StructuredTable({ visual }: { visual: StructuredWritingVisualData }) {
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
