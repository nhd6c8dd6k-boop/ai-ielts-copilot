import { Badge } from "@/components/ui/badge";
import { parseWritingVisualData } from "@/lib/writing-visual-data";

type WritingTaskVisualProps = {
  prompt: string;
  taskType: number;
};

export function WritingTaskVisual({ prompt, taskType }: WritingTaskVisualProps) {
  const visualData = parseWritingVisualData({ prompt, taskType });

  if (!visualData) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        {prompt}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Badge className="bg-white">Task instruction</Badge>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {visualData.instruction}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Badge className="bg-teal-50 text-teal-800">
            {visualData.label}
          </Badge>
          <span className="text-xs font-medium text-slate-500">
            Visual information
          </span>
        </div>

        {visualData.type === "table" ? (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="min-w-full border-collapse text-left text-sm">
              <caption className="caption-top border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-medium text-slate-950">
                {visualData.title}
              </caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {visualData.columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="border-b border-slate-200 px-4 py-3 font-semibold"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visualData.rows.map((row, rowIndex) => (
                  <tr key={`${row.join("-")}-${rowIndex}`}>
                    {visualData.columns.map((column, columnIndex) => (
                      <td
                        key={`${column}-${columnIndex}`}
                        className="border-b border-slate-100 px-4 py-3 text-slate-700 last:border-b-0"
                      >
                        {row[columnIndex] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : visualData.type === "process" ? (
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-950">
              {visualData.title}
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {splitProcessSteps(visualData.body).map((step, index) => (
                <li key={`${step.slice(0, 24)}-${index}`} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-medium text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-950">
              {visualData.title}
            </p>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {visualData.body}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function splitProcessSteps(value: string) {
  const lineSteps = value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[\).]|[-*])\s*/, "").trim())
    .filter(Boolean);

  if (lineSteps.length > 1) {
    return lineSteps;
  }

  return value
    .split(/\s*(?:→|->|;|\bthen\b|\bnext\b|\bfinally\b)\s*/i)
    .map((step) => step.trim())
    .filter(Boolean);
}
