import { useState } from "react";
import { BsCheck, BsCopy, BsX } from "react-icons/bs";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { type NodeData } from "../utils/processAST";

// keywords whose value array items each map to a child node,
// with source handles of the form `${nodeId}-${item}`
const CHILD_ARRAY_KEYWORDS = new Set([
  "properties",
  "allOf",
  "anyOf",
  "oneOf",
  "prefixItems",
  "$defs",
  "patternProperties",
  "dependentSchemas",
]);

// nav buttons follow the popup palette so they stay in sync with the theme
const NAV_BUTTON_CLASS =
  "rounded border border-[var(--popup-border-color)] bg-[var(--popup-header-bg-color)] text-[var(--popup-text-color)] hover:text-[var(--popup-close-btn-hover-color)] transition-colors";

const NodeDetailsPopup = ({
  nodeId,
  data,
  hasParent = false,
  childEdges = [],
  onSelectParent,
  onSelectChild,
  onClose,
}: {
  nodeId: string;
  data: {
    nodeData?: NodeData;
  };
  hasParent?: boolean;
  childEdges?: { sourceHandle?: string | null; target: string }[];
  onSelectParent?: () => void;
  onSelectChild?: (childEdgeIndex: number) => void;
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

  const findChildEdgeIndex = (sourceHandle: string) =>
    childEdges.findIndex((e) => e.sourceHandle === sourceHandle);

  const childButton = (childEdgeIndex: number) => (
    <button
      onClick={() => onSelectChild?.(childEdgeIndex)}
      className={`ml-2 p-0.5 ${NAV_BUTTON_CLASS} flex-shrink-0`}
      title="Go to child node"
      aria-label="Go to child node"
    >
      <MdNavigateNext size={14} />
    </button>
  );

  const formatValue = (key: string, keyData: NodeData[string]) => {
    const value = keyData.value;

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-col gap-0.5">
          {value.map((item, index) => {
            const childEdgeIndex = CHILD_ARRAY_KEYWORDS.has(key)
              ? findChildEdgeIndex(`${nodeId}-${item}`)
              : -1;
            return (
              <div key={index} className="flex items-center justify-between w-full">
                <span>{String(item)}</span>
                {childEdgeIndex !== -1 && childButton(childEdgeIndex)}
              </div>
            );
          })}
        </div>
      );
    }

    // keywords holding a single sub-schema ($ref, items, if, then, ...) are
    // flagged with an ellipsis and use the keyword itself as the handle key
    const childEdgeIndex = keyData.ellipsis
      ? findChildEdgeIndex(`${nodeId}-${key}`)
      : -1;

    return (
      <div className="flex items-center w-full justify-between">
        <span>{String(value)}</span>
        {childEdgeIndex !== -1 && childButton(childEdgeIndex)}
      </div>
    );
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[var(--popup-backdrop-color)] backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="node-details-title"
        className="relative z-50 w-[90%] sm:w-[50%] min-w-[320px] max-h-[80%] p-6 rounded-2xl border border-[var(--accent-color)]/50 bg-[var(--popup-bg-color)] overflow-x-hidden overflow-auto"
        style={{ boxShadow: "var(--shadow-lg), 0 0 25px -8px var(--accent-color)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute z-50 top-2 left-3 flex items-center gap-2">
          <h2 id="node-details-title" className="sr-only">
            Node Details
          </h2>
          {hasParent && (
            <button
              onClick={onSelectParent}
              className={`p-0.5 ${NAV_BUTTON_CLASS}`}
              title="Go to parent node"
              aria-label="Go to parent node"
            >
              <MdNavigateBefore size={16} />
            </button>
          )}
        </div>

        <button
          aria-label="Close node details"
          className="absolute z-50 top-4 right-4 p-1.5 rounded-lg text-[var(--text-color)] hover:text-[var(--accent-color)] transition-all"
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
                className="ml-2 p-1.5 text-[var(--text-color)] hover:text-[var(--accent-color)] rounded-md transition-colors flex-shrink-0"
                title="Copy path to clipboard"
                aria-label="Copy path to clipboard"
              >
                {copied ? (
                  <BsCheck size={16} className="text-[var(--color-success)]" />
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
                  <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--accent-color)] w-1/3">
                    Keyword
                  </th>
                  <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--accent-color)]">
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
                          {formatValue(key, keyData)}
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
