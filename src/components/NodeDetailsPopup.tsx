import { BsX, BsCopy, BsCheck, BsTable, BsCode } from "react-icons/bs";
import { useContext, useState } from "react";
import { type NodeData } from "../utils/processAST";
import { AppContext } from "../contexts/AppContext";

type View = "table" | "raw";

const NodeDetailsPopup = ({
  nodeId,
  data,
  onClose,
}: {
  nodeId: string;
  data: {
    nodeData?: NodeData;
  };
  onClose: () => void;
}) => {
  const { selectedNode } = useContext(AppContext);
  const subschema = (selectedNode?.data?.subschema as string) ?? null;
  const [copiedSubschema, setCopiedSubschema] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [activeView, setActiveView] = useState<View>("table");

  const extractPath = (nodeId: string) => {
    const hashIndex = nodeId.indexOf("#");
    const fragment = hashIndex !== -1 ? nodeId.substring(hashIndex + 1) : "";
    return fragment || "/";
  };

  const copyPathToClipboard = () => {
    if (nodeId) {
      navigator.clipboard.writeText(extractPath(nodeId));
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };
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
    if (!subschema) return;

    navigator.clipboard.writeText(subschema).then(() => {
      setCopiedSubschema(true);
      setTimeout(() => setCopiedSubschema(false), 2000);
    });
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[var(--popup-backdrop-color)] backdrop-blur-sm" />
      <div
        className="relative z-50 w-[60%] max-h-[80%] rounded-lg shadow-xl bg-[var(--popup-bg-color)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--popup-border-color)] bg-[var(--popup-header-bg-color)] shrink-0">
          <div className="flex items-center gap-1 bg-[var(--popup-bg-color)] rounded p-0.5 border border-[var(--popup-border-color)]">
            <button
              id="popup-view-table"
              onClick={() => setActiveView("table")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${activeView === "table"
                ? "bg-[var(--popup-header-bg-color)] text-[var(--popup-header-text-color)] shadow-sm"
                : "text-[var(--popup-text-color)] hover:bg-[var(--popup-header-bg-color)]"
                }`}
            >
              <BsTable size={11} />
              Table
            </button>
            <button
              id="popup-view-raw"
              onClick={() => setActiveView("raw")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${activeView === "raw"
                ? "bg-[var(--popup-header-bg-color)] text-[var(--popup-header-text-color)] shadow-sm"
                : "text-[var(--popup-text-color)] hover:bg-[var(--popup-header-bg-color)]"
                }`}
            >
              <BsCode size={13} />
              Raw
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="popup-copy-subschema"
              className="flex items-center px-2 py-1 rounded bg-slate-800 text-slate-100 hover:bg-slate-900 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleCopySubschema}
              title={copiedSubschema ? "Copied!" : "Copy subschema"}
              disabled={!subschema}
            >
              {copiedSubschema ? <BsCheck size={14} /> : <BsCopy size={14} />}
            </button>
            <button
              id="popup-close"
              className="text-[var(--popup-text-color)] hover:text-[var(--popup-close-btn-hover-color)]"
              onClick={onClose}
            >
              <BsX size={24} />
            </button>
          </div>
        </div>

        <div className="overflow-auto overflow-x-auto flex-1 text-sm pt-2">
          {nodeId && (
            <div className="mx-4 mb-4 p-2 bg-[var(--popup-header-bg-color)] rounded border border-[var(--popup-border-color)] flex items-center justify-between">
              <div className="overflow-x-auto max-h-[60px] overflow-y-auto pr-1 flex-1">
                <div className="font-mono text-xs text-[var(--text-color)] whitespace-nowrap">{extractPath(nodeId)}</div>
              </div>
              <button
                onClick={copyPathToClipboard}
                className="ml-2 p-1.5 text-[var(--navigation-text-color)] hover:text-[var(--text-color)] hover:bg-[var(--validation-bg-color)] rounded transition-colors flex-shrink-0"
                title="Copy path to clipboard"
              >
                {copiedPath ? (
                  <BsCheck size={16} className="text-green-600" />
                ) : (
                  <BsCopy size={16} />
                )}
              </button>
            </div>
          )}

          {activeView === "table" && (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--popup-header-bg-color)] border-y border-[var(--popup-border-color)]">
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
                      className="border-b border-[var(--popup-border-color)] hover:bg-[var(--popup-header-bg-color)] transition-colors"
                    >
                      <td className="p-2 font-medium text-[var(--popup-text-color)] whitespace-nowrap">
                        {key}
                      </td>
                      <td className="p-2 text-[var(--popup-text-color)] min-w-0">
                        <div className="max-h-[150px] overflow-auto pr-1 break-all">
                          {formatValue(keyData.value as string)}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeView === "raw" && (
            <div className="px-4 pb-4 overflow-x-auto">
              {subschema ? (
                <pre className="text-xs font-mono text-[var(--popup-text-color)] whitespace-pre leading-relaxed">
                  {subschema}
                </pre>
              ) : (
                <p className="text-xs text-[var(--popup-text-color)] opacity-50 italic">
                  No subschema available for this node.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsPopup;