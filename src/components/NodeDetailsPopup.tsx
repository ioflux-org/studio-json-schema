import { BsX, BsCopy, BsCheck } from "react-icons/bs";
import { useContext, useState } from "react";
import { type NodeData } from "../utils/processAST";
import { AppContext } from "../contexts/AppContext";

const NodeDetailsPopup = ({
  data,
  onClose,
}: {
  data: {
    nodeData?: NodeData;
  };
  onClose: () => void;
}) => {
  const { selectedNodeSubschema } = useContext(AppContext);
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
    if (!selectedNodeSubschema) return;

    navigator.clipboard.writeText(selectedNodeSubschema).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-slate-800 text-slate-100 hover:bg-slate-900 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleCopySubschema}
            title="Copy subschema to clipboard"
            disabled={!selectedNodeSubschema}
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