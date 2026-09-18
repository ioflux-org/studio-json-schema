import { useContext, useState, useEffect, useRef, useMemo } from "react";
import { BsUpload, BsDownload } from "react-icons/bs";
import { MdPlayArrow, MdPause, MdSkipPrevious, MdSkipNext, MdReplay } from "react-icons/md";
import { SESSION_SCHEMA_KEY, SESSION_INSTANCE_KEY } from "../constants";
import defaultInstance from "../data/defaultInstance.json";
import {
  traceInstance,
  pointerToPath,
  type TraceResult,
} from "../utils/traceInstance";
import type { ActiveTraceStep } from "./GraphView";

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
// INFO: modifying the following import statement to (import type { SchemaObject } from "@hyperjump/json-schema/draft-2020-12") creates error;
import { type SchemaObject } from "@hyperjump/json-schema/draft-2020-12";
import {
  setMetaSchemaOutputFormat,
  unregisterSchema,
  InvalidSchemaError,
} from "@hyperjump/json-schema";
import {
  getSchema,
  compile,
  buildSchemaDocument,
  type CompiledSchema,
  type SchemaDocument,
} from "@hyperjump/json-schema/experimental";
import { jsonSchemaErrors } from "@hyperjump/json-schema-errors";

import Editor, { type OnMount } from "@monaco-editor/react";
import { cssToken } from "../utils/tokens";
import type { editor } from "monaco-editor";
import { AppContext } from "../contexts/AppContext";
import SchemaVisualization from "./SchemaVisualization";
import NavigationBar from "./NavigationBar";
import EditorToggleButton from "./EditorToggleButton";
import {
  parseSchema,
  getHighlightedNodeRangeFromPath,
  type JSONSchema,
} from "../utils/parseSchema";
import { pointerSegments } from "@hyperjump/json-pointer";
import { getKeywordDocLink } from "../utils/keywordDocs";
import SchemaErrorsPopup from "./SchemaErrorsPopup";

export type ValidationStatus = {
  status: "success" | "warning" | "error";
  message: string;
  schemaErrors?: SchemaValidationError[];
  syntaxError?: string;
};

export type SchemaValidationError = {
  linePrefix?: string;
  message: string;
  path: (string | number)[];
  docLink?: string;
};

type CreateBrowser = (
  id: string,
  schemaDoc: SchemaDocument
) => {
  _cache: Record<string, SchemaDocument>;
};

const DEFAULT_SCHEMA_ID = "https://studio.ioflux.org/schema";
const DEFAULT_SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema";
const DEFAULT_EDITOR_PANEL_WIDTH = 25; // in percentage

const JSON_SCHEMA_DIALECTS = [
  "https://json-schema.org/draft/2020-12/schema",
  "https://json-schema.org/draft/2019-09/schema",
  "http://json-schema.org/draft-07/schema#",
  "http://json-schema.org/draft-06/schema#",
  "http://json-schema.org/draft-04/schema#",
];
const SUPPORTED_DIALECTS = ["https://json-schema.org/draft/2020-12/schema"];

const VALIDATION_UI = {
  success: {
    message: "✓ Valid JSON Schema",
    className: "text-[var(--color-success)] font-semibold",
  },
  warning: {
    message: `⚠ Schema dialect not provided. Using default dialect: ${DEFAULT_SCHEMA_DIALECT}`,
    className: "text-[var(--color-warning)] break-words",
  },
  error: {
    message: "✗ ",
    className: "text-[var(--color-danger)] break-words",
  },
};


const saveSchemaJSON = (key: string, schema: JSONSchema) => {
  sessionStorage.setItem(key, JSON.stringify(schema, null, 2));
};

