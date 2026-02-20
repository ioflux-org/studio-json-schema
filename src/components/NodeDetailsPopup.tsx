import { BsX, BsCopy, BsCheck } from "react-icons/bs";
import { type NodeData } from "../utils/processAST";
import { useState } from "react";

const NodeDetailsPopup = ({
  id,
  data,
  onClose,
}: {
  id: string;
  data: {
    nodeData?: NodeData;
  };
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const formatValue = (value: string | string[]) => {
    return (
      <div className="flex flex-col">
        {Array.isArray(value) ? (
          value.map((item, index) => <div key={index}>{String(item)}</div>)
        ) : (
          <div>{String(value)}</div>
        )}
      </div>
    );
  };

  const handleCopySubschema = () => {
    try {
      const rawSchema = window.sessionStorage.getItem("ioflux.schema.editor.content");
      if (!rawSchema) throw new Error();

      const rootSchema: unknown = JSON.parse(rawSchema);

      const uriParts = id.split("#");
      const pointer = uriParts.length > 1 ? uriParts[1] : "";

      const path = pointer.split("/").filter((segment) => segment !== "").map((segment) => {

          const decoded = decodeURIComponent(segment).replace(/~1/g, "/").replace(/~0/g, "~");

          return /^\d+$/.test(decoded) ? parseInt(decoded, 10) : decoded;
        });

      let subschema: unknown = rootSchema;

      for (const segment of path) {
        if (
          subschema && typeof subschema === "object" && segment in (subschema as Record<string, unknown>)
        ) {
          subschema = (subschema as Record<string, unknown>)[segment];
        } else {
          subschema = undefined;
          break;
        }
      }

      if (subschema === undefined) {
        const schemaObject: Record<string, unknown> = {};

        if (data.nodeData) {
          for (const [key, keyData] of Object.entries(data.nodeData)) {
            schemaObject[key] = keyData.value;
          }
        }

        subschema = data.nodeData?.["booleanSchema"]
          ? data.nodeData["booleanSchema"].value
          : schemaObject;
      }

      const keyName =
        path.length > 0 && typeof path[path.length - 1] === "string" ? path[path.length - 1] : null;

      const finalOutput =
        keyName && typeof subschema !== "undefined" ? { [keyName]: subschema } : subschema;

      navigator.clipboard.writeText(JSON.stringify(finalOutput, null, 2)).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    } catch {
      return;
    }
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[var(--popup-backdrop-color)] backdrop-blur-sm" />
      <div
        className="relative z-50 w-[60%] max-h-[80%] p-4 rounded-lg shadow-xl bg-[var(--popup-bg-color)] overflow-x-hidden overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute z-50 top-2 right-2 flex items-center gap-2">
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-slate-800 text-slate-100 hover:bg-slate-900 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 transition-all shadow-sm"
            onClick={handleCopySubschema}
            title="Copy subschema to clipboard"
          >
            {copied ? <BsCheck size={14} /> : <BsCopy size={14} />}
            {copied ? "Copied!" : "Copy Subschema"}
          </button>
          <button
            className="text-[var(--popup-text-color)] hover:text-[var(--popup-close-btn-hover-color)]"
            onClick={onClose}
          >
            <BsX size={24} />
          </button>
        </div>

        <div className="relative pt-8 text-sm">
          <table className="w-full border border-[var(--popup-border-color)] text-left">
            <thead>
              <tr className="bg-[var(--popup-header-bg-color)] border-b border-[var(--popup-border-color)]">
                <th className="p-2 font-bold text-[var(--popup-header-text-color)] w-1/3">
                  Keyword
                </th>
                <th className="p-2 font-bold text-[var(--popup-header-text-color)]">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {data.nodeData &&
                Object.entries(data.nodeData).map(([key, keyData]) => (
                  <tr
                    key={key}
                    className="border-b border-[var(--popup-border-color)]"
                  >
                    <td className="p-2 font-medium text-[var(--popup-text-color)] whitespace-nowrap">
                      {key}
                    </td>
                    <td className="p-2 text-[var(--popup-text-color)]">
                      <div className="max-h-[150px] overflow-auto pr-1">
                        {formatValue(keyData.value as string)}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsPopup;