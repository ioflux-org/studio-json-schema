import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useState, useRef } from "react";
import { MdCenterFocusStrong } from "react-icons/md";

export default function CustomReactFlowEdge({
  id,
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
    }, 150);
  };

  const focusNode = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const node = getNode(nodeId);
    if (!node) return;
    
    // We want a good zoom level when focusing, but don't zoom out if user is already zoomed in
    const currentZoom = getZoom();
    const targetZoom = Math.max(currentZoom, 1.2); 
    
    const x = node.position.x + (node.measured?.width ?? 0) / 2;
    const y = node.position.y + (node.measured?.height ?? 0) / 2;
    
    setCenter(x, y, { duration: 800, zoom: targetZoom });

    // Automatically select the node so it glows
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === nodeId,
      }))
    );
  };

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
      
      {(isHovered || selected) && (
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
              className="flex items-center gap-1 hover:text-[var(--node-key-color)] transition-colors whitespace-nowrap text-[var(--text-color)] font-medium px-1"
              title="Focus Source Node"
            >
              <MdCenterFocusStrong size={14} />
              <span>Source</span>
            </button>
            <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600"></div>
            <button
              onClick={(e) => focusNode(target, e)}
              className="flex items-center gap-1 hover:text-[var(--node-key-color)] transition-colors whitespace-nowrap text-[var(--text-color)] font-medium px-1"
              title="Focus Target Node"
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
