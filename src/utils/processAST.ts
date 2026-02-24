import type { AST, Node as HJNode } from "@hyperjump/json-schema/experimental";
import { toAbsoluteIri } from "@hyperjump/uri";
import { Position, type Node as RFNode, type Edge as RFEdge } from "@xyflow/react";
import { inferSchemaType } from "./inferSchemaType";

export type GraphNode = RFNode & {
    data: RFNodeData;
    depth: number;
};

type UnpositionedGraphNode = Omit<GraphNode, "position">;

export type HandleConfig = {
    handleId: string;
    position: Position;
}

type NodeDataValue = {
    value: unknown;
    ellipsis?: "{ ... }";
};

export type NodeData = Record<string, NodeDataValue>;

export type RFNodeData = {
    nodeLabel: string,
    isBooleanNode: boolean,
    nodeData: NodeData,
    nodeStyle: Partial<NodeStyle>,
    sourceHandles: HandleConfig[],
    targetHandles: HandleConfig[]
}

type NodeStyle = {
    color: string
}

export type GraphEdge = RFEdge & {
    data: {
        color: string;
    }
};

type ProcessASTParams = {
    ast: AST,
    schemaUri: string,
    nodes: UnpositionedGraphNode[],
    edges: GraphEdge[],
    parentId: string,
    nodeTitle: string,
    renderedNodes?: string[],
    childId: string | null,
    nodeDepth?: number
};

type KeywordHandlerParams = [
    ast: AST,
    keywordValue: unknown,
    nodes: UnpositionedGraphNode[],
    edges: GraphEdge[],
    parentId: string,
    nodeDepth: number,
    renderedNodes?: string[],
];

type UpdateNodeOptionalParameters = Partial<{
    nodeData: NodeData,
    nodeStyle: NodeStyle,
    addTargetHandle: HandleConfig
}>

type ProcessAST = (params: ProcessASTParams) => void;
type KeywordHandler = (...args: KeywordHandlerParams) => { key?: string, data: NodeDataValue, leafNode?: boolean, defs?: boolean };
type GetKeywordHandler = (handlerName: string) => KeywordHandler;
type KeywordHandlerMap = Record<string, KeywordHandler>;
type CreateBasicKeywordHandler = (key: string) => KeywordHandler;
type GetArrayFromNumber = (number: number) => number[];
type GetSourceHandle = (parentId: string, childId: string | null) => string;
type GenerateSourceHandles = (key: string | undefined, value: unknown, nodeId: string, defs: boolean | undefined) => HandleConfig[];
type UpdateNode = (nodes: UnpositionedGraphNode[], schemaUri: string, update: UpdateNodeOptionalParameters) => void;


const neonColors = {
    string: "#FF6EFF", // neon magenta
    number: "#00FF95", // neon mint
    integer: "#00FF95", // neon mint
    boolean: "#FFEA00", // neon yellow
    array: "#FF8F00", // neon amber
    object: "#00E5FF", // neon cyan
    null: "#A259FF", // neon purple
    booleanSchemaTrue: "#12FF4B", // neon green
    booleanSchemaFalse: "#FF3B3B", // neon red 
    reference: "#FFE1BD", // soft neon cream
    others: "#CCCCCC", // soft gray
};

export const processAST: ProcessAST = ({ ast, schemaUri, nodes, edges, parentId, childId, renderedNodes = [], nodeTitle, nodeDepth = 0 }) => {
    if (renderedNodes.includes(schemaUri)) {
        const sourceHandle = getSourceHandle(parentId, childId);
        const targetHandle = `${sourceHandle}-target`;
        edges.push({
            id: `${parentId}--${sourceHandle}--${schemaUri}--${targetHandle}`,
            type: "smoothstep",
            // TODO: pass the color of the targeted node instead of handcoded value
            data: { color: "#CCCCCC" },
            source: parentId,
            target: schemaUri,
            sourceHandle: sourceHandle,
            targetHandle: targetHandle
        });
        updateNode(
            nodes,
            schemaUri,
            { addTargetHandle: { handleId: targetHandle, position: Position.Top } }
        );
        return;
    }

    const schemaNodes: boolean | HJNode<unknown>[] = ast[schemaUri];
    const nodeData: NodeData = {};
    const sourceHandles: HandleConfig[] = [];
    const targetHandles: HandleConfig[] = [];

    renderedNodes.push(schemaUri);
    nodes.push({
        id: schemaUri,
        type: "customNode",
        data: {
            nodeLabel: nodeTitle,
            isBooleanNode: (typeof schemaNodes === "boolean"),
            nodeData: {},
            nodeStyle: {},
            sourceHandles,
            targetHandles
        },
        depth: nodeDepth
    });

    if (typeof schemaNodes === "boolean") {
        nodeData.booleanSchema = {
            value: schemaNodes
        }
    } else {
        for (const [keywordHandlerName, , keywordValue] of schemaNodes) {
            const handler = getKeywordHandler(toAbsoluteIri(keywordHandlerName));
            const { key, data, leafNode, defs } = handler(ast, keywordValue, nodes, edges, schemaUri, nodeDepth + 1, renderedNodes);

            if (key) {
                nodeData[key] = data;
            }
            if (!leafNode) {
                sourceHandles.push(...generateSourceHandles(key, data.value, schemaUri, defs));
            }
        }
    }

    const getColor = (nodeData: NodeData) => {
        const [, definedFor] = inferSchemaType(nodeData);
        return (
            neonColors[definedFor as keyof typeof neonColors] ?? neonColors.others
        );
    };

    const color = getColor(nodeData);
    const sourceHandle = getSourceHandle(parentId, childId);
    const targetHandle = `${sourceHandle}-target`;

    edges.push({
        id: `${parentId}--${sourceHandle}--${schemaUri}--${targetHandle}`,
        type: "smoothstep",
        data: { color },
        source: parentId,
        target: schemaUri,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle
    });

    updateNode(
        nodes,
        schemaUri,
        { nodeData, nodeStyle: { color: color }, addTargetHandle: { handleId: targetHandle, position: Position.Left } }
    );
};

