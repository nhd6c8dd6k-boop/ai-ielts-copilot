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
            {visualData.label === "Chart" ? "Chart data" : "Table data"}
          </span>
        </div>

        <div className="max-w-full overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-[640px] border-collapse text-sm sm:min-w-full">
            <caption className="caption-top border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-medium text-slate-950">
              {visualData.title}
            </caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {visualData.columns.map((column, columnIndex) => (
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
              {visualData.rows.map((row, rowIndex) => (
                <tr key={`${row.join("-")}-${rowIndex}`}>
                  {visualData.columns.map((column, columnIndex) => (
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
    </div>
  );
}
