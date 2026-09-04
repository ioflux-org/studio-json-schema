import type { OpenFrame } from "./traceStack";

const statusStyle: Record<OpenFrame["status"], string> = {
  push: "border-[var(--toolbar-border-color)] bg-[var(--bg-color)] text-[var(--text-color)]",
  pass: "border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_18%,transparent)] text-[var(--color-success)]",
  fail: "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const StackVisualizer = ({ frames }: { frames: OpenFrame[] }) => (
  <div
    className="relative flex-1 min-h-0 flex flex-col-reverse items-center justify-start gap-0 py-8 overflow-hidden"
    style={{ perspective: "900px" }}
  >
    {frames.length === 0 && (
      <span className="text-xs text-[var(--text-secondary-color)]">
        Stack is empty — step forward to begin
      </span>
    )}
    {frames.map((frame, depth) => {
      const distanceFromTop = frames.length - 1 - depth;
      return (
        <div
          key={frame.pushIndex}
          className={`w-[min(90%,26rem)] shrink-0 rounded-md border px-3 py-2 text-xs font-mono shadow-[var(--shadow-md)] transition-all duration-300 ease-out ${statusStyle[frame.status]}`}
          style={{
            transform: `translateZ(${-distanceFromTop * 34}px) translateY(${-distanceFromTop * 10}px) scale(${Math.max(1 - distanceFromTop * 0.035, 0.7)})`,
            opacity: Math.max(1 - distanceFromTop * 0.08, 0.35),
            marginTop: depth === 0 ? 0 : -28,
            zIndex: depth + 1,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="uppercase text-[10px] tracking-wide opacity-70">
              {frame.status}
            </span>
            <span className="text-[10px] opacity-50">#{frame.pushIndex + 1}</span>
          </div>
          <div className="truncate font-semibold">{frame.name || "(root)"}</div>
          <div className="truncate opacity-70">{frame.evaluatePath || "/"}</div>
        </div>
      );
    })}
  </div>
);

export default StackVisualizer;
