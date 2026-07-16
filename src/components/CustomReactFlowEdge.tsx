import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { MdCenterFocusStrong } from "react-icons/md";

export default function CustomReactFlowEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
  selected,
}: EdgeProps) {
  const { setCenter, getNode, getZoom, setNodes } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [activeButton, setActiveButton] = useState<"source" | "target" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setActiveButton(null);
    }, 150);
  };

  const focusNode = useCallback((nodeId: string, event?: React.MouseEvent | KeyboardEvent) => {
    event?.stopPropagation();
    const node = getNode(nodeId);
    if (!node) return;
    const currentZoom = getZoom();
    const targetZoom = Math.max(currentZoom, 1.2); 
    
    const x = node.position.x + (node.measured?.width ?? 0) / 2;
    const y = node.position.y + (node.measured?.height ?? 0) / 2;
    
    setCenter(x, y, { duration: 800, zoom: targetZoom });
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === nodeId,
      }))
    );
  }, [getNode, getZoom, setCenter, setNodes]);

  useEffect(() => {
    if (!isHovered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveButton("source");
        e.preventDefault(); 
      } else if (e.key === "ArrowRight") {
        setActiveButton("target");
        e.preventDefault();
      } else if (e.key === "Enter" && activeButton) {
        focusNode(activeButton === "source" ? source : target, e);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, activeButton, focusNode, source, target]);

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          strokeWidth: isHovered || selected ? 3 : 1.5,
          transition: "stroke-width 0.2s" 
        }} 
      />
      
      {/* Invisible thicker path for easier hovering */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {isHovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="flex items-center gap-2 bg-[var(--node-bg-color)] px-2 py-1.5 rounded-md shadow-md border border-[var(--popup-border-color)] text-xs z-50 animate-fade-in"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={(e) => focusNode(source, e)}
              className={`flex items-center gap-1 hover:text-[var(--node-key-color)] transition-colors whitespace-nowrap text-[var(--text-color)] font-medium px-1.5 py-0.5 rounded ${
                activeButton === "source" ? "ring-2 ring-[var(--node-key-color)] bg-black/5 dark:bg-white/10" : ""
              }`}
              title="Focus Source Node (Left Arrow)"
            >
              <MdCenterFocusStrong size={14} />
              <span>Source</span>
            </button>
            <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600"></div>
            <button
              onClick={(e) => focusNode(target, e)}
              className={`flex items-center gap-1 hover:text-[var(--node-key-color)] transition-colors whitespace-nowrap text-[var(--text-color)] font-medium px-1.5 py-0.5 rounded ${
                activeButton === "target" ? "ring-2 ring-[var(--node-key-color)] bg-black/5 dark:bg-white/10" : ""
              }`}
              title="Focus Target Node (Right Arrow)"
            >
              <span>Target</span>
              <MdCenterFocusStrong size={14} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
