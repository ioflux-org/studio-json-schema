import { useContext, useState, useEffect, useRef } from "react";

import { parseTree, findNodeAtLocation } from "jsonc-parser";
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
import defaultSchema from "../data/defaultJSONSchema.json";
import { AppContext, type SchemaFormat } from "../contexts/AppContext";
import SchemaVisualization from "./SchemaVisualization";
import NavigationBar from "./NavigationBar";
import EditorToggleButton from "./EditorToggleButton";
import { parseSchema } from "../utils/parseSchema";
import YAML from "js-yaml";
import type { JSONSchema } from "@apidevtools/json-schema-ref-parser";

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
const SESSION_SCHEMA_KEY = "ioflux.schema.editor.content";
const SESSION_FORMAT_KEY = "ioflux.schema.editor.format";
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
    className: theme === "dark" ? "text-yellow-400" : "text-amber-800",
  },
  error: {
    message: "✗ ",
    className: "text-red-400",
  },
});

const saveFormat = (key: string, format: SchemaFormat) => {
  sessionStorage.setItem(key, format);
};

const loadSchemaJSON = (key: string): any => {
  const raw = sessionStorage.getItem(key);
  if (!raw) return defaultSchema;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultSchema;
  }
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
    showFormatWarning,
  } =
    useContext(AppContext);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const [compiledSchema, setCompiledSchema] = useState<CompiledSchema | null>(
    null
  );

  const initialSchemaJSON = loadSchemaJSON(SESSION_SCHEMA_KEY);

  const [schemaText, setSchemaText] = useState<string>(
    schemaFormat === "yaml"
      ? YAML.dump(initialSchemaJSON)
      : JSON.stringify(initialSchemaJSON, null, 2)
  );

  const VALIDATION_UI = getValidationUI(theme);

  const [schemaValidation, setSchemaValidation] = useState<ValidationStatus>({
    status: "success",
    message: VALIDATION_UI["success"].message,
  });

  const [editorVisible, setEditorVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFormatWarningPopup, setShowFormatWarningPopup] = useState(false);

  useEffect(() => {
    if (showFormatWarning) {
      setShowFormatWarningPopup(true);
      // Auto-dismiss popup after 5 seconds
      const timer = setTimeout(() => setShowFormatWarningPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showFormatWarning]);

  const toggleEditorVisibility = () => {
    if (!editorPanelRef.current) return;

    setIsAnimating(true);

    if (editorVisible) {
      editorPanelRef.current.collapse();
    } else {
      editorPanelRef.current.resize(DEFAULT_EDITOR_PANEL_WIDTH);
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

    const tree = parseTree(text);
    if (!tree) return;

    const node = findNodeAtLocation(tree, path);

    if (node) {
      const startPos = model.getPositionAt(node.offset);
      const endPos = model.getPositionAt(node.offset + node.length);

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
  }, [selectedNode?.id]);

  useEffect(() => {
    saveFormat(SESSION_FORMAT_KEY, schemaFormat);

    const schemaJSON = loadSchemaJSON(SESSION_SCHEMA_KEY);

    setSchemaText(
      schemaFormat === "yaml"
        ? YAML.dump(schemaJSON)
        : JSON.stringify(schemaJSON, null, 2)
    );
  }, [schemaFormat]);

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

  return (
    <div
      ref={containerRef}
      className={`h-[92vh] flex flex-col ${
        isAnimating ? "panel-animating" : ""
      }`}
    >
      {isFullScreen && <NavigationBar />}
      {showFormatWarning && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-sm text-yellow-800">
          ⚠️ Invalid editor format detected in session storage. Resetting to JSON.
        </div>
      )}
      {showFormatWarningPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 max-w-md shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">Format Reset</h3>
                <p className="text-yellow-800 text-sm">
                  Invalid editor format was detected in your session storage and has been automatically reset to JSON. Your schema content has been preserved.
                </p>
              </div>
              <button
                onClick={() => setShowFormatWarningPopup(false)}
                className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 font-bold text-xl leading-none w-6 h-6 flex items-center justify-center"
                aria-label="Close warning"
              >
                ✕
              </button>
            </div>
            <button
              onClick={() => setShowFormatWarningPopup(false)}
              className="mt-4 w-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-medium py-2 px-4 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <PanelGroup direction="horizontal">
        <Panel
          className="flex flex-col"
          defaultSize={DEFAULT_EDITOR_PANEL_WIDTH}
          ref={editorPanelRef}
          collapsible
        >
          <div className="flex items-center gap-2 px-2 py-1 bg-[var(--validation-bg-color)]">
            <select
              value={schemaFormat}
              onChange={(e) =>
                changeSchemaFormat(e.target.value as SchemaFormat)
              }
              className="ml-auto flex-shrink-0 bg-[var(--bg-color)] text-[var(--text-color)] text-sm outline-none cursor-pointer border border-[var(--popup-border-color)] rounded-sm"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </select>
          </div>
          <Editor
            height="87%"
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
          <div className="flex-1 p-2 bg-[var(--validation-bg-color)] text-sm overflow-y-auto">
            <div className={VALIDATION_UI[schemaValidation.status].className}>
              {schemaValidation.message}
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="w-[1px] bg-gray-400 relative">
          <div>
            <EditorToggleButton
              className={"absolute top-2 left-2 z-1"}
              editorVisible={editorVisible}
              toggleEditorVisibility={toggleEditorVisibility}
            />
          </div>
        </PanelResizeHandle>

        <Panel
          minSize={60}
          className="flex flex-col relative bg-[var(--visualize-bg-color)]"
        >
          <SchemaVisualization compiledSchema={compiledSchema} />
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default MonacoEditor;
