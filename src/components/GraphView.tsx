import { useCallback, useEffect, useState, useMemo, forwardRef } from "react";
import type { CompiledSchema } from "@hyperjump/json-schema/experimental";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Position,
  BackgroundVariant,
  useReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";

import CustomNode from "./CustomReactFlowNode";
import NodeDetailsPopup from "./NodeDetailsPopup";
import {
  processAST,
  type GraphEdge,
  type GraphNode,
} from "../utils/processAST";
import { sortAST } from "../utils/sortAST";
import { resolveCollisions } from "../utils/resolveCollisions";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { CgClose } from "react-icons/cg";

const nodeTypes = { customNode: CustomNode };
const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const NODE_WIDTH = 172;
const NODE_HEIGHT = 36;
const HORIZONTAL_GAP = 150;

// Change 4: Exported interface so parent component can type the ref correctly
// Change 16: Added getMatchInfo and navigateMatch methods for multi-match navigation
export interface GraphViewHandle {
  searchNode: (searchString: string) => boolean;
  getMatchInfo: () => { count: number; currentIndex: number };
  navigateMatch: (direction: "next" | "prev") => void;
}

const GraphView = ({
  compiledSchema,
}: {
  compiledSchema: CompiledSchema | null;
}) => {
  const { setCenter, getZoom } = useReactFlow();
  const [expandedNode, setExpandedNode] = useState<{
    nodeId: string;
    data: Record<string, unknown>;
  } | null>(null);

  const [nodes, setNodes, onNodeChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgeChange] = useEdgesState<GraphEdge>([]);
  const [collisionResolved, setCollisionResolved] = useState(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  // Change 9: Track matched nodes and current index for multi-match navigation
  const [matchedNodes, setMatchedNodes] = useState<GraphNode[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [showErrorPopup, setShowErrorPopup] = useState(true);

  // Change 7: New searchNode function that finds a node and centers the view on it
  const searchNode = useCallback(
    (searchString: string): boolean => {
      const searchLower = searchString.toLowerCase();
      // Change 10: Use nodeLabel property for searching (as per PR feedback)
      const foundNodes = nodes.filter((node) => {
        const nodeLabel = node.data?.nodeLabel?.toString().toLowerCase() || "";
        return nodeLabel.includes(searchLower);
      });

      // Change 11: Sort by depth (hierarchical order) - shallowest first
      const sortedNodes = foundNodes.sort((a, b) => a.depth - b.depth);

      setMatchedNodes(sortedNodes);
      setCurrentMatchIndex(0);

      if (sortedNodes.length > 0) {
        const foundNode = sortedNodes[0];
        // Change 12: Removed unnecessary width/height check (as per PR feedback)
        const x = foundNode.position.x + NODE_WIDTH / 2;
        const y = foundNode.position.y + NODE_HEIGHT / 2;
        setCenter(x, y, { zoom: Math.max(getZoom(), 1), duration: 500 });

        // Change 13: Highlight the found node by selecting it
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === foundNode.id,
          }))
        );
        return true;
      }

      setMatchedNodes([]);
      return false;
    },
    [nodes, setCenter, getZoom, setNodes]
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchString = event.target.value.trim();
    if (!searchString) {
      setErrorMessage("");
      // Change 19: Reset match count when search is cleared
      setMatchCount(0);
      return;
    }
    // Change 4: Call the actual searchNode function via ref instead of the stub
    const found = searchNode(searchString);
    if (!found) {
      setErrorMessage(`${searchString} is not in schema`);
      setMatchCount(0);
    } else {
      setErrorMessage("");
      // Change 20: Get match information to display navigation controls
      const matchInfo = getMatchInfo();
      if (matchInfo) {
        setMatchCount(matchInfo.count);
        setCurrentIndex(matchInfo.currentIndex);
      }
    }
  };

  // Change 14: Function to get current match information for parent component
  const getMatchInfo = useCallback(() => {
    return {
      count: matchedNodes.length,
      currentIndex: currentMatchIndex,
    };
  }, [matchedNodes.length, currentMatchIndex]);

  // Change 15: Function to navigate between multiple matches
  const navigateMatch = useCallback(
    (direction: "next" | "prev") => {
      if (matchedNodes.length === 0) return;

      let newIndex = currentMatchIndex;
      if (direction === "next") {
        newIndex = (currentMatchIndex + 1) % matchedNodes.length;
      } else {
        newIndex =
          (currentMatchIndex - 1 + matchedNodes.length) % matchedNodes.length;
      }

      setCurrentMatchIndex(newIndex);
      const foundNode = matchedNodes[newIndex];

      const x = foundNode.position.x + NODE_WIDTH / 2;
      const y = foundNode.position.y + NODE_HEIGHT / 2;
      setCenter(x, y, { zoom: Math.max(getZoom(), 1), duration: 500 });

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === foundNode.id,
        }))
      );
    },
    [matchedNodes, currentMatchIndex, setCenter, getZoom, setNodes]
  );

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setExpandedNode({
      nodeId: node.id,
      data: node.data,
    });
  }, []);

  const generateNodesAndEdges = useCallback(
    (
      compiledSchema: CompiledSchema | null,
      nodes: GraphNode[] = [],
      edges: GraphEdge[] = []
    ) => {
      if (!compiledSchema) return;
      const { ast, schemaUri } = compiledSchema;
      // console.log(ast)
      processAST({
        ast: sortAST(ast),
        schemaUri,
        nodes,
        edges,
        parentId: "root",
        childId: null,
        nodeTitle: "root",
      });

      return { nodes, edges };
    },
    []
  );

  const getLayoutedElements = useCallback(
    (nodes: GraphNode[], edges: GraphEdge[], direction = "LR") => {
      const isHorizontal = direction === "LR";
      dagreGraph.setGraph({ rankdir: direction });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      });
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });
      dagre.layout(dagreGraph);

      const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newNode: GraphNode = {
          ...node,
          targetPosition: isHorizontal ? Position.Left : Position.Top,
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
          // We are shifting the dagre node position (anchor=center center) to the top left
          // so it matches the React Flow node anchor point (top left).
          position: {
            x:
              nodeWithPosition.x -
              NODE_WIDTH / 2 +
              (NODE_WIDTH + HORIZONTAL_GAP) * node.depth,
            y: nodeWithPosition.y - NODE_HEIGHT / 2,
          },
        };

        return newNode;
      });

      return { nodes: newNodes, edges };
    },
    []
  );

  // TODO: check if the following approach to bringing the selected edge to the top has any significant performance issues
  // check if logic can be optimised
  const orderedEdges = useMemo(() => {
    const normal: typeof edges = [];
    const selected: typeof edges = [];

    for (const edge of edges) {
      if (edge.selected) selected.push(edge);
      else normal.push(edge);
    }

    return [...normal, ...selected];
  }, [edges]);

  const animatedEdges = useMemo(
    () =>
      orderedEdges.map((edge) => {
        const isHovered = edge.id === hoveredEdgeId;
        const isSelected = edge.selected;
        const isActive = isHovered || isSelected;
        const strokeColor = isActive ? edge.data.color : "#666";
        const strokeWidth = isActive ? 2.5 : 1;
        return {
          ...edge,
          animated: isActive,
          style: {
            ...edge.style,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
          },
        };
      }),
    [orderedEdges, hoveredEdgeId]
  );

  // Change 21: Handle navigation between multiple matches
  const handleNavigate = (direction: "next" | "prev") => {
    navigateMatch(direction);
    const matchInfo = getMatchInfo();
    if (matchInfo) {
      setCurrentIndex(matchInfo.currentIndex);
    }
  };

  useEffect(() => {
    try {
      const result = generateNodesAndEdges(compiledSchema);
      if (!result) return;

      const { nodes: rawNodes, edges: rawEdges } = result;
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(rawNodes, rawEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // important: reset collision flag when schema changes
      setCollisionResolved(false);
    } catch (err) {
      console.error("Error generating visualization graph: ", err);
    }
  }, [
    compiledSchema,
    generateNodesAndEdges,
    getLayoutedElements,
    setEdges,
    setNodes,
  ]);

  const allNodesMeasured = useCallback((nodes: GraphNode[]) => {
    return (
      nodes.length > 0 &&
      nodes.every((n) => n.measured?.width && n.measured?.height)
    );
  }, []);

  useEffect(() => {
    if (collisionResolved) return;
    if (!allNodesMeasured(nodes)) return;
    const resolved = resolveCollisions(nodes, {
      maxIterations: 500,
      overlapThreshold: 0.5,
      margin: 20,
    });
    setNodes(resolved);
    setCollisionResolved(true);
  }, [nodes, collisionResolved, allNodesMeasured, setNodes]);

  useEffect(() => {
    if (errorMessage) {
      setShowErrorPopup(true);
      const timer = setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowErrorPopup(false);
    }
  }, [errorMessage]);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={animatedEdges}
        onNodeClick={onNodeClick}
        onNodesChange={onNodeChange}
        onEdgesChange={onEdgeChange}
        deleteKeyCode={null}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.05}
        maxZoom={5}
        onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
      >
        <Background
          id="main-grid"
          variant={BackgroundVariant.Lines}
          lineWidth={0.05}
          gap={100}
          color="var(--reactflow-bg-main-pattern-color)"
        />
        <Background
          id="sub-grid"
          variant={BackgroundVariant.Lines}
          lineWidth={0.02}
          gap={20}
          color="var(--reactflow-bg-sub-pattern-color)"
        />
        <Controls />
      </ReactFlow>

      {expandedNode && (
        <NodeDetailsPopup
          data={expandedNode.data}
          onClose={() => setExpandedNode(null)}
        />
      )}
      {/*Error Message */}
      {errorMessage && showErrorPopup && (
        <div className="absolute bottom-[50px] left-[100px] flex gap-2 px-2 py-1 bg-red-500 text-white rounded-md shadow-lg">
          <div className="text-sm font-medium tracking-wide font-roboto">
            {errorMessage}
          </div>
          <button
            className="cursor-pointer"
            onClick={() => setShowErrorPopup(false)}
          >
            <CgClose size={18} />
          </button>
        </div>
      )}
      <div className="absolute bottom-[10px] left-[50px] flex items-center gap-2">
        <input
          type="text"
          maxLength={30}
          placeholder="search node"
          className="outline-none text-[var(--bottom-bg-color)] border-b-2 text-center w-[150px]"
          onChange={handleChange}
        />

        {/* Change 22: Show navigation controls only when there are multiple matches */}
        {matchCount > 1 && (
          <div className="flex items-center gap-1 bg-[var(--node-bg-color)] px-2 py-1 rounded border border-[var(--text-color)] opacity-80">
            <button
              onClick={() => handleNavigate("prev")}
              className="hover:bg-[var(--text-color)] hover:bg-opacity-20 rounded p-1 transition-colors"
              title="Previous match"
            >
              <MdNavigateBefore
                size={20}
                className="text-[var(--text-color)]"
              />
            </button>

            {/* Change 23: Display current match position out of total matches */}
            <span className="text-xs text-[var(--text-color)] min-w-[40px] text-center">
              {currentIndex + 1}/{matchCount}
            </span>

            <button
              onClick={() => handleNavigate("next")}
              className="hover:bg-[var(--text-color)] hover:bg-opacity-20 rounded p-1 transition-colors"
              title="Next match"
            >
              <MdNavigateNext size={20} className="text-[var(--text-color)]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphView;
