import type { GraphEdge, GraphNode, NodeData, RFNodeData } from "./processAST";

/**
 * Diff status for a graph node when comparing two schemas.
 * Matching is done by URI fragment so different $id bases still align.
 */
export type DiffStatus = "added" | "removed" | "modified" | "unchanged";

export const DIFF_COLORS: Record<Exclude<DiffStatus, "unchanged">, string> = {
  added: "#22c55e",
  removed: "#ef4444",
  modified: "#eab308",
};

export const DIFF_LABELS: Record<Exclude<DiffStatus, "unchanged">, string> = {
  added: "ADDED",
  removed: "REMOVED",
  modified: "MODIFIED",
};

/**
 * Stable identity for a processAST node across two compiled schemas.
 * Examples:
 *   "https://example.com/schema#/properties/name" → "#/properties/name"
 *   "https://example.com/schema"                  → "#"
 *   "https://json-schema.org/keyword/$defs"       → (full URI, synthetic)
 */
export const getNodeIdentity = (nodeId: string): string => {
  const hashIndex = nodeId.indexOf("#");
  if (hashIndex !== -1) {
    const fragment = nodeId.slice(hashIndex);
    return fragment === "" ? "#" : fragment;
  }

  // Synthetic keyword container nodes (e.g. $defs wrapper) have no fragment
  if (nodeId.includes("json-schema.org/keyword")) {
    return nodeId;
  }

  return "#";
};

/** Content fingerprint used to detect structural modifications. */
const nodeFingerprint = (data: RFNodeData): string =>
  JSON.stringify({
    label: data.nodeLabel,
    isBoolean: data.isBooleanNode,
    nodeData: normalizeNodeData(data.nodeData),
  });

/**
 * Keywords that only list / point at child schema nodes.
 * When a child is added/removed, these parent lists change too — but the real
 * change already shows up on the child node itself. Ignoring them here prevents
 * ancestors (e.g. root) from being falsely marked MODIFIED.
 */
const CHILD_STRUCTURE_KEYS = new Set([
  "properties",
  "$defs",
  "definitions",
  "allOf",
  "anyOf",
  "oneOf",
  "prefixItems",
  "patternProperties",
  "dependentSchemas",
  // Nested schema pointers (shown as "{ ... }" on the parent)
  "$ref",
  "if",
  "then",
  "else",
  "not",
  "items",
  "contains",
  "additionalProperties",
  "propertyNames",
  "unevaluatedProperties",
  "unevaluatedItems",
]);

const normalizeNodeData = (nodeData: NodeData): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(nodeData)) {
    // Skip child-structure keys — child add/remove is tracked via node identity
    if (CHILD_STRUCTURE_KEYS.has(key)) continue;

    // Prefer ellipsis markers (structural placeholders over absolute URIs)
    if (entry.ellipsis) {
      result[key] = entry.ellipsis;
    } else {
      result[key] = normalizeValue(entry.value);
    }
  }
  return result;
};

/** Strip schema base URIs so fingerprints stay stable across different $id values */
const normalizeValue = (value: unknown): unknown => {
  if (typeof value === "string" && value.includes("#")) {
    return getNodeIdentity(value);
  }
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalizeValue(v);
    }
    return out;
  }
  return value;
};

/**
 * Compare two node lists by URI fragment and return a status map keyed by identity.
 */
export const computeNodeDiffMap = (
  originalNodes: GraphNode[],
  modifiedNodes: GraphNode[]
): Map<string, DiffStatus> => {
  const originalById = new Map<string, GraphNode>();
  const modifiedById = new Map<string, GraphNode>();

  for (const node of originalNodes) {
    originalById.set(getNodeIdentity(node.id), node);
  }
  for (const node of modifiedNodes) {
    modifiedById.set(getNodeIdentity(node.id), node);
  }

  const statuses = new Map<string, DiffStatus>();
  const allIds = new Set([...originalById.keys(), ...modifiedById.keys()]);

  for (const id of allIds) {
    const original = originalById.get(id);
    const modified = modifiedById.get(id);

    if (original && !modified) {
      statuses.set(id, "removed");
    } else if (!original && modified) {
      statuses.set(id, "added");
    } else if (original && modified) {
      const same =
        nodeFingerprint(original.data) === nodeFingerprint(modified.data);
      statuses.set(id, same ? "unchanged" : "modified");
    }
  }

  return statuses;
};

/**
 * Build a single graph that shows both schemas:
 * - added / modified / unchanged → from the modified (new) schema
 * - removed → from the original schema
 *
 * Node IDs are remapped to identity fragments so edges stay consistent.
 */
export const mergeDiffGraphs = (
  originalNodes: GraphNode[],
  originalEdges: GraphEdge[],
  modifiedNodes: GraphNode[],
  modifiedEdges: GraphEdge[],
  diffMap: Map<string, DiffStatus>
): { nodes: GraphNode[]; edges: GraphEdge[] } => {
  const nodes: GraphNode[] = [];
  const seen = new Set<string>();

  const attachStatus = (node: GraphNode, status: DiffStatus): GraphNode => {
    const identity = getNodeIdentity(node.id);
    return {
      ...node,
      id: identity,
      data: {
        ...node.data,
        diffStatus: status,
      },
    };
  };

  // Prefer modified nodes for everything except removals
  for (const node of modifiedNodes) {
    const identity = getNodeIdentity(node.id);
    const status = diffMap.get(identity) ?? "unchanged";
    nodes.push(attachStatus(node, status));
    seen.add(identity);
  }

  // Append removed nodes from the original schema
  for (const node of originalNodes) {
    const identity = getNodeIdentity(node.id);
    if (diffMap.get(identity) !== "removed") continue;
    nodes.push(attachStatus(node, "removed"));
    seen.add(identity);
  }

  const remapEdge = (edge: GraphEdge): GraphEdge => ({
    ...edge,
    id: `${getNodeIdentity(edge.source)}--${edge.sourceHandle ?? ""}--${getNodeIdentity(edge.target)}--${edge.targetHandle ?? ""}`,
    source: getNodeIdentity(edge.source),
    target: getNodeIdentity(edge.target),
  });

  const edgeKeys = new Set<string>();
  const edges: GraphEdge[] = [];

  const pushUnique = (edge: GraphEdge) => {
    const remapped = remapEdge(edge);
    if (edgeKeys.has(remapped.id)) return;
    // Drop edges whose endpoints are missing from the merged node set
    if (!seen.has(remapped.source) || !seen.has(remapped.target)) return;
    edgeKeys.add(remapped.id);
    edges.push(remapped);
  };

  for (const edge of modifiedEdges) pushUnique(edge);
  for (const edge of originalEdges) pushUnique(edge);

  return { nodes, edges };
};

/** Convert a node identity fragment into a JSON Pointer path for editor highlighting. */
export const identityToPath = (identity: string): (string | number)[] => {
  if (!identity || identity === "#") return [];

  const fragment = identity.startsWith("#") ? identity.slice(1) : identity;
  return fragment
    .split("/")
    .filter((segment) => segment !== "")
    .map((segment) => {
      const decoded = decodeURIComponent(segment);
      return /^\d+$/.test(decoded) ? parseInt(decoded, 10) : decoded;
    });
};
