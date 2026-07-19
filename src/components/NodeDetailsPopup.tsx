import { BsX, BsCopy, BsCheck } from "react-icons/bs";
import { useState } from "react";
import { type NodeData } from "../utils/processAST";

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
  const [copied, setCopied] = useState(false);

  const extractPath = (nodeId: string) => {
    const hashIndex = nodeId.indexOf("#");
    const fragment = hashIndex !== -1 ? nodeId.substring(hashIndex + 1) : "";
    return fragment || "/";
  };

  const copyPathToClipboard = () => {
    if (nodeId) {
      navigator.clipboard.writeText(extractPath(nodeId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-lg" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="node-details-title"
        className="relative z-50 w-[90%] sm:w-[50%] min-w-[320px] max-h-[80%] p-6 rounded-2xl border border-[var(--accent-color)]/20 bg-[var(--popup-bg-color)] overflow-x-hidden overflow-auto ring-1 ring-[var(--accent-color)]/10"
        style={{ boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.4), 0 0 40px -8px var(--accent-color, rgba(99, 102, 241, 0.15))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="node-details-title" className="sr-only">
          Node Details
        </h2>

        <button
          aria-label="Close node details"
          className="absolute z-50 top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary-color)] hover:text-[var(--text-color)] hover:bg-[var(--view-bg-color)] border border-transparent hover:border-[var(--toolbar-border-color)] transition-all"
          onClick={onClose}
        >
          <BsX size={18} />
        </button>

        <div className="relative pt-6 text-sm">
          {nodeId && (
            <div className="mb-4 p-2.5 bg-[var(--popup-header-bg-color)] rounded-lg border border-[var(--popup-border-color)] flex items-center justify-between">
              <div className="overflow-x-auto max-h-[60px] overflow-y-auto pr-1 flex-1">
                <div className="font-mono text-xs text-[var(--text-color)] whitespace-nowrap">
                  {extractPath(nodeId)}
                </div>
              </div>

              <button
                onClick={copyPathToClipboard}
                className="ml-2 p-1.5 text-[var(--text-secondary-color)] hover:text-[var(--text-color)] hover:bg-[var(--view-bg-color)] rounded-md transition-colors flex-shrink-0"
                title="Copy path to clipboard"
                aria-label="Copy path to clipboard"
              >
                {copied ? (
                  <BsCheck size={16} className="text-green-500" />
                ) : (
                  <BsCopy size={14} />
                )}
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-[var(--popup-border-color)] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--popup-header-bg-color)] border-b border-[var(--popup-border-color)]">
                  <th className="p-3 font-semibold text-[11px] uppercase tracking-widest text-[var(--accent-color)] w-1/3">
                    Keyword
                  </th>
                  <th className="p-3 font-semibold text-[11px] uppercase tracking-widest text-[var(--accent-color)]">
                    Value
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.nodeData &&
                  Object.entries(data.nodeData).map(([key, keyData]) => (
                    <tr
                      key={key}
                      className="border-b border-[var(--popup-border-color)] last:border-b-0"
                    >
                      <td className="p-2.5 font-medium text-[var(--popup-text-color)] whitespace-nowrap">
                        {key}
                      </td>

                      <td className="p-2.5 text-[var(--popup-text-color)] max-w-0">
                        <div className="max-h-[150px] overflow-auto pr-1 break-words">
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
    </div>
  );
};

export default NodeDetailsPopup;
