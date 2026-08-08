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
  const { theme, updateSchemaAtPath } = useContext(AppContext);

  const rowRefs = useRef<
    Record<string, HTMLDivElement | HTMLSpanElement | null>
  >({});
  const [handleOffsets, setHandleOffsets] = useState<Record<string, number>>(
    {}
  );

  const [editingField, setEditingField] = useState<{
    type: "key" | "value";
    rowKey: string;
    item?: string;
    index?: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

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

  const getPathFromNodeId = (nodeId: string): (string | number)[] => {
    const uriParts = nodeId.split("#");
    const fragment = uriParts.length > 1 ? uriParts[1] : "";
    return fragment
      .split("/")
      .filter((segment) => segment !== "")
      .map((segment) => {
        const decoded = decodeURIComponent(segment);
        return /^\d+$/.test(decoded) ? parseInt(decoded, 10) : decoded;
      });
  };

  const parseInputValue = (val: string) => {
    if (val === "true") return true;
    if (val === "false") return false;
    if (val === "null") return null;
    if (!isNaN(Number(val)) && val.trim() !== "") return Number(val);
    if (val.startsWith('"') && val.endsWith('"')) {
      return val.slice(1, -1);
    }
    return val;
  };

  const handleStartEdit = (type: "key" | "value", rowKey: string, currentVal: string, item?: string, index?: number) => {
    setEditingField({ type, rowKey, item, index });
    setEditValue(currentVal);
  };

  const handleSaveEdit = () => {
    if (!editingField) return;
    const basePath = getPathFromNodeId(id);
    const parsedVal = parseInputValue(editValue);

    if (editingField.rowKey === "properties" && editingField.item) {
      const fullPath = [...basePath, "properties", editingField.item];
      updateSchemaAtPath(fullPath, parsedVal, true);
    } else if (editingField.rowKey === "required" && editingField.index !== undefined) {
      const fullPath = [...basePath, "required", editingField.index];
      updateSchemaAtPath(fullPath, parsedVal, false);
    } else {
      const fullPath = [...basePath, editingField.rowKey];
      updateSchemaAtPath(fullPath, parsedVal, false);
    }
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingField(null);
    }
  };

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

      <div 
        className="flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
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
              className={`${data.isBooleanNode && "text-center"} flex items-center justify-between`}
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
                   {(keyData.value as string[]).map((item, index) => {
                    const isEditableArray = key === "properties" || key === "required";
                    const isEditingThis =
                      isEditableArray &&
                      editingField?.rowKey === key &&
                      editingField?.index === index;

                    return isEditingThis ? (
                      <input
                        key={index}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        className="px-1 py-[2px] text-xs bg-[var(--node-value-bg-color)] border border-blue-500 rounded text-foreground w-full focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <div
                        ref={(el) => {
                          rowRefs.current[`${id}-${item}`] = el;
                        }}
                        key={index}
                        onDoubleClick={() => {
                          if (isEditableArray) {
                            handleStartEdit(key === "properties" ? "key" : "value", key, item, item, index);
                          }
                        }}
                        className={`px-2 py-[2px] bg-[var(--node-value-bg-color)] ${isEditableArray ? "cursor-text select-text" : ""}`}
                        style={{ border: `1px solid ${color}30` }}
                        title={isEditableArray ? "Double click to edit" : undefined}
                      >
                        {item}
                      </div>
                    );
                  })}
                </div>
              ) : (
                (() => {
                  const isEditingThis =
                    editingField?.rowKey === key &&
                    editingField?.type === "value";
                  const currentStr = String(keyData.value);

                  return isEditingThis ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      className="px-1 py-[2px] text-xs bg-[var(--node-value-bg-color)] border border-blue-500 rounded text-foreground w-full focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      ref={(el) => {
                        rowRefs.current[`${id}-${key}`] = el;
                      }}
                      onDoubleClick={() => handleStartEdit("value", key, currentStr)}
                      className="cursor-text select-text"
                      title="Double click to edit value"
                    >
                      {keyData.ellipsis ?? currentStr}
                    </span>
                  );
                })()
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
