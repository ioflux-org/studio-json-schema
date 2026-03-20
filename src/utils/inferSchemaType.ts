import type { GraphNode } from "./processAST";

export const inferSchemaType = (nodeData: GraphNode["data"]["nodeData"]): [string, string] => {
    if (typeof nodeData.type?.value === "string") {
        return ["objectSchema", nodeData.type.value as string];
    }

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

    const hasAnyKeyword = (keywords: Set<string>) => {
        return [...keywords].some((key) => key in nodeData);
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
