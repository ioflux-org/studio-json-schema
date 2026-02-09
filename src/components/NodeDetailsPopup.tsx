import { BsX } from "react-icons/bs";
import { type NodeData } from "../utils/processAST";

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
  const formatRoute = (nodeId: string) => {
    const hashIndex = nodeId.indexOf("#");
    const pathPart = hashIndex !== -1 ? nodeId.substring(hashIndex + 1) : nodeId;
    
    const route = pathPart ? `root${pathPart}` : "root";
    return route.replace(/\//g, " > ");
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
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      <div
        className="relative z-50 w-[60%] max-h-[80%] p-4 rounded-lg shadow-xl bg-white overflow-x-hdden overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute z-50 top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <BsX size={24} />
        </button>

        <div className="relative pt-8 text-sm">
          {nodeId && (
            <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200">
              <div className="overflow-x-auto max-h-[60px] overflow-y-auto pr-1">
                <div className="font-mono text-xs text-gray-800 whitespace-nowrap">{formatRoute(nodeId)}</div>
              </div>
            </div>
          )}
          <table className="w-full border border-gray-200 text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2 font-bold text-gray-700 w-1/3">Keyword</th>
                <th className="p-2 font-bold text-gray-700">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.nodeData &&
                Object.entries(data.nodeData).map(([key, keyData]) => (
                  <tr key={key} className="border-b border-gray-200">
                    <td className="p-2 font-medium text-gray-800 whitespace-nowrap">
                      {key}
                    </td>
                    <td className="p-2 text-gray-700">
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
