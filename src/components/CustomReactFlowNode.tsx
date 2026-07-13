import { Handle, useUpdateNodeInternals } from "@xyflow/react";
import type { RFNodeData } from "../utils/processAST";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppContext } from "../contexts/AppContext";

const CustomNode = ({ data, id, selected }: { data: RFNodeData; id: string; selected: boolean }) => {
  const { theme } = useContext(AppContext);

  const rowRefs = useRef<
    Record<string, HTMLDivElement | HTMLSpanElement | null>
  >({});
  const nodeRef = useRef<HTMLDivElement>(null);
  const [handleOffsets, setHandleOffsets] = useState<Record<string, number>>(
    {}
  );
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    if (!nodeRef.current) return;

    const updateOffsets = () => {
      const container = nodeRef.current;
      if (!container) return;

      const offsets: Record<string, number> = {};
      let changed = false;

      for (const [key, row] of Object.entries(rowRefs.current)) {
        if (!row) continue;

        // Compute local unscaled coordinates by climbing offsetParents up to the container
        let top = 0;
        let el: HTMLElement | null = row;
        while (el && el !== container) {
          top += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }

        offsets[key] = top + row.offsetHeight / 2;
      }

      setHandleOffsets((prev) => {
        if (Object.keys(prev).length !== Object.keys(offsets).length) changed = true;
        else {
          for (const k in offsets) {
            if (prev[k] !== offsets[k]) {
              changed = true;
              break;
            }
          }
        }
        if (changed) {
          // React state update triggers re-render, we notify React Flow immediately after
          setTimeout(() => updateNodeInternals(id), 0);
          return offsets;
        }
        return prev;
      });
    };

    // Use ResizeObserver to catch layout changes regardless of data changes or word wraps
    const observer = new ResizeObserver(updateOffsets);
    observer.observe(nodeRef.current);
    updateOffsets(); // Run initially

    return () => observer.disconnect();
  }, [id, updateNodeInternals, data.nodeData]);

  return (
    <div
      ref={nodeRef}
      className={`
        ${
          data.isBooleanNode
            ? "rounded-2xl text-center overflow-hidden"
            : "rounded"
        }
        relative transition-shadow duration-300 text-sm bg-[var(--node-bg-color)] text-[var(--text-color)]
        min-w-[100px] max-w-[400px] hover:shadow-[0_0_10px_var(--color)]
        ${/* Change 25: Apply visual highlighting (shadow and ring) when node is selected */ ""}
        ${selected ? "shadow-[0_0_15px_var(--color)] ring-2 ring-[var(--color)]" : ""}
      `}
      style={{
        ["--color" as string]: data.nodeStyle.color,
        border:
          theme === "dark"
            ? `1px solid ${data.nodeStyle.color}`
            : `1px solid color-mix(in srgb, ${data.nodeStyle.color} 80%, black)`,
        wordBreak: "break-word",
      }}
    >
      {data.targetHandles.map(({ handleId, position }) => (
        <Handle
          key={handleId}
          type="target"
          position={position}
          id={handleId}
        />
      ))}

      <div
        className="px-2 font-semibold"
        style={{
          background: `${data.nodeStyle.color}50`,
          borderBottom: `1px solid ${data.nodeStyle.color}`,
          color:
            theme === "dark"
              ? data.nodeStyle.color
              : `color-mix(in srgb, ${data.nodeStyle.color} 60%, black)`,
        }}
      >
        {data.nodeLabel}
      </div>

      <div className="flex flex-col">
        {Object.entries(data.nodeData).map(([key, keyData]) => {
          const isArray = Array.isArray(keyData.value);

          return (
            <div
              key={key}
              className={`${data.isBooleanNode && "text-center"} flex`}
              style={{
                border: `1px solid ${data.nodeStyle.color}40`,
                padding: "4px",
                background: data.isBooleanNode
                  ? `${data.nodeStyle.color}50`
                  : "",
              }}
            >
              <span className="font-semibold mr-2 whitespace-nowrap text-[var(--node-key-color)]">
                {!data.isBooleanNode && `${key}:`}
              </span>

              {isArray ? (
                <div className="flex-col w-full">
                  {(keyData.value as string[]).map((item, index) => (
                    <div
                      ref={(el) => {
                        rowRefs.current[`${id}-${item}`] = el;
                      }}
                      key={index}
                      className="px-2 py-[2px] bg-[var(--node-value-bg-color)]"
                      style={{ border: `1px solid ${data.nodeStyle.color}30` }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <span
                  ref={(el) => {
                    rowRefs.current[`${id}-${key}`] = el;
                  }}
                >
                  {keyData.ellipsis ?? String(keyData.value)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {data.sourceHandles.map(({ handleId, position }) => (
        <Handle
          key={handleId}
          id={handleId}
          type="source"
          position={position}
          style={{ top: handleOffsets[handleId] }}
        />
      ))}
    </div>
  );
};

export default CustomNode;
