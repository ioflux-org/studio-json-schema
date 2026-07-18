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

export const inferSchemaType = (nodeData: GraphNode["data"]["nodeData"]): string => {
    const typeValue = nodeData.type?.value;

    if (typeof typeValue === "string") {
        return typeValue;
    }

    if (typeof typeValue === "object" && typeValue !== null && !Array.isArray(typeValue)) {
        return "multiType";
    }

    const hasAnyKeyword = (keywords: Set<string>) => {
        return Object.keys(nodeData).some((key) => keywords.has(key));
    }

    if ("booleanSchema" in nodeData) {
        return nodeData.booleanSchema.value ? "booleanSchemaTrue" : "booleanSchemaFalse";
    }
    if (hasAnyKeyword(objectKeywords)) return "object";
    if (hasAnyKeyword(arrayKeywords)) return "array";
    if (hasAnyKeyword(stringKeywords)) return "string";
    if (hasAnyKeyword(numberKeywords)) return "number";
    if (hasAnyKeyword(refKeyword)) return "reference";

    return "others";
};
