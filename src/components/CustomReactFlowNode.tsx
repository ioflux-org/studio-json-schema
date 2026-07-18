import { Handle, useUpdateNodeInternals } from "@xyflow/react";
import type { RFNodeData } from "../utils/processAST";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppContext } from "../contexts/AppContext";

const CustomNode = ({
  data,
  id,
  selected,
}: {
  data: RFNodeData;
  id: string;
  selected: boolean;
}) => {
  const { theme } = useContext(AppContext);

  const rowRefs = useRef<
    Record<string, HTMLDivElement | HTMLSpanElement | null>
  >({});
  const [handleOffsets, setHandleOffsets] = useState<Record<string, number>>(
    {}
  );

  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [handleOffsets, id, updateNodeInternals]);

  useLayoutEffect(() => {
    const offsets: Record<string, number> = {};

    for (const [key, row] of Object.entries(rowRefs.current)) {
      if (!row) continue;
      offsets[key] = row.offsetTop + row.offsetHeight / 2;
    }

    setHandleOffsets(offsets);
  }, [data.nodeData]);

  const { color } = data.nodeStyle;

  return (
    <div
      className={`
        ${
          data.isBooleanNode
            ? "rounded-2xl text-center overflow-hidden"
            : "rounded"
        }
        relative transition-shadow duration-300 text-sm bg-[var(--node-bg-color)] text-[var(--text-color)]
        min-w-[100px] max-w-[400px] hover:shadow-[0_0_10px_var(--color)]
        ${
          selected
            ? "shadow-[0_0_15px_var(--color)] ring-2 ring-[var(--color)]"
            : ""
        }
      `}
      style={{
        ["--color" as string]: color,
        border:
          theme === "dark"
            ? `1px solid ${color}`
            : `1px solid color-mix(in srgb, ${color} 80%, black)`,
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
          background: `${color}50`,
          borderBottom: `1px solid ${color}`,
          color:
            theme === "dark"
              ? color
              : `color-mix(in srgb, ${color} 60%, black)`,
        }}
      >
        {data.nodeLabel}
      </div>

      <div className="flex flex-col">
        {Object.entries(data.nodeData).map(([key, keyData]) => {
          const isTypeColorMap =
            key === "type" &&
            typeof keyData.value === "object" &&
            keyData.value !== null &&
            !Array.isArray(keyData.value);
          const isArray = !isTypeColorMap && Array.isArray(keyData.value);

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

              {isTypeColorMap ? (
                <div className="flex-col w-full gap-1 flex py-1">
                  {Object.entries(keyData.value as Record<string, string>).map(
                    ([typeName, itemColor]) => (
                      <div
                        ref={(el) => {
                          rowRefs.current[`${id}-${typeName}`] = el;
                        }}
                        key={typeName}
                        className="px-2 py-[2px] rounded text-center font-medium shadow-sm"
                        style={{
                          border: `1px solid ${itemColor}`,
                          backgroundColor: `${itemColor}33`,
                          color:
                            theme === "dark"
                              ? itemColor
                              : `color-mix(in srgb, ${itemColor} 60%, black)`,
                        }}
                      >
                        {typeName}
                      </div>
                    )
                  )}
                </div>
              ) : isArray ? (
                <div className="flex-col w-full gap-1 flex py-1">
                  {(keyData.value as string[]).map((item, index) => (
                    <div
                      ref={(el) => {
                        rowRefs.current[`${id}-${item}`] = el;
                      }}
                      key={index}
                      className="px-2 py-[2px] bg-[var(--node-value-bg-color)]"
                      style={{ border: `1px solid ${color}30` }}
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
