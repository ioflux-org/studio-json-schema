import { Handle, NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import type { GraphNode } from "../utils/processAST";
import { useContext, useLayoutEffect, useRef, useState } from "react";
import { AppContext } from "../contexts/AppContext";

const CustomNode = ({ data, id, selected }: NodeProps<GraphNode>) => {
  const { theme } = useContext(AppContext);

  const rowRefs = useRef<
    Record<string, HTMLDivElement | HTMLSpanElement | null>
  >({});
  const [handleOffsets, setHandleOffsets] = useState<Record<string, number>>(
    {}
  );

  useLayoutEffect(() => {
    const container = Object.values(rowRefs.current)[0]?.offsetParent;
    if (!(container instanceof HTMLElement)) return;

    const containerRect = container.getBoundingClientRect();
    const offsets: Record<string, number> = {};

    for (const [key, row] of Object.entries(rowRefs.current)) {
      if (!row) continue;

      const rect = row.getBoundingClientRect();
      offsets[key] = rect.top + rect.height / 2 - containerRect.top;
    }

    setHandleOffsets(offsets);
  }, [data.nodeData]);

  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Right}
        offset={20}
        align="start"
      >
        <div
          className="p-3 rounded-lg shadow-2xl border text-sm max-w-[300px] overflow-auto max-h-[400px]"
          style={{
            backgroundColor: 'var(--node-bg-color)',
            color: 'var(--text-color)',
            borderColor: data.nodeStyle.color || '#555',
            zIndex: 1000
          }}
        >
          <div className="font-bold mb-2 border-b pb-1" style={{ borderColor: data.nodeStyle.color || '#555' }}>
            Node Details
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(data.nodeData).map(([key, keyData]) => (
              <div key={key} className="flex flex-col">
                <span className="font-semibold opacity-80 decoration-dotted underline" title={key}>{key}:</span>
                <div className="pl-2 break-all font-mono text-xs opacity-90">
                  {Array.isArray(keyData.value)
                    ? keyData.value.map((v, i) => <div key={i}>{String(v)}</div>)
                    : String(keyData.value)
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </NodeToolbar>

      <div
        className={`
          ${data.isBooleanNode
            ? "rounded-2xl text-center overflow-hidden"
            : "rounded"
          }
          relative transition-shadow duration-300 text-sm bg-[var(--node-bg-color)] text-[var(--text-color)]
          min-w-[100px] max-w-[400px] hover:shadow-[0_0_10px_var(--color)]
        `}
        style={{
          ["--color" as string]: data.nodeStyle.color,
          border:
            theme === "dark"
              ? `1px solid ${data.nodeStyle.color}`
              : `1px solid color-mix(in srgb, ${data.nodeStyle.color} 80%, black)`,
          wordBreak: "break-word",
          boxShadow: selected ? `0 0 15px ${data.nodeStyle.color}` : undefined
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
    </>
  );
};

export default CustomNode;
