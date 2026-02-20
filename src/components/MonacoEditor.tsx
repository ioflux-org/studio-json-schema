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
import { AppContext } from "../contexts/AppContext";
import SchemaVisualization from "./SchemaVisualization";
import FullscreenToggleButton from "./FullscreenToggleButton";
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

type SchemaFormat = "json" | "yaml";

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
  const { theme, isFullScreen, containerRef, schemaFormat, selectedNode } =
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

  const toggleEditorVisibility = () => {
    if (!editorPanelRef.current) return;

    setIsAnimating(true);

    if (editorVisible) {
      editorPanelRef.current.collapse();
    } else {
      editorPanelRef.current.expand();
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
      editorRef.current.focus();

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
      {isFullScreen && (
        <div className="w-full px-1 bg-[var(--view-bg-color)] justify-items-end">
          <div className="text-[var(--view-text-color)]">
            <FullscreenToggleButton />
          </div>
        </div>
      )}
      <PanelGroup direction="horizontal">
        <Panel
          className="flex flex-col"
          defaultSize={25}
          ref={editorPanelRef}
          collapsible
        >
          <Editor
            height="90%"
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
              className={"absolute top-2 left-2 z-10"}
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
