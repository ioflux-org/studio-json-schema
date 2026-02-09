import { BsX, BsCopy, BsCheck } from "react-icons/bs";
import { useState, useContext } from "react";
import { type NodeData } from "../utils/processAST";
import { AppContext } from "../contexts/AppContext";

const NodeDetailsPopup = ({
  nodeId,
  data,
  onClose,
}: {
  nodeId?: string;
  data: {
    nodeData?: NodeData;
  };
  onClose: () => void;
}) => {
  const { theme } = useContext(AppContext);
  const [copied, setCopied] = useState(false);

  const formatRoute = (nodeId: string) => {
    const hashIndex = nodeId.indexOf("#");
    const pathPart = hashIndex !== -1 ? nodeId.substring(hashIndex + 1) : nodeId;
    
    const route = pathPart ? `root${pathPart}` : "root";
    return route.replace(/\//g, " > ");
  };

  const copyPathToClipboard = () => {
    if (nodeId) {
      navigator.clipboard.writeText(formatRoute(nodeId).replace(/ > /g, "/"));
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
      <div className="absolute inset-0 bg-[var(--popup-backdrop-color)] backdrop-blur-sm" />
      <div
        className="relative z-50 w-[60%] max-h-[80%] p-4 rounded-lg shadow-xl bg-[var(--popup-bg-color)] overflow-x-hdden overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute z-50 top-2 right-2 text-[var(--popup-text-color)] hover:text-[var(--popup-close-btn-hover-color)]"
          onClick={onClose}
        >
          <BsX size={24} />
        </button>

        <div className="relative pt-8 text-sm">
          {nodeId && (
            <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
              <div className="overflow-x-auto max-h-[60px] overflow-y-auto pr-1 flex-1">
                <div className="font-mono text-xs text-gray-800 whitespace-nowrap">{formatRoute(nodeId)}</div>
              </div>
              <button
                onClick={copyPathToClipboard}
                className="ml-2 p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
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
          <table className="w-full border border-[var(--popup-border-color)] text-left">
            <thead>
              <tr className="bg-[var(--popup-header-bg-color)] border-b border-[var(--popup-border-color)]">
                <th className="p-2 font-bold text-[var(--popup-header-text-color)] w-1/3">Keyword</th>
                <th className="p-2 font-bold text-[var(--popup-header-text-color)]">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.nodeData &&
                Object.entries(data.nodeData).map(([key, keyData]) => (
                  <tr key={key} className="border-b border-[var(--popup-border-color)]">
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
