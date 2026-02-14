import { useCallback, useEffect, useState, useMemo, useContext } from "react";
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
  const { setSelectedNodeId } = useContext(AppContext);
  const [expandedNode, setExpandedNode] = useState<{
    nodeId: string;
    data: Record<string, unknown>;
  } | null>(null);

  const [nodes, setNodes, onNodeChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgeChange] = useEdgesState<GraphEdge>([]);
  const [collisionResolved, setCollisionResolved] = useState(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
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
    </div>
  );
};

export default GraphView;
