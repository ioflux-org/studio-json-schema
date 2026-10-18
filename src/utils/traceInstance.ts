import { interpret, type CompiledSchema } from "@hyperjump/json-schema/experimental";
import { fromJs } from "@hyperjump/json-schema/instance/experimental";
import type { Json } from "@hyperjump/json-pointer";

export type TraceStepType = "push" | "pass" | "fail";

export type TraceStep = {
  type: TraceStepType;
  keywordId: string;
  schemaUri: string;
  instancePointer: string;
};

export type TraceResult = {
  valid: boolean;
  steps: TraceStep[];
};

export const traceInstance = (
  compiledSchema: CompiledSchema,
  instanceValue: Json
): TraceResult => {
  const steps: TraceStep[] = [];

  const output = interpret(compiledSchema, fromJs(instanceValue), {
    plugins: [
      {
        beforeKeyword(keywordNode, instance) {
          steps.push({
            type: "push",
            keywordId: keywordNode[0],
            schemaUri: keywordNode[1],
            instancePointer: instance.pointer,
          });
        },
        afterKeyword(keywordNode, instance, _context, valid) {
          steps.push({
            type: valid ? "pass" : "fail",
            keywordId: keywordNode[0],
            schemaUri: keywordNode[1],
            instancePointer: instance.pointer,
          });
        },
      },
    ],
  });

  return { valid: output.valid, steps };
};

// A step's schemaUri is often a leaf keyword (e.g. ".../properties/age/minimum")
// that the graph never turns into its own node — only structural keywords
// (properties, $ref, allOf, ...) do. This walks up the URI's own fragment
// until it lands on one that is an actual node id.
export const findNearestGraphNodeId = (
  schemaUri: string,
  nodeIds: Set<string>
): string | null => {
  const hashIndex = schemaUri.indexOf("#");
  if (hashIndex === -1) return nodeIds.has(schemaUri) ? schemaUri : null;

  const base = schemaUri.slice(0, hashIndex);
  let fragment = schemaUri.slice(hashIndex + 1);

  while (true) {
    const candidate = `${base}#${fragment}`;
    if (nodeIds.has(candidate)) return candidate;
    if (!fragment) return null;
    const lastSlash = fragment.lastIndexOf("/");
    fragment = lastSlash === -1 ? "" : fragment.slice(0, lastSlash);
  }
};

export const pointerToPath = (pointer: string): (string | number)[] => {
  if (!pointer) return [];
  return pointer
    .split("/")
    .slice(1)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
};