const getSourceHandle: GetSourceHandle = (parentId, childId) => {
    if (childId) return `${parentId}-${childId}`;
    return parentId;
};

const generateSourceHandles: GenerateSourceHandles = (key, value, nodeId, defs) => {
    if (defs) return [{
        handleId: `${nodeId}-definitions`,
        position: Position.Bottom
    }];

    // CASE 1: Array --> generate 1 handle per element
    if (Array.isArray(value)) {
        return value.map((eachValue) => ({
            handleId: `${nodeId}-${eachValue}`,
            position: Position.Right
        }))
    }

    // CASE 2: Everything else --> 1 handle for this property
    return [{
        handleId: `${nodeId}-${key}`,
        position: Position.Right
    }];
}

const updateNode: UpdateNode = (nodes, nodeId, update) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
        // throw new Error(`Node with id ${nodeId} not found`);
        console.log(`Node with id ${nodeId} not found`)
        return;
    }

    if (update.nodeData) {
        Object.assign(node.data.nodeData, update.nodeData);
    }

    if (update.nodeStyle) {
        Object.assign(node.data.nodeStyle, update.nodeStyle);
    }

    if (update.addTargetHandle) {
        node.data.targetHandles.push(update.addTargetHandle);
    }
};

const getKeywordHandler: GetKeywordHandler = (handlerName) => {
    if (!(handlerName in keywordHandlerMap)) {
        // throw Error(`No handler found for Keyword: ${handlerName}`);
        return fallbackHandler(handlerName);
    }
    return keywordHandlerMap[handlerName];
}

const fallbackHandler: GetKeywordHandler = (handlerName) => {
    const keyword = handlerName.split('/').pop();
    console.warn(`⚠️ Keyword handler for "${keyword}" is not implemented yet.`);

    return (_ast, _keywordValue, _nodes, _edges, _parentId) => {
        return {
            key: keyword, data: { value: `⚠️  This keyword handler is not implemented yet!` }
        }
    }
};

const createBasicKeywordHandler: CreateBasicKeywordHandler = (key) => {
    return (_ast, keywordValue, _nodes, _edges, _parentId) => {
        return {
            key,
            data: {
                value: (key === "unknown") || (key === "examples") ?
                    JSON.stringify(keywordValue, null, 2)
                    : keywordValue
            },
            leafNode: true
        }
    }
}

const getArrayFromNumber: GetArrayFromNumber = (number) => (
    Array.from({ length: number }, (_, i) => i)
);

