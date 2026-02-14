import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../contexts/AppContext";
import type { GraphNode } from "../utils/processAST";
import { BsX, BsGripVertical } from "react-icons/bs";

const NodeDetailsDraggable = ({ nodes }: { nodes: GraphNode[] }) => {
    const { selectedNodeId, setSelectedNodeId } = useContext(AppContext);
    const [selectedNode, setSelectedNode] = useState<GraphNode | undefined>(undefined);

    // Draggable State
    const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 }); // Default Top-Right
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedNodeId) {
            const node = nodes.find((n) => n.id === selectedNodeId);
            setSelectedNode(node);
        } else {
            setSelectedNode(undefined);
        }
    }, [selectedNodeId, nodes]);

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            setIsDragging(true);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                // Simple bounds checking to keep somewhat on screen
                const x = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x));
                const y = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragOffset.current.y));
                setPosition({ x, y });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    if (!selectedNodeId) return null;
    if (!selectedNode) return null;

    const { data } = selectedNode;

    return (
        <div
            ref={panelRef}
            style={{ top: position.y, left: position.x }}
            className="fixed z-[9999] w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh] overflow-hidden transition-shadow duration-200"
        >
            {/* Header with Drag Handle */}
            <div
                className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-100 dark:bg-gray-900 cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <BsGripVertical className="text-gray-400" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate pr-2">
                        {data.nodeLabel}
                    </h3>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // prevent drag start on close click
                        setSelectedNodeId(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                    <BsX size={20} />
                </button>
            </div>

            <div className="p-4 overflow-y-auto text-sm text-gray-600 dark:text-gray-300 scrollbar-thin">
                <div className="flex flex-col gap-3">
                    {Object.entries(data.nodeData).map(([key, keyData]) => (
                        <div key={key} className="flex flex-col gap-1">
                            <span className="font-medium text-xs uppercase tracking-wide opacity-70">
                                {key}
                            </span>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-800 break-words">
                                {Array.isArray(keyData.value) ? (
                                    <div className="flex flex-col gap-1">
                                        {keyData.value.map((item, idx) => (
                                            <div key={idx} className="border-l-2 border-primary/30 pl-2">
                                                {String(item)}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    String(keyData.value)
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NodeDetailsDraggable;
