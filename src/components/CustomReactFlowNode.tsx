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
            : "rounded-lg"
        }
        relative transition-all duration-300 text-sm bg-[var(--node-bg-color)] text-[var(--text-color)]
        min-w-[100px] max-w-[400px]
        ${
          selected
            ? "shadow-[0_0_20px_var(--color)] ring-1 ring-[var(--color)]"
            : "hover:shadow-[0_0_14px_var(--color)]"
        }
      `}
      style={{
        ["--color" as string]: color,
        border: theme === "dark"
          ? `2px solid ${color}aa`
          : `2px solid ${color}`,
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
        className={`px-3 py-1.5 font-semibold text-sm tracking-wide ${data.isBooleanNode ? "" : "rounded-t-lg"}`}
        style={{
          background: theme === "dark" ? `${color}55` : `${color}50`,
          borderBottom: theme === "dark" ? `1px solid ${color}80` : `1px solid ${color}`,
          color:
            theme === "dark"
              ? "#fff"
              : `color-mix(in srgb, ${color} 40%, black)`,
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
                borderBottom: `1px solid ${data.nodeStyle.color}35`,
                padding: "5px 8px",
                background: data.isBooleanNode
                  ? `${data.nodeStyle.color}38`
                  : "",
              }}
            >
              <span className="font-medium mr-2 whitespace-nowrap text-[var(--node-key-color)] text-xs">
                {!data.isBooleanNode && `${key}:`}
              </span>

              {isTypeColorMap ? (
                <div className="flex-col w-full gap-1 flex py-0.5">
                  {Object.entries(keyData.value as Record<string, string>).map(
                    ([typeName, itemColor]) => (
                      <div
                        ref={(el) => {
                          rowRefs.current[`${id}-${typeName}`] = el;
                        }}
                        key={typeName}
                        className="px-2 py-[3px] rounded-md text-center text-xs font-medium"
                        style={{
                          border: `1px solid ${itemColor}99`,
                          backgroundColor: theme === "dark" ? `${itemColor}30` : `${itemColor}28`,
                          color:
                            theme === "dark"
                              ? itemColor
                              : `color-mix(in srgb, ${itemColor} 90%, black)`,
                        }}
                      >
                        {typeName}
                      </div>
                    )
                  )}
                </div>
              ) : isArray ? (
                <div className="flex-col w-full gap-1 flex py-0.5">
                  {(keyData.value as string[]).map((item, index) => (
                    <div
                      ref={(el) => {
                        rowRefs.current[`${id}-${item}`] = el;
                      }}
                      key={index}
                      className="px-2 py-[3px] bg-[var(--node-value-bg-color)] rounded text-xs"
                      style={{ border: `1px solid ${color}50` }}
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
                  className="text-xs"
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