const MonacoEditor = () => {
  const {
    theme,
    isFullScreen,
    containerRef,
    schemaFormat,
    changeSchemaFormat,
    selectedNode,
    schemaText,
    setSchemaText,
    triggerExportGraph,
  } = useContext(AppContext);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Colors come from the design-token primitives in src/index.css
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

    monaco.editor.setTheme(theme === "dark" ? "studio-dark" : "studio-light");
  };

  const [compiledSchema, setCompiledSchema] = useState<CompiledSchema | null>(
    null
  );

  const [activeEditorTab, setActiveEditorTab] = useState<"schema" | "instance">("schema");

  const [instanceText, setInstanceTextState] = useState<string>(() => {
    const raw = sessionStorage.getItem(SESSION_INSTANCE_KEY);
    return raw ?? JSON.stringify(defaultInstance, null, 2);
  });

  const setInstanceText = (text: string) => {
    setInstanceTextState(text);
    try {
      sessionStorage.setItem(SESSION_INSTANCE_KEY, text);
    } catch {
      // sessionStorage can be unavailable (private mode); the editor still works
    }
  };

  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [traceStepIndex, setTraceStepIndex] = useState(0);
  const [isTracePlaying, setIsTracePlaying] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);

  const TRACE_PLAY_INTERVAL_MS = 700;

  const runTrace = () => {
    if (!compiledSchema) return;
    try {
      const instanceValue = JSON.parse(instanceText);
      setTraceResult(traceInstance(compiledSchema, instanceValue));
      setTraceStepIndex(0);
      setIsTracePlaying(false);
      setTraceError(null);
    } catch (err) {
      setTraceResult(null);
      setTraceError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    setTraceResult(null);
    setTraceStepIndex(0);
    setIsTracePlaying(false);
    setTraceError(null);
  }, [compiledSchema]);

  useEffect(() => {
    if (!isTracePlaying || !traceResult) return;
    if (traceStepIndex >= traceResult.steps.length - 1) {
      setIsTracePlaying(false);
      return;
    }
    const timer = setTimeout(
      () => setTraceStepIndex((i) => i + 1),
      TRACE_PLAY_INTERVAL_MS
    );
    return () => clearTimeout(timer);
  }, [isTracePlaying, traceStepIndex, traceResult]);

  const currentTraceStep = traceResult?.steps[traceStepIndex] ?? null;

  const activeTraceStep: ActiveTraceStep | null = currentTraceStep
    ? { schemaUri: currentTraceStep.schemaUri, status: currentTraceStep.type }
    : null;

  useEffect(() => {
    if (activeEditorTab !== "instance" || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const clearTraceDecorations = () => {
      const old = model
        .getAllDecorations()
        .filter((d: any) => d.options.className?.startsWith("monaco-trace-"))
        .map((d: any) => d.id);
      model.deltaDecorations(old, []);
    };

    if (!currentTraceStep) {
      clearTraceDecorations();
      return;
    }

    const path = pointerToPath(currentTraceStep.instancePointer);
    const range = getHighlightedNodeRangeFromPath(instanceText, path, "json");
    if (!range) {
      clearTraceDecorations();
      return;
    }

    const startPos = model.getPositionAt(range.start);
    const endPos = model.getPositionAt(range.end);
    editorRef.current.revealPositionInCenter(startPos);

    const decoration = {
      range: new (window as any).monaco.Range(
        startPos.lineNumber,
        1,
        endPos.lineNumber,
        1
      ),
      options: {
        isWholeLine: true,
        className: `monaco-trace-${currentTraceStep.type}`,
      },
    };

    const old = model
      .getAllDecorations()
      .filter((d: any) => d.options.className?.startsWith("monaco-trace-"))
      .map((d: any) => d.id);
    model.deltaDecorations(old, [decoration]);
  }, [currentTraceStep, activeEditorTab, instanceText]);

  const fileInputRef = useRef<HTMLInputElement>(null);


  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      if (file.name.endsWith(".json")) {
        changeSchemaFormat("json");
      } else if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
        changeSchemaFormat("yaml");
      }
      setSchemaText(content);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = "";
  };

  useEffect(() => {
    const blockBrowser = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragover", blockBrowser);
    document.addEventListener("drop", blockBrowser);
    return () => {
      document.removeEventListener("dragover", blockBrowser);
      document.removeEventListener("drop", blockBrowser);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault(); // Required to allow dropping
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["json", "yaml", "yml"].includes(ext ?? "")) return;
    loadFile(file);
  };

  const [schemaValidation, setSchemaValidation] = useState<ValidationStatus>({
    status: "success",
    message: VALIDATION_UI["success"].message,
  });

  const [activeErrorIndex, setActiveErrorIndex] = useState<number | null>(null);
  const [warningPopupOpen, setWarningPopupOpen] = useState(false);
  const [editorVisible, setEditorVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const MOBILE_BREAKPOINT = 768;
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () =>
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (schemaValidation.status !== "warning") {
      setWarningPopupOpen(false);
    }
  }, [schemaValidation.status]);

  useEffect(() => {
    editorPanelRef.current?.resize(isMobile ? 40 : DEFAULT_EDITOR_PANEL_WIDTH);
    setEditorVisible(true);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportResize = () => {
      const keyboardHeight = window.innerHeight - viewport.height;
      const isKeyboardOpen = keyboardHeight > 100;
      if (isKeyboardOpen) {
        const totalHeight = window.innerHeight;
        const visiblePercent = Math.round(
          (viewport.height / totalHeight) * 100
        );
        const editorPercent = Math.max(
          40,
          Math.min(Math.round(visiblePercent * 0.55), 70)
        );
        editorPanelRef.current?.resize(editorPercent);
        if (!editorVisible) {
          setEditorVisible(true);
        }
      } else {
        editorPanelRef.current?.resize(40);
      }
    };

    viewport.addEventListener("resize", handleViewportResize);
    return () => viewport.removeEventListener("resize", handleViewportResize);
  }, [isMobile, editorVisible]);

  const toggleEditorVisibility = () => {
    if (!editorPanelRef.current) return;

    setIsAnimating(true);

    if (editorVisible) {
      editorPanelRef.current.collapse();
    } else {
      editorPanelRef.current.resize(isMobile ? 40 : DEFAULT_EDITOR_PANEL_WIDTH);
    }

    setEditorVisible((prev) => !prev);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const highlightPathInEditor = (path: (string | number)[]) => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const text = model.getValue();
    const range = getHighlightedNodeRangeFromPath(text, path, schemaFormat);
    if (!range) return;

    const startPos = model.getPositionAt(range.start);
    const endPos = model.getPositionAt(range.end);

    editorRef.current.revealPositionInCenter(startPos);
    editorRef.current.setPosition(startPos);

    const decoration = {
      range: new (window as any).monaco.Range(
        startPos.lineNumber,
        1,
        endPos.lineNumber,
        1
      ),
      options: { isWholeLine: true, className: "monaco-highlight-line" },
    };

    const oldDecorations = model
      .getAllDecorations()
      .filter((d: any) => d.options.className === "monaco-highlight-line")
      .map((d: any) => d.id);

    model.deltaDecorations(oldDecorations, [decoration]);
  };

  useEffect(() => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    if (!selectedNode?.id) {
      const oldDecorations = model
        .getAllDecorations()
        .filter((d: any) => d.options.className === "monaco-highlight-line")
        .map((d: any) => d.id);
      model.deltaDecorations(oldDecorations, []);
      return;
    }

    const uriParts = selectedNode.id.split("#");
    const fragment = uriParts.length > 1 ? uriParts[1] : "";

    const path = fragment
      .split("/")
      .filter((segment: string) => segment !== "")
      .map((segment: string) => {
        const decoded = decodeURIComponent(segment);
        return /^\d+$/.test(decoded) ? parseInt(decoded, 10) : decoded;
      });

    highlightPathInEditor(path);
  }, [selectedNode?.id, schemaFormat, schemaText]);

  const instanceId = useMemo(() => Math.random().toString(36).slice(2), []);

  useEffect(() => {
    if (!schemaText.trim()) return;

    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        const parsedSchema = parseSchema(schemaText, schemaFormat);
        const schemaForBuild = structuredClone(parsedSchema);

        const dialect = typeof parsedSchema !== "boolean" ? parsedSchema.$schema : undefined;
        const dialectVersion = dialect ?? DEFAULT_SCHEMA_DIALECT;
        // Use per-instance suffix so multiple instances never share the same registry key.
        const schemaId = (typeof parsedSchema !== "boolean" ? parsedSchema.$id : undefined)
          ?? `${DEFAULT_SCHEMA_ID}/${instanceId}`;

        if (
          JSON_SCHEMA_DIALECTS.includes(dialectVersion) &&
          !SUPPORTED_DIALECTS.includes(dialectVersion)
        ) {
          throw new Error(`Dialect "${dialectVersion}" is not supported yet.`);
        }

        const schemaDocument = buildSchemaDocument(
          schemaForBuild as SchemaObject,
          schemaId,
          dialectVersion
        );

        const createBrowser: CreateBrowser = (id, schemaDoc) => {
          return {
            _cache: {
              [id]: schemaDoc,
            },
          };
        };

        const browser = createBrowser(schemaId, schemaDocument);
        // The Hyperjump `getSchema` expects a full browser instance, but we only need the _cache
        // property for local-only resolution. This cast is safe because our usage only triggers cache lookup.
        // @ts-expect-error
        const schema = await getSchema(schemaDocument.baseUri, browser);

        // Clear cache and set format to BASIC so that meta-schema validation
        // actually produces the .output.errors array instead of a boolean
        unregisterSchema(schemaId);
        setMetaSchemaOutputFormat("BASIC");

        let schemaValidationStatus: ValidationStatus = {
          status: "success",
          message: VALIDATION_UI["success"].message,
        };

        try {
          const compiled = await compile(schema);
          if (cancelled) return;

          setCompiledSchema(compiled);
          if (!dialect && typeof parsedSchema !== "boolean") {
            schemaValidationStatus = {
              status: "warning",
              message: VALIDATION_UI["warning"].message,
            };
          }

          // Reset stale error pointer whenever schema becomes valid.
          setActiveErrorIndex(null);
          setSchemaValidation(schemaValidationStatus);
        } catch (compileErr) {
          // If compile fails, it could be InvalidSchemaError
          const isInvalidSchema =
            compileErr instanceof InvalidSchemaError &&
            (compileErr as any).output?.errors;

          if (isInvalidSchema) {
            const rawOutput = (compileErr as any).output;
            const fixedOutput = {
              ...rawOutput,
              errors: (rawOutput.errors || []).map((err: any) => {
                const hashIdx = err.instanceLocation.indexOf("#");
                return {
                  ...err,
                  instanceLocation: hashIdx !== -1 ? err.instanceLocation.substring(hashIdx) : "#"
                };
              })
            };

            const hjErrors = await jsonSchemaErrors(
              fixedOutput,
              dialectVersion,
              schemaForBuild as any
            );

            if (cancelled) return;

            const schemaErrors: SchemaValidationError[] = hjErrors.map(
              (err) => {
                const fragment = err.instanceLocation.substring(1); // removes #
                const path: (string | number)[] = fragment
                  ? [...pointerSegments(fragment)].map((s) =>
                    /^\d+$/.test(s) ? parseInt(s, 10) : s
                  )
                  : [];
                const displayPath = fragment || "#";
                const keywordLabel = path.length > 0 ? String(path[path.length - 1]) : "";

                let linePrefix = "";
                const range = getHighlightedNodeRangeFromPath(schemaText, path, schemaFormat);
                if (range) {
                  const lineNumber = schemaText.slice(0, range.start).split("\n").length;
                  linePrefix = `[Line ${lineNumber}]`;
                }

                return {
                  linePrefix,
                  message: `${displayPath}: ${err.message}`,
                  path,
                  docLink: keywordLabel ? getKeywordDocLink(keywordLabel) : undefined,
                  _lineNumber: range ? schemaText.slice(0, range.start).split("\n").length : 999999,
                };
              }
            );

            schemaErrors.sort((a, b) => (a as any)._lineNumber - (b as any)._lineNumber);

            setActiveErrorIndex(null);
            setSchemaValidation({
              status: "error",
              message: schemaErrors.length === 1
                ? "✗ Schema error (click to locate)"
                : `✗ ${schemaErrors.length} schema errors (click to locate)`,
              schemaErrors,
            });
          } else {
            throw compileErr; // Let the outer catch handle other runtime errors
          }
        }

        if (cancelled) return;
        saveSchemaJSON(SESSION_SCHEMA_KEY, parsedSchema);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setSchemaValidation({
          status: "error",
          message: VALIDATION_UI["error"].message + message,
          syntaxError: message,
        });
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [schemaText, schemaFormat]);

  const editorPanel = (
    <Panel
      className="flex flex-col h-full w-full relative bg-[var(--editor-panel-bg-color)]"
      defaultSize={isMobile ? 40 : DEFAULT_EDITOR_PANEL_WIDTH}
      ref={editorPanelRef}
      collapsible
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-1 px-2 pt-1.5 bg-[var(--toolbar-bg-color)] border-b border-[var(--toolbar-border-color)]">
        <button
          onClick={() => setActiveEditorTab("schema")}
          className={`h-[26px] px-2.5 text-xs font-medium rounded-t-md border border-b-0 transition-colors duration-200 ${
            activeEditorTab === "schema"
              ? "bg-[var(--bg-color)] border-[var(--toolbar-border-color)] text-[var(--text-color)]"
              : "border-transparent text-[var(--text-secondary-color)] hover:text-[var(--text-color)]"
          }`}
        >
          Schema
        </button>
        <button
          onClick={() => setActiveEditorTab("instance")}
          className={`h-[26px] px-2.5 text-xs font-medium rounded-t-md border border-b-0 transition-colors duration-200 ${
            activeEditorTab === "instance"
              ? "bg-[var(--bg-color)] border-[var(--toolbar-border-color)] text-[var(--text-color)]"
              : "border-transparent text-[var(--text-secondary-color)] hover:text-[var(--text-color)]"
          }`}
        >
          Instance
        </button>
      </div>
      {activeEditorTab === "schema" ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--toolbar-bg-color)] border-b border-[var(--toolbar-border-color)]">
          <input
            type="file"
            id="schema-file-input"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.yaml,.yml"
            className="hidden"
          />
          <div className="ml-auto flex items-center gap-2 overflow-x-auto toolbar-scroll">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-[28px] flex items-center gap-1.5 bg-[var(--bg-color)] border border-[var(--toolbar-border-color)] text-[var(--text-color)] text-xs font-medium px-2.5 rounded-md hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-all duration-200 cursor-pointer"
              aria-label="Upload JSON/YAML schema file"
              title="Upload JSON/YAML (or drag & drop)"
            >
              <BsUpload size={11} />
              <span>Upload</span>
            </button>
            <button
              onClick={triggerExportGraph}
              className="h-[28px] flex items-center gap-1.5 bg-[var(--bg-color)] border border-[var(--toolbar-border-color)] text-[var(--text-color)] text-xs font-medium px-2.5 rounded-md hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-all duration-200 cursor-pointer"
              aria-label="Export graph as image"
              title="Export graph as image"
            >
              <BsDownload size={11} />
              <span>Export</span>
            </button>
            <button
              id="schema-format-toggle"
              type="button"
              role="switch"
              aria-checked={schemaFormat === "yaml"}
              aria-label={`Schema format: ${schemaFormat.toUpperCase()}`}
              title={`Switch to ${schemaFormat === "json" ? "YAML" : "JSON"}`}
              onClick={() =>
                changeSchemaFormat(schemaFormat === "json" ? "yaml" : "json")
              }
              className="relative h-[28px] w-[68px] flex-shrink-0 rounded-full bg-[var(--bg-color)] border border-[var(--toolbar-border-color)] cursor-pointer hover:border-[var(--accent-color)] transition-colors duration-200"
            >
              <span
                aria-hidden
                className={`absolute top-1/2 -translate-y-1/2 h-[20px] w-[20px] rounded-full bg-[var(--accent-color)] transition-all duration-200 ${
                  schemaFormat === "json" ? "left-[3px]" : "left-[calc(100%-23px)]"
                }`}
              />
              <span
                aria-hidden
                className={`absolute top-1/2 -translate-y-1/2 text-[10px] font-semibold tracking-wide text-[var(--text-color)] ${
                  schemaFormat === "json" ? "right-2.5" : "left-2.5"
                }`}
              >
                {schemaFormat.toUpperCase()}
              </span>
            </button>
          </div>
          {/* Inline validation status indicator */}
          {schemaValidation.status === "warning" ? (
            <button
              id="validation-status-icon"
              type="button"
              aria-label={`${schemaValidation.message} (click for details)`}
              title={schemaValidation.message}
              onClick={() => setWarningPopupOpen(state => !state)}
              className={`text-base leading-none cursor-pointer hover:opacity-75 transition-opacity ${VALIDATION_UI[schemaValidation.status].className.replace("break-words", "")}`}
            >
              ⚠
            </button>
          ) : (
            <span
              id="validation-status-icon"
              aria-label={schemaValidation.message}
              title={schemaValidation.message}
              className={`text-sm leading-none ${VALIDATION_UI[schemaValidation.status].className.replace("break-words", "")}`}
              aria-hidden
            >
              {schemaValidation.status === "success" && "✓"}
              {schemaValidation.status === "error" && "✗"}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--toolbar-bg-color)] border-b border-[var(--toolbar-border-color)]">
          {!traceResult ? (
            <button
              onClick={runTrace}
              disabled={!compiledSchema}
              className="h-[28px] flex items-center gap-1.5 bg-[var(--bg-color)] border border-[var(--toolbar-border-color)] text-[var(--text-color)] text-xs font-medium px-2.5 rounded-md hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Run trace"
              title="Step through validation of this instance against the schema"
            >
              <MdPlayArrow size={13} />
              <span>Run Trace</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setTraceStepIndex((i) => Math.max(i - 1, 0))}
                disabled={traceStepIndex === 0}
                className="h-[28px] w-[28px] flex items-center justify-center rounded-md border border-[var(--toolbar-border-color)] text-[var(--text-color)] hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous step"
                title="Previous step"
              >
                <MdSkipPrevious size={16} />
              </button>
              <button
                onClick={() => setIsTracePlaying((p) => !p)}
                className="h-[28px] w-[28px] flex items-center justify-center rounded-md border border-[var(--toolbar-border-color)] text-[var(--text-color)] hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-all duration-200 cursor-pointer"
                aria-label={isTracePlaying ? "Stop" : "Play"}
                title={isTracePlaying ? "Stop" : "Play"}
              >
                {isTracePlaying ? <MdPause size={14} /> : <MdPlayArrow size={14} />}
              </button>
              <button
                onClick={() =>
                  setTraceStepIndex((i) =>
                    Math.min(i + 1, traceResult.steps.length - 1)
                  )
                }
                disabled={traceStepIndex >= traceResult.steps.length - 1}
                className="h-[28px] w-[28px] flex items-center justify-center rounded-md border border-[var(--toolbar-border-color)] text-[var(--text-color)] hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next step"
                title="Next step"
              >
                <MdSkipNext size={16} />
              </button>
              <span className="text-[11px] text-[var(--text-secondary-color)] font-mono">
                {traceStepIndex + 1}/{traceResult.steps.length}
              </span>
              <button
                onClick={runTrace}
                className="h-[28px] w-[28px] flex items-center justify-center rounded-md border border-[var(--toolbar-border-color)] text-[var(--text-color)] hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-all duration-200 cursor-pointer"
                aria-label="Re-run trace"
                title="Re-run trace"
              >
                <MdReplay size={14} />
              </button>
              <span
                className={`text-sm leading-none ml-1 ${
                  traceResult.valid ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                }`}
                title={traceResult.valid ? "Instance is valid" : "Instance is invalid"}
                aria-hidden
              >
                {traceResult.valid ? "✓" : "✗"}
              </span>
            </>
          )}
          {traceError && (
            <span
              className="text-xs text-[var(--color-danger)] break-words"
              title={traceError}
            >
              {traceError}
            </span>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Editor
          key={activeEditorTab}
          height="100%"
          width="100%"
          language={activeEditorTab === "schema" ? schemaFormat : "json"}
          value={activeEditorTab === "schema" ? schemaText : instanceText}
          theme={theme === "light" ? "studio-light" : "studio-dark"}
          options={{
            minimap: { enabled: false },
            occurrencesHighlight: "off",
            renderLineHighlightOnlyWhenFocus: true,
          }}
          onChange={(value) =>
            activeEditorTab === "schema"
              ? setSchemaText(value ?? "")
              : setInstanceText(value ?? "")
          }
          onMount={handleEditorDidMount}
        />
      </div>
    </Panel>
  );

  const visualizationPanel = (
    <Panel
      minSize={isMobile ? undefined : 60}
      className="flex flex-col relative bg-[var(--visualize-bg-color)]"
    >
      <SchemaVisualization compiledSchema={compiledSchema} activeTraceStep={activeTraceStep} />
      <SchemaErrorsPopup
        schemaValidation={schemaValidation}
        activeErrorIndex={activeErrorIndex}
        setActiveErrorIndex={setActiveErrorIndex}
        highlightPathInEditor={highlightPathInEditor}
        warningPopupOpen={warningPopupOpen}
        onCloseWarningPopup={() => setWarningPopupOpen(false)}
      />
    </Panel>
  );

  const resizeHandle = (
    <PanelResizeHandle
      className={`${isMobile ? "h-[2px]" : "w-[3px]"} ${
        isMobile && !editorVisible
          ? "bg-transparent"
          : isMobile
            ? "accent-separator-fill"
            : "bg-[var(--toolbar-border-color)]"
      } relative active:bg-[var(--accent-color)] transition-colors duration-200`}
    >
      {(!isMobile || editorVisible) && (
        <div>
          <EditorToggleButton
            className={
              isMobile
                ? "absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                : "absolute top-2 left-2 z-10"
            }
            editorVisible={editorVisible}
            toggleEditorVisibility={toggleEditorVisibility}
            isMobile={isMobile}
          />
        </div>
      )}
    </PanelResizeHandle>
  );

  return (
    <div
      ref={containerRef}
      className={`flex-1 min-h-0 flex flex-col relative ${
        isAnimating ? "panel-animating" : ""
      }`}
    >
      {isFullScreen && <NavigationBar />}
      <PanelGroup
        className="flex-1"
        direction={isMobile ? "vertical" : "horizontal"}
      >
        {isMobile ? (
          <>
            {visualizationPanel}
            {resizeHandle}
            {editorPanel}
          </>
        ) : (
          <>
            {editorPanel}
            {resizeHandle}
            {visualizationPanel}
          </>
        )}
      </PanelGroup>
      {isMobile && !editorVisible && (
        <div
          className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <EditorToggleButton
            className="pointer-events-auto"
            editorVisible={editorVisible}
            toggleEditorVisibility={toggleEditorVisibility}
            isMobile={true}
          />
        </div>
      )}
    </div>
  );
};

export default MonacoEditor;
