import type { GraphNode } from "./processAST";

const objectKeywords = new Set([
    "properties",
    "additionalProperties",
    "patternProperties",
    "dependentSchemas",
    "propertyNames",
    "dependentRequired",
    "maxProperties",
    "minProperties",
    "required",
]);
const arrayKeywords = new Set([
    "items",
    "prefixItems",
    "contains",
    "maxItems",
    "minItems",
    "maxContains",
    "minContains",
    "uniqueItems",
]);
const stringKeywords = new Set([
    "maxLength",
    "minLength",
    "pattern",
]);
const numberKeywords = new Set([
    "exclusiveMaximum",
    "exclusiveMinimum",
    "maximum",
    "minimum",
    "multipleOf",
]);
const refKeyword = new Set([
    "$ref"
]);

export const inferSchemaType = (nodeData: GraphNode["data"]["nodeData"]): [string, string] => {
    const typeValue = nodeData.type?.value;

    if (typeof typeValue === "string") {
        return ["objectSchema", typeValue];
    }

    if (typeof typeValue === "object" && typeValue !== null && !Array.isArray(typeValue)) {
        let primaryType = "others";
        for (const t of Object.keys(typeValue as Record<string, string>)) {
            if (t !== "null") {
                primaryType = t;
                break;
            }
        }
        return ["multiType", primaryType];
    }

    const hasAnyKeyword = (keywords: Set<string>) => {
        return Object.keys(nodeData).some((key) => keywords.has(key));
    }

    const getBooleanSchemaValue = (value: string): string => {
        return value ? "booleanSchemaTrue" : "booleanSchemaFalse";
    }

    if ("booleanSchema" in nodeData) return ["booleanSchema", getBooleanSchemaValue(nodeData.booleanSchema.value as string)];
    if (hasAnyKeyword(objectKeywords)) return ["objectSchema", "object"];
    if (hasAnyKeyword(arrayKeywords)) return ["objectSchema", "array"];
    if (hasAnyKeyword(stringKeywords)) return ["objectSchema", "string"];
    if (hasAnyKeyword(numberKeywords)) return ["objectSchema", "number"];
    if (hasAnyKeyword(refKeyword)) return ["objectSchema", "reference"];

    return ["objectSchema", "others"];
};
