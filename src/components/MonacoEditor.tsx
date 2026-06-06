import { useContext, useState, useEffect, useRef } from "react";
import { BsUpload, BsDownload } from "react-icons/bs";
import { SESSION_SCHEMA_KEY } from "../constants";

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
// INFO: modifying the following import statement to (import type { SchemaObject } from "@hyperjump/json-schema/draft-2020-12") creates error;
import { type SchemaObject } from "@hyperjump/json-schema/draft-2020-12";
import {
  getSchema,
  compile,
  buildSchemaDocument,
  type CompiledSchema,
  type SchemaDocument,
} from "@hyperjump/json-schema/experimental";

import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { AppContext, type SchemaFormat } from "../contexts/AppContext";
import SchemaVisualization from "./SchemaVisualization";
import NavigationBar from "./NavigationBar";
import EditorToggleButton from "./EditorToggleButton";
import {
  parseSchema,
  getHighlightedNodeRangeFromPath,
  type JSONSchema,
} from "../utils/parseSchema";

type ValidationStatus = {
  status: "success" | "warning" | "error";
  message: string;
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

const getValidationUI = (theme: "light" | "dark") => ({
  success: {
    message: "✓ Valid JSON Schema",
    className: "text-green-400 font-semibold",
  },
  warning: {
    message: `⚠ Schema dialect not provided. Using default dialect: ${DEFAULT_SCHEMA_DIALECT}`,
    className:
      theme === "dark"
        ? "text-yellow-400 break-words"
        : "text-amber-800 break-words",
  },
  error: {
    message: "✗ ",
    className:
      theme === "dark"
        ? "text-red-400 break-words"
        : "text-red-700 break-words",
  },
});


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

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const [compiledSchema, setCompiledSchema] = useState<CompiledSchema | null>(
    null
  );

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

  const VALIDATION_UI = getValidationUI(theme);

  const [schemaValidation, setSchemaValidation] = useState<ValidationStatus>({
    status: "success",
    message: VALIDATION_UI["success"].message,
  });

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

    const text = model.getValue();

    const uriParts = selectedNode.id.split("#");
    const fragment = uriParts.length > 1 ? uriParts[1] : "";

    const path = fragment
      .split("/")
      .filter((segment: string) => segment !== "")
      .map((segment: string) => {
        const decoded = decodeURIComponent(segment);
        return /^\d+$/.test(decoded) ? parseInt(decoded, 10) : decoded;
      });

    const highlightedNodeRange = getHighlightedNodeRangeFromPath(
      text,
      path,
      schemaFormat
    );

    if (highlightedNodeRange) {
      const startPos = model.getPositionAt(highlightedNodeRange.start);
      const endPos = model.getPositionAt(highlightedNodeRange.end);

      editorRef.current.revealPositionInCenter(startPos);
      editorRef.current.setPosition(startPos);

      const decoration = {
        range: new (window as any).monaco.Range(
          startPos.lineNumber,
          1,
          endPos.lineNumber,
          1
        ),
        options: {
          isWholeLine: true,
          className: "monaco-highlight-line",
        },
      };

      const oldDecorations = model
        .getAllDecorations()
        .filter((d: any) => d.options.className === "monaco-highlight-line")
        .map((d: any) => d.id);

      model.deltaDecorations(oldDecorations, [decoration]);
    }
  }, [selectedNode?.id, schemaFormat, schemaText]);


  useEffect(() => {
    if (!schemaText.trim()) return;

    const timeout = setTimeout(async () => {
      try {
        // INFO: parsedSchema is mutated by buildSchemaDocument function
        const parsedSchema = parseSchema(schemaText, schemaFormat);
        const copy = structuredClone(parsedSchema);

        const dialect = parsedSchema.$schema;
        const dialectVersion = dialect ?? DEFAULT_SCHEMA_DIALECT;
        const schemaId = parsedSchema.$id ?? DEFAULT_SCHEMA_ID;

        if (
          JSON_SCHEMA_DIALECTS.includes(dialectVersion) &&
          !SUPPORTED_DIALECTS.includes(dialectVersion)
        ) {
          throw new Error(`Dialect "${dialectVersion}" is not supported yet.`);
        }

        const schemaDocument = buildSchemaDocument(
          parsedSchema as SchemaObject,
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

        setCompiledSchema(await compile(schema));
        setSchemaValidation(
          !dialect && typeof parsedSchema !== "boolean"
            ? {
                status: "warning",
                message: VALIDATION_UI["warning"].message,
              }
            : {
                status: "success",
                message: VALIDATION_UI["success"].message,
              }
        );

        saveSchemaJSON(SESSION_SCHEMA_KEY, copy);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        setSchemaValidation({
          status: "error",
          message: VALIDATION_UI["error"].message + message,
        });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [schemaText, schemaFormat]);

  const editorPanel = (
    <Panel
      className="flex flex-col h-full w-full relative"
      defaultSize={isMobile ? 40 : DEFAULT_EDITOR_PANEL_WIDTH}
      ref={editorPanelRef}
      collapsible
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 px-2 py-1 bg-[var(--validation-bg-color)] border-b border-[var(--popup-border-color)]">
          <input
            type="file"
            id="schema-file-input"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.yaml,.yml"
            className="hidden"
          />
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-[26px] flex items-center gap-1.5 bg-[var(--bg-color)] border border-[var(--popup-border-color)] text-[var(--text-color)] text-sm px-1.5 rounded-sm hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Upload JSON/YAML schema file"
              title="Upload JSON/YAML (or drag & drop)"
            >
              <BsUpload size={12} />
              <span>Upload</span>
            </button>
            <button
              onClick={triggerExportGraph}
              className="h-[26px] flex items-center gap-1.5 bg-[var(--bg-color)] border border-[var(--popup-border-color)] text-[var(--text-color)] text-sm px-1.5 rounded-sm hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Export graph as image"
              title="Export graph as image"
            >
              <BsDownload size={12} />
              <span>Export</span>
            </button>
            <label htmlFor="schema-format-select" className="sr-only">
              Schema format
            </label>
            <select
              id="schema-format-select"
              value={schemaFormat}
              onChange={(e) => changeSchemaFormat(e.target.value as SchemaFormat)}
              className="h-[26px] min-w-[60px] px-1 flex-shrink-0 bg-[var(--bg-color)] text-[var(--text-color)] text-sm outline-none cursor-pointer border border-[var(--popup-border-color)] rounded-sm"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </select>
          </div>
        </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          width="100%"
          language={schemaFormat}
          value={schemaText}
          theme={theme === "light" ? "vs-light" : "vs-dark"}
          options={{
            minimap: { enabled: false },
            occurrencesHighlight: "off",
          }}
          onChange={(value) => setSchemaText(value ?? "")}
          onMount={handleEditorDidMount}
        />
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-label={`Schema validation: ${schemaValidation.message}`}
        className="shrink-0 px-2 py-1.5 bg-[var(--validation-bg-color)] text-sm"
      >
        <span className={VALIDATION_UI[schemaValidation.status].className}>
            {schemaValidation.message}
          </span>
        </div>
    </Panel>
  );

  const visualizationPanel = (
    <Panel
      minSize={isMobile ? undefined : 60}
      className="flex flex-col relative bg-[var(--visualize-bg-color)]"
    >
      <SchemaVisualization compiledSchema={compiledSchema} />
    </Panel>
  );

  const resizeHandle = (
    <PanelResizeHandle
      className={`${isMobile ? "h-[1px]" : "w-[1px]"} ${
        isMobile && !editorVisible ? "bg-transparent" : "bg-gray-400"
      } relative`}
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
