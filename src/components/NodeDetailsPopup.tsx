import { BsX } from "react-icons/bs";
import { type NodeData } from "../utils/processAST";

const NodeDetailsPopup = ({
  data,
  onClose,
}: {
  data: {
    nodeData?: NodeData;
  };
  onClose: () => void;
}) => {
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