const keywordHandlerMap: KeywordHandlerMap = {

    // Core
    // "https://json-schema.org/keyword/dynamicRef": createBasicKeywordHandler("$dynamicRef"),
    // "https://json-schema.org/keyword/draft-2020-12/dynamicRef": createBasicKeywordHandler("$dynamicRef"),
    "https://json-schema.org/keyword/ref": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        processAST({ ast, schemaUri: keywordValue as string, nodes, edges, parentId, childId: "$ref", renderedNodes, nodeTitle: "", nodeDepth });
        return { key: "$ref", data: { value: keywordValue, ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/comment": createBasicKeywordHandler("$comment"),
    "https://json-schema.org/keyword/definitions": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        ast["https://json-schema.org/keyword/$defs"] = [
            [
                "https://json-schema.org/keyword/$defs",
                `${parentId}/$defs`,
                keywordValue
            ]
        ];
        processAST({ ast, schemaUri: "https://json-schema.org/keyword/$defs", nodes, edges, parentId, renderedNodes, childId: "definitions", nodeTitle: "definitions", nodeDepth: nodeDepth - 1 });
        return { defs: true, data: { value: "definitions" } }
    },
    "https://json-schema.org/keyword/$defs": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        for (const [index, item] of value.entries()) {
            processAST({ ast, schemaUri: item, nodes, edges, parentId, renderedNodes, childId: String(index), nodeTitle: `defs[${index}]`, nodeDepth });
        }
        return { key: "$defs", data: { value: getArrayFromNumber(value.length) } }
    },

    // Applicator
    "https://json-schema.org/keyword/allOf": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        for (const [index, item] of value.entries()) {
            processAST({ ast, schemaUri: item, nodes, edges, parentId, renderedNodes, childId: String(index), nodeTitle: `allOf[${index}]`, nodeDepth });
        }
        return { key: "allOf", data: { value: getArrayFromNumber(value.length) } }
    },
    "https://json-schema.org/keyword/anyOf": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        for (const [index, item] of value.entries()) {
            processAST({ ast, schemaUri: item, nodes, edges, parentId, renderedNodes, childId: String(index), nodeTitle: `anyOf[${index}]`, nodeDepth });
        }
        return { key: "anyOf", data: { value: getArrayFromNumber(value.length) } }
    },
    "https://json-schema.org/keyword/oneOf": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        for (const [index, item] of value.entries()) {
            processAST({ ast, schemaUri: item, nodes, edges, parentId, renderedNodes, childId: String(index), nodeTitle: `oneOf[${index}]`, nodeDepth });
        }
        return { key: "oneOf", data: { value: getArrayFromNumber(value.length) } }
    },
    "https://json-schema.org/keyword/if": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        processAST({ ast, schemaUri: keywordValue as string, nodes, edges, parentId, childId: "if", renderedNodes, nodeTitle: "if", nodeDepth });
        return { key: "if", data: { value: keywordValue, ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/then": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        processAST({ ast, schemaUri: value[1] as string, nodes, edges, parentId, childId: "then", renderedNodes, nodeTitle: "then", nodeDepth });
        return { key: "then", data: { value: value[1], ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/else": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        processAST({ ast, schemaUri: value[1], nodes, edges, parentId, childId: "else", renderedNodes, nodeTitle: "else", nodeDepth });
        return { key: "else", data: { value: value[1], ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/properties": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const propertyNames = [];
        for (const [key, value] of Object.entries(keywordValue as string)) {
            propertyNames.push(key);
            processAST({ ast, schemaUri: value, nodes, edges, parentId, renderedNodes, childId: key, nodeTitle: `properties["${key}"]`, nodeDepth });
        }
        return { key: "properties", data: { value: propertyNames } }
    },
    "https://json-schema.org/keyword/additionalProperties": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        processAST({ ast, schemaUri: value[1], nodes, edges, parentId, childId: "additionalProperties", renderedNodes, nodeTitle: "additionalProperties", nodeDepth });
        return { key: "additionalProperties", data: { value: value[1], ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/patternProperties": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        for (const [index, item] of value.entries()) {
            processAST({ ast, schemaUri: item[1], nodes, edges, parentId, renderedNodes, childId: String(index), nodeTitle: "patternProperties", nodeDepth });
        }
        return { key: "patternProperties", data: { value: getArrayFromNumber(value.length) } }
    },
    // "https://json-schema.org/keyword/dependentSchemas": createBasicKeywordHandler("dependentSchemas"),
    "https://json-schema.org/keyword/contains": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as { contains: string; minContains: number; maxContains: number };
        processAST({ ast, schemaUri: value.contains, nodes, edges, parentId, childId: "contains", renderedNodes, nodeTitle: "contains", nodeDepth });
        return { key: "contains", data: { value: value.contains, ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/items": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        processAST({ ast, schemaUri: value[1], nodes, edges, parentId, childId: "items", renderedNodes, nodeTitle: "items", nodeDepth });
        return { key: "items", data: { value: value[1], ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/prefixItems": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        const value = keywordValue as string[];
        for (const [index, item] of value.entries()) {
            processAST({ ast, schemaUri: item, nodes, edges, parentId, renderedNodes, childId: String(index), nodeTitle: `prefixItems[${index}]`, nodeDepth });
        }
        return { key: "prefixItems", data: { value: getArrayFromNumber(value.length) } }
    },
    "https://json-schema.org/keyword/not": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        processAST({ ast, schemaUri: keywordValue as string, nodes, edges, parentId, childId: "not", renderedNodes, nodeTitle: "not", nodeDepth });
        return { key: "not", data: { value: keywordValue, ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/propertyNames": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        processAST({ ast, schemaUri: keywordValue as string, nodes, edges, parentId, childId: "propertyNames", renderedNodes, nodeTitle: "propertyNames", nodeDepth });
        return { key: "propertyNames", data: { value: keywordValue, ellipsis: "{ ... }" } }
    },

    // Validation
    "https://json-schema.org/keyword/type": createBasicKeywordHandler("type"),
    "https://json-schema.org/keyword/enum": createBasicKeywordHandler("enum"),
    "https://json-schema.org/keyword/const": createBasicKeywordHandler("const"),
    "https://json-schema.org/keyword/maxLength": createBasicKeywordHandler("maxLength"),
    "https://json-schema.org/keyword/minLength": createBasicKeywordHandler("minLength"),
    "https://json-schema.org/keyword/pattern": createBasicKeywordHandler("pattern"),
    "https://json-schema.org/keyword/exclusiveMaximum": createBasicKeywordHandler("exclusiveMaximum"),
    "https://json-schema.org/keyword/exclusiveMinimum": createBasicKeywordHandler("exclusiveMinimum"),
    "https://json-schema.org/keyword/maximum": createBasicKeywordHandler("maximum"),
    "https://json-schema.org/keyword/minimum": createBasicKeywordHandler("minimum"),
    "https://json-schema.org/keyword/multipleOf": createBasicKeywordHandler("multipleOf"),
    "https://json-schema.org/keyword/dependentRequired": createBasicKeywordHandler("dependentRequired"),
    "https://json-schema.org/keyword/maxProperties": createBasicKeywordHandler("maxProperties"),
    "https://json-schema.org/keyword/minProperties": createBasicKeywordHandler("minProperties"),
    "https://json-schema.org/keyword/required": createBasicKeywordHandler("required"),
    "https://json-schema.org/keyword/maxItems": createBasicKeywordHandler("maxItems"),
    "https://json-schema.org/keyword/minItems": createBasicKeywordHandler("minItems"),
    "https://json-schema.org/keyword/maxContains": createBasicKeywordHandler("maxContains"),
    "https://json-schema.org/keyword/minContains": createBasicKeywordHandler("minContains"),
    "https://json-schema.org/keyword/uniqueItems": createBasicKeywordHandler("uniqueItems"),

    // Meta Data
    "https://json-schema.org/keyword/default": createBasicKeywordHandler("default"),
    "https://json-schema.org/keyword/title": createBasicKeywordHandler("title"),
    "https://json-schema.org/keyword/description": createBasicKeywordHandler("description"),
    "https://json-schema.org/keyword/deprecated": createBasicKeywordHandler("deprecated"),
    "https://json-schema.org/keyword/examples": createBasicKeywordHandler("examples"),
    "https://json-schema.org/keyword/readOnly": createBasicKeywordHandler("readOnly"),
    "https://json-schema.org/keyword/writeOnly": createBasicKeywordHandler("writeOnly"),

    // Format Annotation
    "https://json-schema.org/keyword/draft-2020-12/format": createBasicKeywordHandler("format"),

    // Format Assertion
    // "https://json-schema.org/keyword/format-assertion": createBasicKeywordHandler("format-assertion"),

    // Content
    "https://json-schema.org/keyword/contentEncoding": createBasicKeywordHandler("contentEncoding"),
    "https://json-schema.org/keyword/contentMediaType": createBasicKeywordHandler("contentMediaType"),
    "https://json-schema.org/keyword/contentSchema": createBasicKeywordHandler("contentSchema"),

    // Unknown keywords
    "https://json-schema.org/keyword/unknown": createBasicKeywordHandler("unknown"),

    // Unevaluated
    "https://json-schema.org/keyword/unevaluatedProperties": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        processAST({ ast, schemaUri: keywordValue as string, nodes, edges, parentId, childId: "unevaluatedProperties", renderedNodes, nodeTitle: "unevaluatedProperties", nodeDepth });
        return { key: "unevaluatedProperties", data: { value: keywordValue, ellipsis: "{ ... }" } }
    },
    "https://json-schema.org/keyword/unevaluatedItems": (ast, keywordValue, nodes, edges, parentId, nodeDepth, renderedNodes) => {
        processAST({ ast, schemaUri: keywordValue as string, nodes, edges, parentId, childId: "unevaluatedItems", renderedNodes, nodeTitle: "unevaluatedItems", nodeDepth });
        return { key: "unevaluatedItems", data: { value: keywordValue, ellipsis: "{ ... }" } }
    }
};
