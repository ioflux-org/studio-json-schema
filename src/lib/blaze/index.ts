// Runs the real Sourcemeta Blaze compiler + evaluator entirely in the browser
// (compiled to WebAssembly) — no server, no port, works offline on GitHub Pages.
import BlazeWasmModule from "./blaze_wasm.js";
import wasmUrl from "./blaze_wasm.wasm?url";
import { Blaze, describe } from "./evaluator.mjs";

export type TraceStepType = "push" | "pass" | "fail";

export type TraceStep = {
  type: TraceStepType;
  name: string;
  evaluatePath: string;
  instanceLocation: string;
  message: string;
};

export type TraceResult = {
  valid: boolean;
  steps: TraceStep[];
};

type BlazeWasmExports = {
  compileSchema: (schemaText: string) => string;
};

let modulePromise: Promise<BlazeWasmExports> | null = null;

const loadWasmModule = (): Promise<BlazeWasmExports> => {
  if (!modulePromise) {
    modulePromise = BlazeWasmModule({ locateFile: () => wasmUrl });
  }
  return modulePromise;
};

// Mirrors describe.mjs's own (unexported) `extractKeyword`: the schema
// keyword a step belongs to is just the last non-numeric evaluatePath token.
const extractKeyword = (evaluatePath: string): string => {
  if (evaluatePath === "") return "";
  const lastSlash = evaluatePath.lastIndexOf("/");
  if (lastSlash === -1) return "";
  const token = evaluatePath
    .slice(lastSlash + 1)
    .split("~1").join("/")
    .split("~0").join("~");
  return /^[0-9]+$/.test(token) ? "" : token;
};

export const traceCustom = async (
  schemaText: string,
  instanceText: string
): Promise<TraceResult> => {
  let schema: unknown;
  try {
    schema = JSON.parse(schemaText);
  } catch (error) {
    // eslint-disable-next-line preserve-caught-error -- Error(message, {cause}) needs an ES2022 lib target
    throw new Error(`Invalid schema JSON: ${(error as Error).message}`);
  }

  let instance: unknown;
  try {
    instance = JSON.parse(instanceText);
  } catch (error) {
    // eslint-disable-next-line preserve-caught-error -- Error(message, {cause}) needs an ES2022 lib target
    throw new Error(`Invalid instance JSON: ${(error as Error).message}`);
  }

  const wasm = await loadWasmModule();
  const compiled = JSON.parse(wasm.compileSchema(JSON.stringify(schema)));
  if (!compiled.ok) {
    throw new Error(compiled.error);
  }

  const evaluator = new Blaze(compiled.template);
  const steps: TraceStep[] = [];

  const valid = evaluator.validate(
    instance,
    (
      type: "pre" | "post",
      stepValid: boolean,
      instruction: unknown[],
      evaluatePath: string,
      instanceLocation: string,
      annotation: unknown
    ) => {
      const stepType: TraceStepType =
        type === "pre" ? "push" : stepValid ? "pass" : "fail";
      const message =
        type === "post"
          ? describe(
              stepValid,
              instruction,
              evaluatePath,
              instanceLocation,
              instance,
              annotation
            )
          : "";
      steps.push({
        type: stepType,
        name: extractKeyword(evaluatePath),
        evaluatePath,
        instanceLocation,
        message,
      });
    }
  );

  return { valid, steps };
};
