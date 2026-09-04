import { useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import YAML from "js-yaml";
import { AppContext, type SchemaFormat } from "../../contexts/AppContext";
import { cssToken } from "../../utils/tokens";
import { traceCustom, type TraceResult, type TraceStep } from "../../lib/blaze";
import { getOpenFrames } from "./traceStack";
import { computeJsonPositions, type SchemaPositions } from "./jsonPointerPositions";
import { resolveEvaluatePath } from "./resolveEvaluatePath";
import StackVisualizer from "./StackVisualizer";

const PLAY_INTERVAL_MS = 700;

// Matches Studio's own default schema (src/data/defaultJSONSchema.json), so
// the fallback here and the schema a fresh Studio session seeds the
// debugger with are the same — and DEFAULT_INSTANCE below passes against it.
const DEFAULT_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://studio.ioflux.org/schema",
  "description": "A JSON Schema describing a person",
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 2, "maxLength": 50 },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 },
    "address": { "$ref": "#/$defs/address" },
    "hobbies": { "type": "array", "minItems": 0, "maxItems": 5 },
    "maritalStatus": {
      "oneOf": [{ "const": "single" }, { "const": "married" }]
    },
    "isEmployed": { "type": "boolean" }
  },
  "additionalProperties": true,
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "city": { "type": "string" },
        "zip": { "description": "six digit zip code", "type": "number" }
      },
      "additionalProperties": false,
      "required": ["city", "zip"]
    }
  }
}`;

const DEFAULT_INSTANCE = `{
  "name": "Sumit",
  "age": 22,
  "address": { "city": "Pune", "zip": 411001 },
  "hobbies": ["coding", "reading"],
  "maritalStatus": "single",
  "isEmployed": true
}`;

const toMonacoRange = (position: [number, number, number, number]) => ({
  startLineNumber: position[0] + 1,
  startColumn: position[1] + 1,
  endLineNumber: position[2] + 1,
  endColumn: position[3] + 1,
});

const humanize = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

const highlightClass = (type: TraceStep["type"]) =>
  type === "fail"
    ? "debugger-highlight-fail"
    : type === "pass"
      ? "debugger-highlight-pass"
      : "debugger-highlight-push";

const defineDebuggerThemes = (monaco: Monaco) => {
  monaco.editor.defineTheme("studio-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": cssToken("--umber-850"),
      "editor.foreground": cssToken("--parchment-100"),
      "editorLineNumber.foreground": cssToken("--parchment-500"),
      "editorLineNumber.activeForeground": cssToken("--copper-300"),
      "editor.lineHighlightBackground": cssToken("--umber-800"),
      "editor.selectionBackground": `${cssToken("--copper-300")}40`,
      "editorCursor.foreground": cssToken("--copper-300"),
      "editorWidget.background": cssToken("--umber-800"),
      "editorWidget.border": cssToken("--umber-700"),
      "input.background": cssToken("--umber-750"),
      "input.border": cssToken("--umber-700"),
      "scrollbarSlider.background": `${cssToken("--umber-700")}80`,
      "scrollbarSlider.hoverBackground": cssToken("--umber-600"),
    },
  });

  monaco.editor.defineTheme("studio-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": cssToken("--sand-50"),
      "editor.foreground": cssToken("--ink-900"),
      "editorLineNumber.foreground": cssToken("--ink-500"),
      "editorLineNumber.activeForeground": cssToken("--copper-600"),
      "editor.lineHighlightBackground": cssToken("--sand-100"),
      "editor.selectionBackground": `${cssToken("--copper-500")}30`,
      "editorCursor.foreground": cssToken("--copper-600"),
      "editorWidget.background": cssToken("--sand-25"),
      "editorWidget.border": cssToken("--sand-300"),
      "input.background": cssToken("--sand-100"),
      "input.border": cssToken("--sand-300"),
      "scrollbarSlider.background": `${cssToken("--sand-300")}80`,
      "scrollbarSlider.hoverBackground": cssToken("--sand-400"),
    },
  });
};

// Seeds the debugger's schema editor with whatever is currently open in
// Studio's main editor (converting from YAML if that's the active format,
// since the debugger always works in JSON), falling back to the sample
// schema if the main editor is empty or doesn't parse.
const initialSchemaFromEditor = (mainSchemaText: string, schemaFormat: SchemaFormat): string => {
  try {
    const parsed = schemaFormat === "yaml" ? YAML.load(mainSchemaText) : JSON.parse(mainSchemaText);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return DEFAULT_SCHEMA;
  }
};

const CustomDebugger = ({ onClose }: { onClose: () => void }) => {
  const { theme, schemaText: mainSchemaText, schemaFormat } = useContext(AppContext);

  const [schemaText, setSchemaText] = useState(() =>
    initialSchemaFromEditor(mainSchemaText, schemaFormat)
  );
  const [instanceText, setInstanceText] = useState(DEFAULT_INSTANCE);
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const instanceEditorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const instanceDecorationsRef = useRef<MonacoEditorNS.IEditorDecorationsCollection | null>(null);
  const schemaEditorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const schemaDecorationsRef = useRef<MonacoEditorNS.IEditorDecorationsCollection | null>(null);

  const steps = useMemo(() => traceResult?.steps ?? [], [traceResult]);
  const currentStep = steps[stepIndex];
  const openFrames = useMemo(
    () => getOpenFrames(steps, stepIndex),
    [steps, stepIndex]
  );

  const schemaPositions = useMemo(() => {
    try {
      return computeJsonPositions(schemaText);
    } catch {
      return {};
    }
  }, [schemaText]);

  const schemaJson = useMemo(() => {
    try {
      return JSON.parse(schemaText) as unknown;
    } catch {
      return null;
    }
  }, [schemaText]);

  // A step's evaluatePath crosses "$ref" hops that don't line up with the
  // pasted text's own JSON pointers (see resolveEvaluatePath.ts) — try the
  // literal path first, then follow any $refs before giving up.
  const locateSchemaPosition = useCallback(
    (
      evaluatePath: string,
      positions: SchemaPositions
    ): [number, number, number, number] | null => {
      const direct = positions[evaluatePath];
      if (direct) return direct;
      if (schemaJson === null) return null;
      const resolved = resolveEvaluatePath(schemaJson, evaluatePath);
      return resolved !== null ? (positions[resolved] ?? null) : null;
    },
    [schemaJson]
  );

  const instancePositions = useMemo(() => {
    try {
      return computeJsonPositions(instanceText);
    } catch {
      return {};
    }
  }, [instanceText]);

  const runTrace = async () => {
    setLoading(true);
    setError(null);
    setStepIndex(0);
    setIsPlaying(false);
    try {
      const result = await traceCustom(schemaText, instanceText);
      setTraceResult(result);
    } catch (err) {
      setTraceResult(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= steps.length - 1) {
      const timer = setTimeout(() => setIsPlaying(false), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setStepIndex((i) => i + 1), PLAY_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, steps.length]);

  useEffect(() => {
    const editorInstance = instanceEditorRef.current;
    if (!editorInstance || !currentStep) return;

    const position = instancePositions[currentStep.instanceLocation];
    instanceDecorationsRef.current?.clear();
    if (!position) return;

    const range = toMonacoRange(position);
    instanceDecorationsRef.current = editorInstance.createDecorationsCollection([
      {
        range,
        options: {
          className: highlightClass(currentStep.type),
          isWholeLine: false,
          hoverMessage: currentStep.message ? { value: currentStep.message } : undefined,
        },
      },
    ]);
    editorInstance.revealRangeInCenterIfOutsideViewport(range);
  }, [currentStep, instancePositions]);

  const schemaHighlightNote = useMemo(() => {
    if (!currentStep) return null;
    const position = locateSchemaPosition(currentStep.evaluatePath, schemaPositions);
    return position
      ? null
      : "Could not locate this keyword in the schema text (it's likely a $ref into another document).";
  }, [currentStep, schemaPositions, locateSchemaPosition]);

  useEffect(() => {
    const editorInstance = schemaEditorRef.current;
    if (!editorInstance || !currentStep) return;

    const position = locateSchemaPosition(currentStep.evaluatePath, schemaPositions);
    schemaDecorationsRef.current?.clear();

    if (!position) return;

    const range = toMonacoRange(position);
    schemaDecorationsRef.current = editorInstance.createDecorationsCollection([
      {
        range,
        options: {
          className: highlightClass(currentStep.type),
          isWholeLine: false,
          hoverMessage: currentStep.message ? { value: currentStep.message } : undefined,
        },
      },
    ]);
    editorInstance.revealRangeInCenterIfOutsideViewport(range);
  }, [currentStep, schemaPositions, locateSchemaPosition]);

  const beforeMount = (monaco: Monaco) => defineDebuggerThemes(monaco);
  const monacoTheme = theme === "light" ? "studio-light" : "studio-dark";

  const describeStep = (step: NonNullable<typeof currentStep>): string => {
    if (step.message) return step.message;
    if (step.type === "push")
      return `Now checking rule "${humanize(step.name || "root")}" at ${step.evaluatePath || "the root"}.`;
    if (step.type === "pass") return "This check passed.";
    return "This check failed.";
  };

  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));
  const nextFailure = () => {
    const found = steps.findIndex((s, i) => i > stepIndex && s.type === "fail");
    if (found !== -1) setStepIndex(found);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-color)] text-[var(--text-color)]">
      <style>{`
        .debugger-highlight-pass { background: color-mix(in srgb, var(--color-success) 28%, transparent); border-bottom: 2px solid var(--color-success); }
        .debugger-highlight-fail { background: color-mix(in srgb, var(--color-danger) 32%, transparent); border-bottom: 2px solid var(--color-danger); }
        .debugger-highlight-push { background: color-mix(in srgb, var(--accent-color) 20%, transparent); border-bottom: 2px solid var(--accent-color); }
      `}</style>

      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--toolbar-border-color)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="h-8 px-3 text-sm rounded-md border border-[var(--toolbar-border-color)] bg-[var(--color-bg-inset)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] transition-colors cursor-pointer"
          >
            ← Close
          </button>
          <span className="text-sm font-medium truncate">Custom Debugger</span>
          <span className="text-[10px] text-[var(--text-secondary-color)] hidden md:inline">
            Paste any schema + instance and step through the real Blaze evaluation — runs entirely in your browser
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={runTrace}
            disabled={loading}
            className="h-8 px-3 text-sm rounded-md border border-[var(--accent-color)]/50 bg-[var(--accent-color)]/12 text-[var(--accent-color)] hover:bg-[var(--accent-color)]/20 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {loading ? "Compiling…" : "Compile & Trace"}
          </button>
          {traceResult && (
            <span
              className={`text-xs font-mono px-2 py-1 rounded-full border ${
                traceResult.valid
                  ? "border-[var(--color-success)]/40 text-[var(--color-success)]"
                  : "border-[var(--color-danger)]/40 text-[var(--color-danger)]"
              }`}
            >
              {traceResult.valid ? "Valid" : "Invalid"} · {steps.length} steps
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-[var(--color-danger)] bg-[var(--color-danger-soft)] border-b border-[var(--color-danger)]/40">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-3 p-3">
        <div className="flex-1 min-w-0 flex flex-col rounded-lg border border-[var(--toolbar-border-color)] bg-[var(--color-bg-surface)] overflow-hidden">
          <div className="px-3 py-1.5 text-xs text-[var(--text-secondary-color)] border-b border-[var(--toolbar-border-color)] flex items-center justify-between gap-2">
            <span>Schema (editable)</span>
            {schemaHighlightNote && (
              <span className="text-[10px] text-[var(--accent-color)] truncate">
                {schemaHighlightNote}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              language="json"
              theme={monacoTheme}
              beforeMount={beforeMount}
              value={schemaText}
              onChange={(value) => setSchemaText(value ?? "")}
              onMount={(editorInstance) => (schemaEditorRef.current = editorInstance)}
              options={{ minimap: { enabled: false }, fontSize: 12.5, stickyScroll: { enabled: false } }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col rounded-lg border border-[var(--toolbar-border-color)] bg-[var(--color-bg-surface)] overflow-hidden">
          <div className="px-3 py-1.5 text-xs text-[var(--text-secondary-color)] border-b border-[var(--toolbar-border-color)]">
            Instance (editable)
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              language="json"
              theme={monacoTheme}
              beforeMount={beforeMount}
              value={instanceText}
              onChange={(value) => setInstanceText(value ?? "")}
              onMount={(editorInstance) => (instanceEditorRef.current = editorInstance)}
              options={{ minimap: { enabled: false }, fontSize: 12.5, stickyScroll: { enabled: false } }}
            />
          </div>
        </div>

        <div className="w-80 shrink-0 flex flex-col rounded-lg border border-[var(--toolbar-border-color)] bg-[var(--color-bg-surface)] overflow-hidden">
          <div className="px-3 py-1.5 border-b border-[var(--toolbar-border-color)]">
            <div className="text-xs text-[var(--text-secondary-color)]">Call Stack</div>
            <div className="text-[10px] text-[var(--text-secondary-color)] opacity-70 mt-0.5">
              Rules currently being checked, deepest on top
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--toolbar-border-color)] inline-block" />
                checking
              </span>
              <span className="flex items-center gap-1 text-[var(--color-success)]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] inline-block" />
                passed
              </span>
              <span className="flex items-center gap-1 text-[var(--color-danger)]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-danger)] inline-block" />
                failed
              </span>
            </div>
          </div>
          {traceResult ? (
            <StackVisualizer frames={openFrames} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-center text-xs text-[var(--text-secondary-color)]">
              Click "Compile & Trace" to run the real Blaze evaluator on your pasted schema and instance.
            </div>
          )}
        </div>
      </div>

      {traceResult && (
        <div className="shrink-0 border-t border-[var(--toolbar-border-color)] px-4 py-3 flex flex-col gap-3">
          {currentStep && (
            <div
              className={`rounded-md border px-3 py-2.5 flex items-start gap-3 ${
                currentStep.type === "fail"
                  ? "border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)]"
                  : currentStep.type === "pass"
                    ? "border-[var(--color-success)]/40 bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)]"
                    : "border-[var(--accent-color)]/40 bg-[var(--accent-color)]/10"
              }`}
            >
              <span
                className={`text-lg leading-none shrink-0 ${
                  currentStep.type === "fail"
                    ? "text-[var(--color-danger)]"
                    : currentStep.type === "pass"
                      ? "text-[var(--color-success)]"
                      : "text-[var(--accent-color)]"
                }`}
              >
                {currentStep.type === "fail" ? "✗" : currentStep.type === "pass" ? "✓" : "▶"}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {humanize(currentStep.name || "root")}{" "}
                  <span className="text-[var(--text-secondary-color)] font-mono text-xs">
                    {currentStep.evaluatePath || "/"}
                  </span>
                </div>
                <div className="text-sm text-[var(--text-secondary-color)] mt-0.5">
                  {describeStep(currentStep)}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={stepIndex === 0}
              className="h-8 px-3 text-sm rounded-md border border-[var(--toolbar-border-color)] bg-[var(--color-bg-inset)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ◀ Step Back
            </button>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="h-8 px-3 text-sm rounded-md border border-[var(--accent-color)]/50 bg-[var(--accent-color)]/12 text-[var(--accent-color)] cursor-pointer"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={next}
              disabled={stepIndex >= steps.length - 1}
              className="h-8 px-3 text-sm rounded-md border border-[var(--toolbar-border-color)] bg-[var(--color-bg-inset)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Step Forward ▶
            </button>
            <button
              onClick={nextFailure}
              className="h-8 px-3 text-sm rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)] text-[var(--color-danger)] cursor-pointer"
            >
              Next Failure ⏭
            </button>

            <input
              type="range"
              min={0}
              max={Math.max(steps.length - 1, 0)}
              value={stepIndex}
              onChange={(e) => setStepIndex(Number(e.target.value))}
              className="flex-1 accent-[var(--accent-color)]"
            />
            <span className="text-xs font-mono text-[var(--text-secondary-color)] w-16 text-right">
              {stepIndex + 1} / {steps.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDebugger;
