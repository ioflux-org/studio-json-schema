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

import {
  processAST,
  type GraphEdge,
  type GraphNode,
} from "../utils/processAST";
import { sortAST } from "../utils/sortAST";
import { resolveCollisions } from "../utils/resolveCollisions";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { CgClose } from "react-icons/cg";
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
  const { setCenter, getZoom, fitView } = useReactFlow();
  const [expandedNode, setExpandedNode] = useState<{
    nodeId: string;
    data: Record<string, unknown>;
  } | null>(null);
  const { selectedNode, setSelectedNode } = useContext(AppContext);
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodeChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgeChange] = useEdgesState<GraphEdge>([]);
  const [collisionResolved, setCollisionResolved] = useState(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [matchedNodes, setMatchedNodes] = useState<GraphNode[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [searchString, setSearchString] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(true);
  const [hasActiveSearch, setHasActiveSearch] = useState(false);
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
    [matchedNodes]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode({
      id: node.id,
      data: node.data,
    });
    // Select connected edges programmatically to allow native selection handling
    setEdges((eds) =>
      eds.map((edge) => {
        const isConnected = edge.source === node.id || edge.target === node.id;
        return {
          ...edge,
          selected: isConnected,
        };
      })
    );
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
    [],
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

  const resetSearchState = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: false,
      })),
    );
    fitView({ duration: 500 });
  }, [setNodes, fitView]);

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
  }, []);

  useEffect(() => {
    const trimmed = searchString.trim();

    const timeout = setTimeout(() => {
      if (!trimmed) {
        if (hasActiveSearch) {
          resetSearchState();
          setHasActiveSearch(false);
        }

        setMatchedNodes([]);
        setCurrentMatchIndex(0);
        setErrorMessage("");
        return;
      }

      const searchWords = trimmed.toLowerCase().match(/[a-zA-Z0-9_]+/g) || [];

      const foundNodes = nodes.filter((node) => {
        const labelWords = extractKeywords(node.data.nodeLabel);
        return searchWords.every((word) => labelWords.includes(word));
      });

      setMatchedNodes(foundNodes);

      if (foundNodes.length > 0) {
        const firstNode = foundNodes[currentMatchIndex % foundNodes.length];
        const x = firstNode.position.x + NODE_WIDTH / 2;
        const y = firstNode.position.y + NODE_HEIGHT / 2;

        setCenter(x, y, { zoom: Math.max(getZoom(), 1), duration: 500 });
        setNodes((nds) => {
          let changed = false;
          const newNodes = nds.map((n) => {
            const selected = n.id === firstNode.id;
            if (n.selected !== selected) changed = true;
            return { ...n, selected };
          });
          return changed ? newNodes : nds;
        });
        setHasActiveSearch(true);
        setErrorMessage("");
      } else {
        setErrorMessage(`${trimmed} is not in schema`);
        resetSearchState();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchString, nodes]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
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

      {selectedNode && (
        <NodeDetailsPopup
          data={selectedNode.data}
          onClose={() => {
            setSelectedNode(null);
          }}
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
        <div className="relative">
          <input
            type="text"
            maxLength={30}
            placeholder="search node"
            className="outline-none text-[var(--text-color)] border-b-2 border-[var(--text-color)] text-center w-[150px] pr-5"
            value={searchString}
            onChange={handleChange}
          />

          {searchString && (
            <button
              onClick={() => {
                setSearchString("");
                setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
                fitView({ duration: 800, padding: 0.05 });
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-color)] cursor-pointer hover:opacity-70"
              title="Clear search"
            >
              <CgClose size={12} />
            </button>
          )}
        </div>
        {matchCount > 1 && (
          <div className="flex items-center gap-1 bg-[var(--node-bg-color)] px-2 py-1 rounded border border-[var(--text-color)] opacity-80">
            <button
              onClick={() => navigateMatch("prev")}
              className="hover:bg-[var(--text-color)] hover:bg-opacity-20 rounded p-1 transition-colors"
              title="Previous match"
            >
              <MdNavigateBefore
                size={20}
                className="text-[var(--text-color)]"
              />
            </button>

            <span className="text-xs text-[var(--text-color)] min-w-[40px] text-center">
              {currentMatchIndex + 1}/{matchCount}
            </span>

            <button
              onClick={() => navigateMatch("next")}
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
