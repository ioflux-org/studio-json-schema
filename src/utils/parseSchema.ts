import YAML from "js-yaml";
import type { Json } from "@hyperjump/json-pointer";

type JSONSchema = Json & {
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