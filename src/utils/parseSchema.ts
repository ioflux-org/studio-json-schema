import YAML from "js-yaml";
import type { Json } from "@hyperjump/json-pointer";
import { parseTree, findNodeAtLocation } from "jsonc-parser";
import { parseDocument } from "yaml";

type HighlightedNodeRange = {
    start: number;
    end: number;
};

export type JSONSchema = Json & {
    $schema: string;
    $id: string
}
type ParseSchema = (schema: string, format: string) => JSONSchema;

export const parseSchema: ParseSchema = (schema: string, format: string) => {
    if (format === "yaml") {
        return YAML.load(schema);
    } else {
        return JSON.parse(schema);
    }
}

export const getHighlightedNodeRangeFromPath = (
    text: string,
    path: (string | number)[],
    schemaFormat: "json" | "yaml"
): HighlightedNodeRange | null => {
    try {
        if (schemaFormat === "yaml") {
            const doc = parseDocument(text);

            const node = doc.getIn(path, true) as any;

            if (!node || !node.range) return null;

            const [start, valueEnd, _nodeEnd] = node.range;

            return {
                start,
                end: valueEnd,
            };
        }

        const tree = parseTree(text);
        if (!tree) return null;

        const node = findNodeAtLocation(tree, path);
        if (!node) return null;

        return {
            start: node.offset,
            end: node.offset + node.length,
        };
    } catch (err) {
        console.log("Error parsing schema:", err);
        return null;
    }
}
