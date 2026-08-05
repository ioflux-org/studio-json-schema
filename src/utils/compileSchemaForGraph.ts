import { type SchemaObject } from "@hyperjump/json-schema/draft-2020-12";
import {
  setMetaSchemaOutputFormat,
  unregisterSchema,
} from "@hyperjump/json-schema";
import {
  getSchema,
  compile,
  buildSchemaDocument,
  type CompiledSchema,
  type SchemaDocument,
} from "@hyperjump/json-schema/experimental";
import { parseSchema } from "./parseSchema";
import type { SchemaFormat } from "../contexts/AppContext";

const DEFAULT_SCHEMA_ID = "https://studio.ioflux.org/schema";
const DEFAULT_SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema";

const JSON_SCHEMA_DIALECTS = [
  "https://json-schema.org/draft/2020-12/schema",
  "https://json-schema.org/draft/2019-09/schema",
  "http://json-schema.org/draft-07/schema#",
  "http://json-schema.org/draft-06/schema#",
  "http://json-schema.org/draft-04/schema#",
];
const SUPPORTED_DIALECTS = ["https://json-schema.org/draft/2020-12/schema"];

type CreateBrowser = (
  id: string,
  schemaDoc: SchemaDocument
) => {
  _cache: Record<string, SchemaDocument>;
};

/**
 * Compile schema text into a Hyperjump CompiledSchema for graph generation.
 * Always uses a unique $id so Diff mode never races with the main editor compile.
 */

export type CompileResult = {
  compiled: CompiledSchema | null;
  error: string | null;
};

export const compileSchemaForGraph = async (
  schemaText: string,
  schemaFormat: SchemaFormat,
  instanceSuffix: string
): Promise<CompileResult> => {
  if (!schemaText.trim()) return { compiled: null, error: null };

  try {
    const parsedSchema = parseSchema(schemaText, schemaFormat);
    const schemaForBuild = structuredClone(parsedSchema);

    const dialect = typeof parsedSchema !== "boolean" ? parsedSchema.$schema : undefined;
    const dialectVersion = dialect ?? DEFAULT_SCHEMA_DIALECT;

    const baseId = (typeof parsedSchema !== "boolean" && parsedSchema.$id) || DEFAULT_SCHEMA_ID;
    const schemaId = `${baseId}__compare__${instanceSuffix}`;

    if (typeof schemaForBuild !== "boolean") {
      (schemaForBuild as SchemaObject).$id = schemaId;
    }

    if (JSON_SCHEMA_DIALECTS.includes(dialectVersion) && !SUPPORTED_DIALECTS.includes(dialectVersion)) {
      return { compiled: null, error: `Dialect "${dialectVersion}" is not supported yet.` };
    }

    const schemaDocument = buildSchemaDocument(schemaForBuild as SchemaObject, schemaId, dialectVersion);
    const createBrowser: CreateBrowser = (id, schemaDoc) => ({ _cache: { [id]: schemaDoc } });
    const browser = createBrowser(schemaId, schemaDocument);
    // @ts-expect-error — local-only cache browser is sufficient for getSchema
    const schema = await getSchema(schemaDocument.baseUri, browser);

    unregisterSchema(schemaId);
    setMetaSchemaOutputFormat("BASIC");

    const compiled = await compile(schema);
    return { compiled, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { compiled: null, error: message };
  }
};