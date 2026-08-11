import { DIFF_COLORS, DIFF_LABELS, type DiffStatus } from "../utils/schemaDiff";

const LEGEND_STATUSES: Exclude<DiffStatus, "unchanged">[] = ["added", "removed", "modified"];

/** Small color key shown on the graph while Diff mode is active. */
const DiffLegend = () => (
  <div
    className="absolute top-11 left-3 z-10 flex flex-col gap-1 px-2 py-1.5 rounded border border-[var(--popup-border-color)] bg-[var(--node-bg-color)] opacity-90 shadow-sm"
    aria-label="Diff color legend"
  >
    <span className="text-[10px] font-semibold text-[var(--text-color)] tracking-wide uppercase">
      Diff
    </span>
    {LEGEND_STATUSES.map((status) => (
      <div key={status} className="flex items-center gap-1.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: DIFF_COLORS[status] }}
          aria-hidden
        />
        <span className="text-[10px] text-[var(--text-color)]">{DIFF_LABELS[status]}</span>
      </div>
    ))}
  </div>
);

export default DiffLegend;
