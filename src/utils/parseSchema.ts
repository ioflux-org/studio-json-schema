import YAML from "js-yaml";
import type { Json } from "@hyperjump/json-pointer";

type JSONSchema = Json & {
    $schema: string;
    $id: string
}
type ParseSchema = (schema: string, format: string) => JSONSchema;

export const parseSchema: ParseSchema = (schema: string, format: string) => {
    if (format === "yaml") {
        try {
            return YAML.load(schema) as JSONSchema;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Invalid YAML syntax: ${message}`);
        }
    }

    try {
        return JSON.parse(schema) as JSONSchema;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        if (err instanceof SyntaxError) {
            const positionMatch = message.match(/position (\d+)/);
            if (positionMatch) {
                const position = Number(positionMatch[1]);
                const beforeError = schema.slice(0, position).split(/\r?\n/);
                const line = beforeError.length;
                const column = beforeError[beforeError.length - 1].length + 1;

                throw new Error(
                    `Invalid JSON: ${message} (line ${line}, column ${column}, character ${position})`
                );
            }
        }

        throw new Error(`Invalid JSON: ${message}`);
    }
}