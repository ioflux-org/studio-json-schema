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
      <div className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-sm" />
      <div
        className="relative z-50 w-[60%] max-h-[80%] p-4 rounded-lg shadow-xl bg-[var(--color-bg-surface)] overflow-x-hdden overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute z-50 top-2 right-2 text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)]"
          onClick={onClose}
        >
          <BsX size={24} />
        </button>

        <div className="relative pt-8 text-sm">
          {nodeId && (
            <div className="mb-4 p-2 bg-[var(--color-popup-header-bg)] rounded border border-[var(--color-border)] flex items-center justify-between">
              <div className="overflow-x-auto max-h-[60px] overflow-y-auto pr-1 flex-1">
                <div className="font-mono text-xs text-[var(--color-text-primary)] whitespace-nowrap">{extractPath(nodeId)}</div>
              </div>
              <button
                onClick={copyPathToClipboard}
                className="ml-2 p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface)] rounded transition-colors flex-shrink-0"
                title="Copy path to clipboard"
              >
                {copied ? (
                  <BsCheck size={16} className="text-green-600" />
                ) : (
                  <BsCopy size={16} />
                )}
              </button>
            </div>
          )}
          <table className="w-full border border-[var(--color-border)] text-left">
            <thead>
              <tr className="bg-[var(--color-popup-header-bg)] border-b border-[var(--color-border)]">
                <th className="p-2 font-bold text-[var(--color-text-primary)] w-1/3">Keyword</th>
                <th className="p-2 font-bold text-[var(--color-text-primary)]">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.nodeData &&
                Object.entries(data.nodeData).map(([key, keyData]) => (
                  <tr key={key} className="border-b border-[var(--color-border)]">
                    <td className="p-2 font-medium text-[var(--color-text-primary)] whitespace-nowrap">
                      {key}
                    </td>
                    <td className="p-2 text-[var(--color-text-primary)]">
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
