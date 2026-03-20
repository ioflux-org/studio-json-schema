import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useContext,
  useRef,
} from "react";
import { AppContext } from "../contexts/AppContext";
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
import SearchBar from "./SearchBar"; // <-- Import the new SearchBar

import {
  processAST,
  type GraphEdge,
  type GraphNode,
} from "../utils/processAST";
import { sortAST } from "../utils/sortAST";
import { resolveCollisions } from "../utils/resolveCollisions";
import { extractKeywords } from "../utils/searchNodeHelpers";

const nodeTypes = { customNode: CustomNode };
const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const NODE_WIDTH = 172;
const NODE_HEIGHT = 36;
const HORIZONTAL_GAP = 150;

const GraphView = ({
  compiledSchema,
}: {
  compiledSchema: CompiledSchema | null;
}) => {
  // Added getNodes here to fetch the latest nodes cleanly during a search
  const { setCenter, getZoom, fitView, getNodes } = useReactFlow();
  const { selectedNode, setSelectedNode } = useContext(AppContext);
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodeChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgeChange] = useEdgesState<GraphEdge>([]);
  const [collisionResolved, setCollisionResolved] = useState(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  
  // Search state that GraphView still needs to track
  const [matchedNodes, setMatchedNodes] = useState<GraphNode[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const matchCount = matchedNodes.length;

  const navigateMatch = useCallback(
    (direction: "next" | "prev") => {
      if (!matchCount) return;

      setCurrentMatchIndex((prevIndex) => {
        const newIndex =
          direction === "next"
            ? (prevIndex + 1) % matchCount
            : (prevIndex - 1 + matchCount) % matchCount;

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

        return newIndex;
      });
    },
    [matchedNodes, matchCount, setCenter, getZoom, setNodes]
  );

const handleSearch = useCallback((searchTerm: string) => {
    // FIX: Cast the generic Node[] to your custom GraphNode[]
    const currentNodes = getNodes() as GraphNode[]; 
    
    // If search is cleared
    if (!searchTerm) {
      setMatchedNodes([]);
      setCurrentMatchIndex(0);
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      fitView({ duration: 800, padding: 0.05 });
      return true; 
    }

    const searchWords = searchTerm.toLowerCase().match(/[a-zA-Z0-9_]+/g) || [];

    const foundNodes = currentNodes.filter((node) => {
      // TypeScript now knows node.data.nodeLabel is a string
      const labelWords = extractKeywords(node.data.nodeLabel);
      return searchWords.every((word) => labelWords.includes(word));
    });

    setMatchedNodes(foundNodes);
    setCurrentMatchIndex(0);

    if (foundNodes.length > 0) {
      const firstNode = foundNodes[0];
      const x = firstNode.position.x + NODE_WIDTH / 2;
      const y = firstNode.position.y + NODE_HEIGHT / 2;

      setCenter(x, y, { zoom: Math.max(getZoom(), 1), duration: 500 });
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === firstNode.id })));
      
      return true; // Match found
    }

    return false; // No match found
  }, [getNodes, setNodes, fitView, setCenter, getZoom]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode({
      id: node.id,
      data: node.data,
    });
    setEdges((eds) =>
      eds.map((edge) => {
        const isConnected = edge.source === node.id || edge.target === node.id;
        return {
          ...edge,
          selected: isConnected,
        };
      })
    );
  }, [setSelectedNode, setEdges]);

  const generateNodesAndEdges = useCallback(
    (
      compiledSchema: CompiledSchema | null,
      nodes: GraphNode[] = [],
      edges: GraphEdge[] = []
    ) => {
      if (!compiledSchema) return;
      const { ast, schemaUri } = compiledSchema;
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

  useEffect(() => {
    try {
      const result = generateNodesAndEdges(compiledSchema);
      if (!result) return;

      const { nodes: rawNodes, edges: rawEdges } = result;
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(rawNodes, rawEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

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
    if (!containerRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fitView({ duration: 800, padding: 0.05 });
      }, 100);
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [fitView]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (matchCount <= 1) return;

      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        navigateMatch("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateMatch("prev");
      }
    },
    [matchCount, navigateMatch]
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full h-full"
    >
      <ReactFlow
        nodes={nodes}
        edges={animatedEdges}
        onNodeClick={onNodeClick}
        onNodesChange={onNodeChange}
        onEdgesChange={onEdgeChange}
        deleteKeyCode={null}
        nodeTypes={nodeTypes}
        minZoom={0.05}
        maxZoom={5}
        onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        onPaneClick={() => {
          setSelectedNode(null);
        }}
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

      {/* RENDER THE NEW SEARCH BAR HERE */}
      <SearchBar 
        onSearch={handleSearch}
        onNavigate={navigateMatch}
        matchCount={matchCount}
        currentIndex={currentMatchIndex}
      />

      {selectedNode && (
        <NodeDetailsPopup
          nodeId={selectedNode.id}
          data={selectedNode.data}
          onClose={() => {
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
};

export default GraphView;